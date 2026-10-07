# RoutingTwin — Oil Terminal

Browser digital twin of the AnyLogic **Oil Terminal** sample: rail unload → 4×4 tank farms → pipeline hub → jetty → tanker + tugs, with Logic and Statistics views.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

Dev server binds to `127.0.0.1:43147` by default (`package.json` scripts).

## Views

| Tab | Contents |
|-----|----------|
| **3D** | Isometric terminal — tanks with liquid levels, color-coded pipes, trains, tanker, 3 tugs |
| **2D** | Top-down plan with live agents |
| **Logic** | Train/storage + tanker/tug flowchart with live node activity + params |
| **Statistics** | Tankers / Storages / Trains charts |

Controls: day clock, play / pause / stop, speed ×1 / ×5.

## Stack

Next.js 15, TypeScript, Tailwind CSS 4, Three.js / React Three Fiber, Zustand, Recharts.

## Assets

3D Collada (`.dae`) models and reference PNG are copied from the AnyLogic Oil Terminal package into `public/assets/`. See `public/assets/ATTRIBUTION.md`.

## Parameters (baseline)

From `Oil Terminal.alp`: `storageTankCapacity=15000`, `storageTankMinAmount=1000`, `pipelineFlowRate=2`, `storageTankFlowRate=0.5`, `tankerTankCapacity=6000`, `tankerInterarrivalTime=30`, `trainLeadTime=8`, `trainCapacity=600`, `trainUnloadingFlowRate=0.45`.
