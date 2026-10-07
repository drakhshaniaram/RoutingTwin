import type { ProductId } from "../products";
import type { SimParams } from "../params";

export type SimStatus = "idle" | "running" | "paused";
export type SimSpeed = 1 | 5;
export type ViewTab = "3d" | "2d" | "logic" | "statistics";

export type TankState = {
  id: string;
  product: ProductId;
  index: number;
  level: number;
  capacity: number;
  /** Output blocked when below min */
  blocked: boolean;
  reordering: boolean;
  alarm: boolean;
};

export type TrainState = {
  id: string;
  product: ProductId;
  cargo: number;
  capacity: number;
  phase: "lead" | "approach" | "unload" | "depart" | "done";
  progress: number;
  leadRemaining: number;
};

export type TankerHold = {
  product: ProductId;
  level: number;
  capacity: number;
};

export type TankerState = {
  id: string;
  holds: TankerHold[];
  phase:
    | "enroute"
    | "waitingTug"
    | "docking"
    | "loading"
    | "undocking"
    | "departed";
  progress: number;
  berthBusy: boolean;
};

export type TugState = {
  id: string;
  busy: boolean;
  role: "idle" | "escortIn" | "escortOut";
  targetTankerId: string | null;
};

export type LogicNodeId =
  | "trainSource"
  | "trainQueue"
  | "railSelect"
  | "unloadPetrol"
  | "unloadDiesel"
  | "unloadFuelOil"
  | "unloadCrudeOil"
  | "storagePetrol"
  | "storageDiesel"
  | "storageFuelOil"
  | "storageCrudeOil"
  | "pipelineHub"
  | "berth"
  | "tankerSource"
  | "tugPool"
  | "tankerSink";

export type LogicNodeActivity = Record<LogicNodeId, number>;

export type StatsPoint = {
  t: number;
  tankersServed: number;
  trainsServed: number;
  storageAvgFill: number;
  alarms: number;
};

export type SimSnapshot = {
  timeMinutes: number;
  day: number;
  status: SimStatus;
  speed: SimSpeed;
  params: SimParams;
  tanks: TankState[];
  trains: TrainState[];
  trainQueue: number;
  tanker: TankerState | null;
  tankerQueue: number;
  tankersServed: number;
  trainsServed: number;
  tugs: TugState[];
  logicActivity: LogicNodeActivity;
  history: StatsPoint[];
  eventLog: string[];
};
