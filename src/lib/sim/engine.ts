import { cloneParams, type SimParams } from "../params";
import { PRODUCT_ORDER, randomProduct, type ProductId } from "../products";
import type {
  LogicNodeActivity,
  LogicNodeId,
  SimSnapshot,
  SimSpeed,
  SimStatus,
  StatsPoint,
  TankerState,
  TankState,
  TrainState,
  TugState,
} from "./types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptyLogic(): LogicNodeActivity {
  const ids: LogicNodeId[] = [
    "trainSource",
    "trainQueue",
    "railSelect",
    "unloadPetrol",
    "unloadDiesel",
    "unloadFuelOil",
    "unloadCrudeOil",
    "storagePetrol",
    "storageDiesel",
    "storageFuelOil",
    "storageCrudeOil",
    "pipelineHub",
    "berth",
    "tankerSource",
    "tugPool",
    "tankerSink",
  ];
  return Object.fromEntries(ids.map((id) => [id, 0])) as LogicNodeActivity;
}

function createTanks(params: SimParams, rng: () => number): TankState[] {
  const tanks: TankState[] = [];
  for (const product of PRODUCT_ORDER) {
    for (let i = 0; i < 4; i++) {
      const min = params.storageTankMinAmount;
      const cap = params.storageTankCapacity;
      const level = min + rng() * (cap - min) * 0.7;
      tanks.push({
        id: `${product}-${i}`,
        product,
        index: i,
        level,
        capacity: cap,
        blocked: level < min,
        reordering: false,
        alarm: level < min,
      });
    }
  }
  return tanks;
}

function createTugs(): TugState[] {
  return [0, 1, 2].map((i) => ({
    id: `tug-${i}`,
    busy: false,
    role: "idle" as const,
    targetTankerId: null,
  }));
}

function makeTanker(params: SimParams, rng: () => number, id: string): TankerState {
  const holds = [0, 1, 2, 3].map(() => ({
    product: randomProduct(rng),
    level: 0,
    capacity: params.tankerTankCapacity,
  }));
  return {
    id,
    holds,
    phase: "enroute",
    progress: 0,
    berthBusy: false,
  };
}

function storageKey(p: ProductId): LogicNodeId {
  const map: Record<ProductId, LogicNodeId> = {
    petrol: "storagePetrol",
    diesel: "storageDiesel",
    fuelOil: "storageFuelOil",
    crudeOil: "storageCrudeOil",
  };
  return map[p];
}

function unloadKey(p: ProductId): LogicNodeId {
  const map: Record<ProductId, LogicNodeId> = {
    petrol: "unloadPetrol",
    diesel: "unloadDiesel",
    fuelOil: "unloadFuelOil",
    crudeOil: "unloadCrudeOil",
  };
  return map[p];
}

export class OilTerminalSim {
  params: SimParams;
  status: SimStatus = "idle";
  speed: SimSpeed = 1;
  timeMinutes = 0;
  tanks: TankState[];
  trains: TrainState[] = [];
  trainQueue = 0;
  tanker: TankerState | null = null;
  tankerQueue = 0;
  tankersServed = 0;
  trainsServed = 0;
  tugs: TugState[];
  logicActivity: LogicNodeActivity;
  history: StatsPoint[] = [];
  eventLog: string[] = [];
  private rng: () => number;
  private nextTrainId = 1;
  private nextTankerId = 1;
  private timeToNextTanker: number;
  private lastHistoryT = -Infinity;
  private pendingReorder: Partial<Record<ProductId, number>> = {};

  constructor(seed = 42) {
    this.rng = mulberry32(seed);
    this.params = cloneParams();
    this.tanks = createTanks(this.params, this.rng);
    this.tugs = createTugs();
    this.logicActivity = emptyLogic();
    this.timeToNextTanker = this.params.tankerInterarrivalTime * 0.3;
    this.pushLog("Terminal ready — press Play");
  }

