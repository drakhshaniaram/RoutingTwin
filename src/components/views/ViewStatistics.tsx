"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PRODUCTS, PRODUCT_ORDER } from "@/lib/products";
import { useSimStore } from "@/lib/sim/store";

export function ViewStatistics() {
  const snap = useSimStore((s) => s.snap);
  const data = snap.history.map((h) => ({
    ...h,
    tLabel: `${Math.floor(h.t / 60)}h`,
  }));

  const byProduct = PRODUCT_ORDER.map((p) => {
    const tanks = snap.tanks.filter((t) => t.product === p);
    const avg =
      tanks.reduce((s, t) => s + t.level / t.capacity, 0) / Math.max(1, tanks.length);
    const alarms = tanks.filter((t) => t.alarm).length;
    return {
      product: PRODUCTS[p].label,
      color: PRODUCTS[p].color,
      fillPct: avg * 100,
      alarms,
      volume: tanks.reduce((s, t) => s + t.level, 0),
    };
  });

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto rounded-2xl border border-white/10 bg-[#0b1520] p-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Statistics</h2>
        <p className="text-sm text-white/55">
          Tankers / Storages / Trains — rolling sim metrics
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Tankers served", value: snap.tankersServed, tint: "#38bdf8" },
          { label: "Trains served", value: snap.trainsServed, tint: "#fbbf24" },
          {
            label: "Active alarms",
            value: snap.tanks.filter((t) => t.alarm).length,
            tint: "#fb923c",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
          >
            <div className="text-[11px] uppercase tracking-wider text-white/50">
              {c.label}
            </div>
            <div className="mt-1 text-3xl font-semibold" style={{ color: c.tint }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid min-h-[240px] flex-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="mb-2 text-sm font-medium text-white/80">
            Throughput (Tankers & Trains)
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid stroke="#1f2a37" strokeDasharray="3 3" />
                <XAxis dataKey="tLabel" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tankersServed"
                  name="Tankers"
                  stroke="#38bdf8"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="trainsServed"
                  name="Trains"
                  stroke="#fbbf24"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="mb-2 text-sm font-medium text-white/80">
            Storage fill % (avg) & alarms
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid stroke="#1f2a37" strokeDasharray="3 3" />
                <XAxis dataKey="tLabel" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="storageAvgFill"
                  name="Avg fill %"
                  stroke="#34d399"
                  fill="#34d39933"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="alarms"
                  name="Alarms"
                  stroke="#fb923c"
                  dot={false}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {byProduct.map((p) => (
          <div
            key={p.product}
            className="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ background: p.color }}
              />
              {p.product}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${p.fillPct}%`, background: p.color }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[11px] text-white/60">
              <span>{p.fillPct.toFixed(0)}% fill</span>
              <span>{Math.round(p.volume).toLocaleString()} m³</span>
            </div>
            {p.alarms > 0 && (
              <div className="mt-1 text-[11px] font-semibold text-orange-300">
                {p.alarms} tank alarm{p.alarms > 1 ? "s" : ""}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
