"use client";

import { Pause, Play, Square } from "lucide-react";
import { useSimStore } from "@/lib/sim/store";
import clsx from "clsx";

function formatClock(minutes: number) {
  const day = Math.floor(minutes / (24 * 60)) + 1;
  const m = Math.floor(minutes % (24 * 60));
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return { day, time: `${hh}:${mm}` };
}

export function SimControls() {
  const snap = useSimStore((s) => s.snap);
  const play = useSimStore((s) => s.play);
  const pause = useSimStore((s) => s.pause);
  const stop = useSimStore((s) => s.stop);
  const setSpeed = useSimStore((s) => s.setSpeed);
  const { day, time } = formatClock(snap.timeMinutes);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#0f1c28]/90 px-3 py-2 backdrop-blur">
      <div className="flex items-baseline gap-2 font-mono tabular-nums">
        <span className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70">
          Day {day}
        </span>
        <span className="text-xl font-semibold text-amber-100">{time}</span>
      </div>

      <div className="mx-1 h-6 w-px bg-white/15" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Play"
          onClick={play}
          className={clsx(
            "rounded-lg p-2 transition",
            snap.status === "running"
              ? "bg-emerald-500/30 text-emerald-200"
              : "bg-white/5 text-white hover:bg-white/10",
          )}
        >
          <Play className="h-4 w-4" fill="currentColor" />
        </button>
        <button
          type="button"
          aria-label="Pause"
          onClick={pause}
          className="rounded-lg bg-white/5 p-2 text-white hover:bg-white/10"
        >
          <Pause className="h-4 w-4" fill="currentColor" />
        </button>
        <button
          type="button"
          aria-label="Stop"
          onClick={stop}
          className="rounded-lg bg-white/5 p-2 text-white hover:bg-white/10"
        >
          <Square className="h-4 w-4" fill="currentColor" />
        </button>
      </div>

      <div className="flex overflow-hidden rounded-lg border border-white/10">
        {([1, 5] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            className={clsx(
              "px-3 py-1.5 font-mono text-xs font-semibold transition",
              snap.speed === s
                ? "bg-amber-400 text-[#1a1208]"
                : "bg-transparent text-white/70 hover:bg-white/10",
            )}
          >
            ×{s}
          </button>
        ))}
      </div>

      <div className="ml-auto hidden items-center gap-3 text-xs text-white/60 sm:flex">
        <span>
          Tankers <b className="text-white">{snap.tankersServed}</b>
        </span>
        <span>
          Trains <b className="text-white">{snap.trainsServed}</b>
        </span>
        <span>
          Queue T/R{" "}
          <b className="text-white">
            {snap.tankerQueue}/{snap.trainQueue}
          </b>
        </span>
      </div>
    </div>
  );
}