  reset(seed = Date.now() % 1e9) {
    this.rng = mulberry32(seed);
    this.status = "idle";
    this.speed = 1;
    this.timeMinutes = 0;
    this.tanks = createTanks(this.params, this.rng);
    this.trains = [];
    this.trainQueue = 0;
    this.tanker = null;
    this.tankerQueue = 0;
    this.tankersServed = 0;
    this.trainsServed = 0;
    this.tugs = createTugs();
    this.logicActivity = emptyLogic();
    this.history = [];
    this.eventLog = [];
    this.nextTrainId = 1;
    this.nextTankerId = 1;
    this.timeToNextTanker = this.params.tankerInterarrivalTime * 0.3;
    this.lastHistoryT = -Infinity;
    this.pendingReorder = {};
    this.pushLog("Simulation reset");
  }

  play() {
    if (this.status === "idle" || this.status === "paused") {
      const wasPaused = this.status === "paused";
      this.status = "running";
      this.pushLog(wasPaused ? "Resumed" : "Running");
    }
  }

  pause() {
    if (this.status === "running") {
      this.status = "paused";
      this.pushLog("Paused");
    }
  }

  stop() {
    this.reset();
  }

  setSpeed(s: SimSpeed) {
    this.speed = s;
  }

  private pushLog(msg: string) {
    const day = Math.floor(this.timeMinutes / (24 * 60)) + 1;
    const mins = Math.floor(this.timeMinutes % (24 * 60));
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    this.eventLog = [`D${day} ${hh}:${mm}  ${msg}`, ...this.eventLog].slice(0, 40);
  }

  private pulse(id: LogicNodeId, amount = 1) {
    this.logicActivity[id] = Math.min(1, this.logicActivity[id] + amount);
  }

  private decayLogic(dt: number) {
    for (const k of Object.keys(this.logicActivity) as LogicNodeId[]) {
      this.logicActivity[k] = Math.max(0, this.logicActivity[k] - dt * 0.15);
    }
  }

  /** Advance simulation by `dtMinutes` of model time */
  tick(dtMinutes: number) {
    if (this.status !== "running" || dtMinutes <= 0) return;
    const steps = Math.max(1, Math.ceil(dtMinutes / 0.25));
    const step = dtMinutes / steps;
    for (let i = 0; i < steps; i++) this.step(step);
  }

  private step(dt: number) {
    this.timeMinutes += dt;
    this.decayLogic(dt);
    this.updateTankAlarms();
    this.spawnTrainsForReorders();
    this.updateTrains(dt);
    this.updateTankerArrivals(dt);
    this.updateTanker(dt);
    this.updateLoading(dt);
    this.sampleHistory();
  }

  private updateTankAlarms() {
    const min = this.params.storageTankMinAmount;
    for (const tank of this.tanks) {
      const wasAlarm = tank.alarm;
      tank.blocked = tank.level < min;
      tank.alarm = tank.level < min;
      if (tank.alarm && !wasAlarm) {
        this.pushLog(`ALARM ${tank.id}: below min — reorder`);
        this.pendingReorder[tank.product] =
          (this.pendingReorder[tank.product] ?? 0) + 1;
        tank.reordering = true;
      }
      if (!tank.alarm) tank.reordering = false;
      this.pulse(storageKey(tank.product), tank.level / tank.capacity * 0.02);
    }
  }

  private spawnTrainsForReorders() {
    for (const product of PRODUCT_ORDER) {
      const need = this.pendingReorder[product] ?? 0;
      if (need <= 0) continue;
      const already = this.trains.some(
        (t) => t.product === product && t.phase !== "done",
      );
      if (already) continue;
      this.pendingReorder[product] = need - 1;
      this.trainQueue += 1;
      this.pulse("trainSource", 1);
      this.pulse("trainQueue", 1);
      const train: TrainState = {
        id: `train-${this.nextTrainId++}`,
        product,
        cargo: this.params.trainCapacity,
        capacity: this.params.trainCapacity,
        phase: "lead",
        progress: 0,
        leadRemaining: this.params.trainLeadTime,
      };
      this.trains.push(train);
      this.pushLog(`Train ordered for ${product}`);
    }
  }

