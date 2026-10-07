"use client";

import { create } from "zustand";
import { OilTerminalSim } from "./engine";
import type { SimSnapshot, SimSpeed, ViewTab } from "./types";

const sim = new OilTerminalSim(42);

type SimStore = {
  view: ViewTab;
  setView: (v: ViewTab) => void;
  snap: SimSnapshot;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (s: SimSpeed) => void;
  tickWall: (dtSec: number) => void;
};

function refresh(): SimSnapshot {
  return sim.snapshot();
}

export const useSimStore = create<SimStore>((set, get) => ({
  view: "3d",
  setView: (v) => set({ view: v }),
  snap: refresh(),
  play: () => {
    sim.play();
    set({ snap: refresh() });
  },
  pause: () => {
    sim.pause();
    set({ snap: refresh() });
  },
  stop: () => {
    sim.stop();
    set({ snap: refresh() });
  },
  setSpeed: (s) => {
    sim.setSpeed(s);
    set({ snap: refresh() });
  },
  tickWall: (dtSec) => {
    if (get().snap.status !== "running") return;
    const minutes =
      dtSec * get().snap.params.minutesPerSecond * get().snap.speed;
    sim.tick(minutes);
    set({ snap: refresh() });
  },
}));
