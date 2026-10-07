"use client";

import { useEffect } from "react";
import { useSimStore } from "@/lib/sim/store";

/** Drives discrete-event sim from rAF wall clock */
export function SimLoop() {
  const tickWall = useSimStore((s) => s.tickWall);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      tickWall(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tickWall]);

  return null;
}