  private updateTrains(dt: number) {
    for (const train of this.trains) {
      if (train.phase === "done") continue;
      if (train.phase === "lead") {
        train.leadRemaining -= dt;
        this.pulse("trainQueue", 0.05);
        if (train.leadRemaining <= 0) {
          train.phase = "approach";
          train.progress = 0;
          if (this.trainQueue > 0) this.trainQueue -= 1;
          this.pulse("railSelect", 1);
        }
        continue;
      }
      if (train.phase === "approach") {
        train.progress = Math.min(1, train.progress + dt / 4);
        if (train.progress >= 1) {
          train.phase = "unload";
          train.progress = 0;
          this.pushLog(`${train.id} unloading ${train.product}`);
        }
        continue;
      }
      if (train.phase === "unload") {
        this.pulse(unloadKey(train.product), 0.4);
        const rate = this.params.trainUnloadingFlowRate * 60; // m³/min-ish
        const moved = Math.min(train.cargo, rate * dt);
        train.cargo -= moved;
        this.fillStorage(train.product, moved);
        if (train.cargo <= 0.01) {
          train.cargo = 0;
          train.phase = "depart";
          train.progress = 0;
          this.trainsServed += 1;
          this.pushLog(`${train.id} departs`);
        }
        continue;
      }
      if (train.phase === "depart") {
        train.progress = Math.min(1, train.progress + dt / 3);
        if (train.progress >= 1) train.phase = "done";
      }
    }
    this.trains = this.trains.filter((t) => t.phase !== "done");
  }

  private fillStorage(product: ProductId, amount: number) {
    const targets = this.tanks
      .filter((t) => t.product === product)
      .sort((a, b) => a.level - b.level);
    let left = amount;
    for (const tank of targets) {
      if (left <= 0) break;
      const room = tank.capacity - tank.level;
      const add = Math.min(room, left);
      tank.level += add;
      left -= add;
    }
  }

  private drainStorage(product: ProductId, amount: number): number {
    const sources = this.tanks
      .filter((t) => t.product === product && !t.blocked)
      .sort((a, b) => b.level - a.level);
    let need = amount;
    let got = 0;
    const min = this.params.storageTankMinAmount * 0.5;
    for (const tank of sources) {
      if (need <= 0) break;
      const available = Math.max(0, tank.level - min);
      const take = Math.min(available, need);
      tank.level -= take;
      need -= take;
      got += take;
    }
    if (got > 0) this.pulse("pipelineHub", 0.3);
    return got;
  }

  private updateTankerArrivals(dt: number) {
    this.timeToNextTanker -= dt;
    this.pulse("tankerSource", 0.02);
    if (this.timeToNextTanker <= 0) {
      this.timeToNextTanker = this.params.tankerInterarrivalTime * (0.7 + this.rng() * 0.6);
      if (!this.tanker) {
        this.tanker = makeTanker(
          this.params,
          this.rng,
          `tanker-${this.nextTankerId++}`,
        );
        this.pushLog(`${this.tanker.id} approaching`);
      } else {
        this.tankerQueue += 1;
        this.pushLog("Tanker queued offshore");
      }
    }
  }

  private freeTug(): TugState | undefined {
    return this.tugs.find((t) => !t.busy);
  }

  private seizeTugs(n: number, tankerId: string, role: TugState["role"]) {
    let seized = 0;
    for (const tug of this.tugs) {
      if (seized >= n) break;
      if (!tug.busy) {
        tug.busy = true;
        tug.role = role;
        tug.targetTankerId = tankerId;
        seized += 1;
      }
    }
    this.pulse("tugPool", seized > 0 ? 1 : 0);
    return seized;
  }

  private releaseTugs(tankerId: string) {
    for (const tug of this.tugs) {
      if (tug.targetTankerId === tankerId) {
        tug.busy = false;
        tug.role = "idle";
        tug.targetTankerId = null;
      }
    }
  }

