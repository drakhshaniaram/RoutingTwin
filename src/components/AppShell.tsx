"use client";

import dynamic from "next/dynamic";
import clsx from "clsx";
import { PRODUCTS, PRODUCT_ORDER } from "@/lib/products";
import { useSimStore } from "@/lib/sim/store";
import type { ViewTab } from "@/lib/sim/types";
import { SimControls } from "./SimControls";
import { SimLoop } from "./SimLoop";
import { View2D } from "./views/View2D";
import { ViewLogic } from "./views/ViewLogic";
import { ViewStatistics } from "./views/ViewStatistics";

const TerminalScene = dynamic(
  () =>
    import("./scene/TerminalScene").then((m) => m.TerminalScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-[#87a8b8] text-sm text-[#1f2937]">
        Loading 3D terminal…
      </div>
    ),
  },
);

const TABS: { id: ViewTab; label: string }[] = [
  { id: "3d", label: "3D" },
  { id: "2d", label: "2D" },
  { id: "logic", label: "Logic" },
  { id: "statistics", label: "Statistics" },
];

export function AppShell() {
  const view = useSimStore((s) => s.view);
  const setView = useSimStore((s) => s.setView);

  return (
    <div className="relative flex min-h-screen flex-col text-white">
      <SimLoop />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,#1d4e6b55,transparent_50%),radial-gradient(ellipse_at_90%_10%,#b4530955,transparent_40%),linear-gradient(160deg,#071018_0%,#102433_45%,#1a140f_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M0 80L80 0M-20 20L20 -20M60 100L100 60' stroke='%23fff' stroke-width='1'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-10 flex flex-wrap items-center gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-amber-50 sm:text-3xl">
            RoutingTwin
          </div>
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">
            Oil Terminal digital twin
          </div>
        </div>

        <nav className="flex flex-1 flex-wrap justify-center gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={clsx(
                "rounded-lg px-4 py-2 text-sm font-semibold transition",
                view === tab.id
                  ? "bg-amber-400 text-[#1a1208] shadow-[0_0_24px_#f59e0b55]"
                  : "bg-white/5 text-white/75 hover:bg-white/10",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex flex-wrap gap-2">
          {PRODUCT_ORDER.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[11px] font-medium"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ background: PRODUCTS[p].color }}
              />
              {PRODUCTS[p].label}
            </span>
          ))}
        </div>
      </header>

      <div className="relative z-10 px-4 pt-3 sm:px-6">
        <SimControls />
      </div>

      <main className="relative z-10 flex-1 p-4 sm:p-6">
        <div className="h-[min(72vh,820px)] min-h-[420px]">
          {view === "3d" && <TerminalScene />}
          {view === "2d" && <View2D />}
          {view === "logic" && <ViewLogic />}
          {view === "statistics" && <ViewStatistics />}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-4 py-3 text-[11px] text-white/40 sm:px-6">
        Discrete-event style baseline of AnyLogic Oil Terminal — assets under{" "}
        <code className="text-white/55">public/assets</code>. See ATTRIBUTION.md.
      </footer>
    </div>
  );
}
