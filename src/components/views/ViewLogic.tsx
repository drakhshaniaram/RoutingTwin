"use client";

import { PRODUCTS } from "@/lib/products";
import { useSimStore } from "@/lib/sim/store";
import type { LogicNodeId } from "@/lib/sim/types";
import clsx from "clsx";

type Node = {
  id: LogicNodeId;
  label: string;
  x: number;
  y: number;
  color?: string;
};

const TRAIN_NODES: Node[] = [
  { id: "trainSource", label: "Train source", x: 40, y: 60 },
  { id: "trainQueue", label: "Train queue", x: 200, y: 60 },
  { id: "railSelect", label: "Select track", x: 360, y: 60 },
  {
    id: "unloadPetrol",
    label: "Unload Petrol",
    x: 540,
    y: 20,
    color: PRODUCTS.petrol.color,
  },
  {
    id: "unloadDiesel",
    label: "Unload Diesel",
    x: 540,
    y: 70,
    color: PRODUCTS.diesel.color,
  },
  {
    id: "unloadFuelOil",
    label: "Unload Fuel Oil",
    x: 540,
    y: 120,
    color: PRODUCTS.fuelOil.color,
  },
  {
    id: "unloadCrudeOil",
    label: "Unload Crude",
    x: 540,
    y: 170,
    color: PRODUCTS.crudeOil.color,
  },
  {
    id: "storagePetrol",
    label: "Storage Petrol",
    x: 740,
    y: 20,
    color: PRODUCTS.petrol.color,
  },
  {
    id: "storageDiesel",
    label: "Storage Diesel",
    x: 740,
    y: 70,
    color: PRODUCTS.diesel.color,
  },
  {
    id: "storageFuelOil",
    label: "Storage Fuel Oil",
    x: 740,
    y: 120,
    color: PRODUCTS.fuelOil.color,
  },
  {
    id: "storageCrudeOil",
    label: "Storage Crude",
    x: 740,
    y: 170,
    color: PRODUCTS.crudeOil.color,
  },
];

const TANKER_NODES: Node[] = [
  { id: "tankerSource", label: "Tanker arrivals", x: 40, y: 320 },
  { id: "tugPool", label: "Tug pool (3)", x: 220, y: 320 },
  { id: "pipelineHub", label: "Pipeline hub", x: 420, y: 260 },
  { id: "berth", label: "Berth / load", x: 420, y: 340 },
  { id: "tankerSink", label: "Departures", x: 640, y: 320 },
];

function Block({
  node,
  activity,
}: {
  node: Node;
  activity: number;
}) {
  return (
    <div
      className={clsx(
        "absolute w-[150px] rounded-lg border px-2 py-2 text-center text-[11px] font-semibold shadow-lg transition",
        activity > 0.15
          ? "border-amber-300/80 bg-[#1e3344] text-amber-50"
          : "border-white/15 bg-[#13202b] text-white/80",
      )}
      style={{
        left: node.x,
        top: node.y,
        boxShadow:
          activity > 0.2
            ? `0 0 18px ${node.color ?? "#f59e0b"}66`
            : undefined,
      }}
    >
      <div
        className="mb-1 h-1.5 rounded-full"
        style={{
          background: node.color ?? "#64748b",
          opacity: 0.35 + activity * 0.65,
        }}
      />
      {node.label}
      <div className="mt-1 font-mono text-[10px] text-cyan-200/70">
        {(activity * 100).toFixed(0)}%
      </div>
    </div>
  );
}

export function ViewLogic() {
  const snap = useSimStore((s) => s.snap);
  const a = snap.logicActivity;

  return (
    <div className="relative h-full w-full overflow-auto rounded-2xl border border-white/10 bg-[#0b1520] p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">Logic flowchart</h2>
          <p className="text-sm text-white/55">
            Train/storage flow + tanker/tug flow — live node activity
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-white/60">
          <span>storageTankCapacity {snap.params.storageTankCapacity}</span>
          <span>tankerTankCapacity {snap.params.tankerTankCapacity}</span>
          <span>trainCapacity {snap.params.trainCapacity}</span>
          <span>tankerInterarrival {snap.params.tankerInterarrivalTime}m</span>
          <span>trainLeadTime {snap.params.trainLeadTime}m</span>
          <span>pipelineFlowRate {snap.params.pipelineFlowRate}</span>
        </div>
      </div>

      <div className="relative min-h-[480px] min-w-[920px]">
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <path
            d="M190 80 H350 M510 40 H730 M510 90 H730 M510 140 H730 M510 190 H730"
            stroke="#334155"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M190 340 H210 M370 340 H410 M490 280 V330 M560 340 H630"
            stroke="#334155"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M800 100 H860 V280 H500"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="6 4"
            fill="none"
          />
        </svg>
        {TRAIN_NODES.map((n) => (
          <Block key={n.id} node={n} activity={a[n.id]} />
        ))}
        {TANKER_NODES.map((n) => (
          <Block key={n.id} node={n} activity={a[n.id]} />
        ))}
      </div>

      <div className="mt-4 max-h-36 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-[11px] text-emerald-100/80">
        {snap.eventLog.length === 0 ? (
          <div className="text-white/40">No events yet</div>
        ) : (
          snap.eventLog.map((line, i) => <div key={i}>{line}</div>)
        )}
      </div>
    </div>
  );
}