  private updateTanker(dt: number) {
    const t = this.tanker;
    if (!t) return;

    if (t.phase === "enroute") {
      t.progress = Math.min(1, t.progress + dt / 6);
      if (t.progress >= 1) {
        t.phase = "waitingTug";
        t.progress = 0;
      }
      return;
    }

    if (t.phase === "waitingTug") {
      const got = this.seizeTugs(2, t.id, "escortIn");
      if (got >= 2) {
        t.phase = "docking";
        t.progress = 0;
        this.pushLog(`Tugs escorting ${t.id} to berth`);
      }
      return;
    }

    if (t.phase === "docking") {
      t.progress = Math.min(1, t.progress + dt / 5);
      this.pulse("berth", 0.5);
      if (t.progress >= 1) {
        t.phase = "loading";
        t.progress = 0;
        t.berthBusy = true;
        this.releaseTugs(t.id);
        this.pushLog(`${t.id} at berth — loading`);
      }
      return;
    }

    if (t.phase === "loading") {
      this.pulse("berth", 1);
      // loading handled in updateLoading
      const full = t.holds.every((h) => h.level >= h.capacity - 0.01);
      if (full) {
        t.phase = "undocking";
        t.progress = 0;
        this.seizeTugs(2, t.id, "escortOut");
        this.pushLog(`${t.id} loaded — casting off`);
      }
      return;
    }

    if (t.phase === "undocking") {
      t.progress = Math.min(1, t.progress + dt / 5);
      this.pulse("berth", 0.3);
      if (t.progress >= 1) {
        t.phase = "departed";
        t.berthBusy = false;
        this.releaseTugs(t.id);
        this.tankersServed += 1;
        this.pulse("tankerSink", 1);
        this.pushLog(`${t.id} departed`);
        this.tanker = null;
        if (this.tankerQueue > 0) {
          this.tankerQueue -= 1;
          this.tanker = makeTanker(
            this.params,
            this.rng,
            `tanker-${this.nextTankerId++}`,
          );
          this.pushLog(`${this.tanker.id} from queue`);
        }
      }
    }
  }

  private updateLoading(dt: number) {
    const t = this.tanker;
    if (!t || t.phase !== "loading") return;
    const rate = this.params.tankerTankFlowRate * 60;
    for (const hold of t.holds) {
      const room = hold.capacity - hold.level;
      if (room <= 0) continue;
      const want = Math.min(room, rate * dt);
      const got = this.drainStorage(hold.product, want);
      hold.level += got;
      if (got > 0) this.pulse(storageKey(hold.product), 0.2);
    }
  }

  private sampleHistory() {
    if (this.timeMinutes - this.lastHistoryT < 2) return;
    this.lastHistoryT = this.timeMinutes;
    const fill =
      this.tanks.reduce((s, t) => s + t.level / t.capacity, 0) / this.tanks.length;
    const alarms = this.tanks.filter((t) => t.alarm).length;
    this.history = [
      ...this.history,
      {
        t: this.timeMinutes,
        tankersServed: this.tankersServed,
        trainsServed: this.trainsServed,
        storageAvgFill: fill * 100,
        alarms,
      },
    ].slice(-180);
  }

  snapshot(): SimSnapshot {
    return {
      timeMinutes: this.timeMinutes,
      day: Math.floor(this.timeMinutes / (24 * 60)) + 1,
      status: this.status,
      speed: this.speed,
      params: { ...this.params },
      tanks: this.tanks.map((t) => ({ ...t })),
      trains: this.trains.map((t) => ({ ...t })),
      trainQueue: this.trainQueue,
      tanker: this.tanker
        ? {
            ...this.tanker,
            holds: this.tanker.holds.map((h) => ({ ...h })),
          }
        : null,
      tankerQueue: this.tankerQueue,
      tankersServed: this.tankersServed,
      trainsServed: this.trainsServed,
      tugs: this.tugs.map((t) => ({ ...t })),
      logicActivity: { ...this.logicActivity },
      history: [...this.history],
      eventLog: [...this.eventLog],
    };
  }
}
