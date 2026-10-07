"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, Sky } from "@react-three/drei";
import { Suspense } from "react";
import { useSimStore } from "@/lib/sim/store";
import { PRODUCTS, PRODUCT_ORDER } from "@/lib/products";
import {
  HUB,
  JETTY,
  RAIL,
  tankFarmOrigin,
  tankWorldPosition,
} from "@/lib/layout";
import type { ProductId } from "@/lib/products";

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -5]} receiveShadow>
        <planeGeometry args={[140, 90]} />
        <meshStandardMaterial color="#d4b896" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, -0.05, 40]} receiveShadow>
        <planeGeometry args={[90, 70]} />
        <meshStandardMaterial color="#8eb8c4" roughness={0.35} metalness={0.1} />
      </mesh>
      {/* shoreline blend strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, -0.01, 22]}>
        <planeGeometry args={[50, 18]} />
        <meshStandardMaterial color="#c4a87a" roughness={1} />
      </mesh>
    </group>
  );
}

function StorageTank({
  product,
  index,
  level,
  capacity,
  alarm,
}: {
  product: ProductId;
  index: number;
  level: number;
  capacity: number;
  alarm: boolean;
}) {
  const p = tankWorldPosition(product, index);
  const fill = Math.max(0.05, level / capacity);
  const color = PRODUCTS[product].color;
  return (
    <group position={[p.x, p.y, p.z]}>
      {/* bund */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[6.2, 0.3, 6.2]} />
        <meshStandardMaterial color="#9aa3a8" roughness={0.8} />
      </mesh>
      {/* shell */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <cylinderGeometry args={[2.4, 2.4, 4.8, 32]} />
        <meshPhysicalMaterial
          color="#cfd6db"
          transparent
          opacity={0.35}
          roughness={0.2}
          metalness={0.4}
          transmission={0.15}
        />
      </mesh>
      {/* liquid */}
      <mesh position={[0, fill * 2.2, 0]} castShadow>
        <cylinderGeometry args={[2.25, 2.25, fill * 4.4, 32]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.05} />
      </mesh>
      {/* roof */}
      <mesh position={[0, 4.85, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.25, 32]} />
        <meshStandardMaterial color="#b8c0c6" metalness={0.5} roughness={0.35} />
      </mesh>
      {alarm && (
        <mesh position={[0, 0.55, 2.8]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial
            color="#ff7a18"
            emissive="#ff5a00"
            emissiveIntensity={1.2}
          />
        </mesh>
      )}
    </group>
  );
}

function PipeSegment({
  from,
  to,
  color,
  y = 1.1,
}: {
  from: [number, number];
  to: [number, number];
  color: string;
  y?: number;
}) {
  const mx = (from[0] + to[0]) / 2;
  const mz = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const len = Math.hypot(dx, dz);
  const rot = Math.atan2(dx, dz);
  return (
    <mesh position={[mx, y, mz]} rotation={[Math.PI / 2, 0, -rot]}>
      <cylinderGeometry args={[0.22, 0.22, Math.max(len, 0.01), 10]} />
      <meshStandardMaterial color={color} metalness={0.55} roughness={0.35} />
    </mesh>
  );
}

function Pipelines() {
  const hub: [number, number] = [HUB.x, HUB.z];
  const berth: [number, number] = [JETTY.berth.x, JETTY.berth.z];
  return (
    <group>
      {PRODUCT_ORDER.map((product, i) => {
        const o = tankFarmOrigin(product);
        const color = PRODUCTS[product].color;
        const farm: [number, number] = [o.x, o.z];
        const rail: [number, number] = [
          RAIL.unloadSpots[i].pos.x,
          RAIL.unloadSpots[i].pos.z,
        ];
        return (
          <group key={product}>
            <PipeSegment from={rail} to={farm} color={color} y={1.0 + i * 0.12} />
            <PipeSegment from={farm} to={hub} color={color} y={1.2 + i * 0.12} />
            <PipeSegment from={hub} to={berth} color={color} y={1.35 + i * 0.1} />
          </group>
        );
      })}
      {/* pipe supports */}
      {[-20, -5, 10, 25].map((x) => (
        <mesh key={x} position={[x, 0.55, 16]}>
          <boxGeometry args={[0.35, 1.1, 0.35]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
      ))}
    </group>
  );
}

function RailTracks() {
  return (
    <group>
      {[-30, -24, -18, -12].map((z, i) => (
        <group key={z}>
          <mesh position={[0, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[110, 1.6]} />
            <meshStandardMaterial color="#5c5346" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, 0.12, z + s * 0.45]}>
              <boxGeometry args={[110, 0.08, 0.12]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.8} />
            </mesh>
          ))}
          {/* hangar stubs */}
          <mesh position={[-42, 1.6, z]} castShadow>
            <boxGeometry args={[8, 3.2, 4]} />
            <meshStandardMaterial color="#8b9198" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function TrainViz() {
  const trains = useSimStore((s) => s.snap.trains);
  return (
    <group>
      {trains.map((train) => {
        const spot = RAIL.unloadSpots.find((u) => u.product === train.product);
        let x = RAIL.entry.x;
        let z = spot?.pos.z ?? RAIL.entry.z;
        if (train.phase === "lead") {
          x = RAIL.entry.x - 8;
        } else if (train.phase === "approach") {
          x = RAIL.entry.x + train.progress * (spot!.pos.x - RAIL.entry.x + 20);
        } else if (train.phase === "unload") {
          x = spot?.pos.x ?? -40;
        } else if (train.phase === "depart") {
          x = (spot?.pos.x ?? -40) + train.progress * 50;
        }
        const color = PRODUCTS[train.product].color;
        return (
          <group key={train.id} position={[x, 0.6, z]}>
            {/* loco */}
            <mesh position={[-6, 0.5, 0]} castShadow>
              <boxGeometry args={[3.2, 1.6, 1.4]} />
              <meshStandardMaterial color="#e6b422" metalness={0.3} />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[-2 + i * 2.4, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.55, 0.55, 1.8, 16]} />
                <meshStandardMaterial color="#2f6b4f" />
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.45, 0.45, 1.5, 16]} />
                  <meshStandardMaterial color={color} />
                </mesh>
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function TankerViz() {
  const tanker = useSimStore((s) => s.snap.tanker);
  const tugs = useSimStore((s) => s.snap.tugs);
  if (!tanker || tanker.phase === "departed") return null;

  let pos = { ...JETTY.approach };
  if (tanker.phase === "enroute") {
    pos = {
      x: JETTY.approach.x + (1 - tanker.progress) * 12,
      y: 0.6,
      z: JETTY.approach.z + (1 - tanker.progress) * 10,
    };
  } else if (tanker.phase === "waitingTug") {
    pos = { ...JETTY.approach, y: 0.6 };
  } else if (tanker.phase === "docking") {
    pos = {
      x: JETTY.approach.x + tanker.progress * (JETTY.berth.x - JETTY.approach.x),
      y: 0.6,
      z: JETTY.approach.z + tanker.progress * (JETTY.berth.z - JETTY.approach.z),
    };
  } else if (tanker.phase === "loading") {
    pos = { ...JETTY.berth, y: 0.6 };
  } else if (tanker.phase === "undocking") {
    pos = {
      x: JETTY.berth.x + tanker.progress * 14,
      y: 0.6,
      z: JETTY.berth.z + tanker.progress * 12,
    };
  }

  return (
    <group>
      <group position={[pos.x, pos.y, pos.z]} rotation={[0, -0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[18, 2.2, 5.2]} />
          <meshStandardMaterial color="#dfe5ea" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[6, 1.4, 0]}>
          <boxGeometry args={[3, 2, 4]} />
          <meshStandardMaterial color="#c5ccd2" />
        </mesh>
        {tanker.holds.map((h, i) => (
          <mesh key={i} position={[-6 + i * 3.2, 0.9, 0]}>
            <boxGeometry args={[2.6, 1.4, 4.2]} />
            <meshStandardMaterial
              color={PRODUCTS[h.product].color}
              transparent
              opacity={0.35 + 0.55 * (h.level / h.capacity)}
            />
          </mesh>
        ))}
      </group>
      {tugs.map((tug, i) => {
        const base = JETTY.tugs[i];
        const escort = tug.busy && tug.targetTankerId === tanker.id;
        const tx = escort ? pos.x + (i - 1) * 3 : base.x;
        const tz = escort ? pos.z + 4 + i : base.z;
        return (
          <group key={tug.id} position={[tx, 0.35, tz]}>
            <mesh castShadow>
              <boxGeometry args={[2.2, 0.7, 1.1]} />
              <meshStandardMaterial color="#1f2933" />
            </mesh>
            <mesh position={[0.2, 0.55, 0]}>
              <boxGeometry args={[0.8, 0.5, 0.8]} />
              <meshStandardMaterial color="#e6b422" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function JettyDeck() {
  return (
    <group>
      <mesh position={[JETTY.root.x, 0.4, JETTY.root.z]} castShadow receiveShadow>
        <boxGeometry args={[14, 0.8, 28]} />
        <meshStandardMaterial color="#a8b0b6" roughness={0.85} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[JETTY.berth.x + 4, 0.2, JETTY.berth.z - 6 + i * 4]}
        >
          <boxGeometry args={[1.2, 0.4, 1.2]} />
          <meshStandardMaterial color="#7b8490" />
        </mesh>
      ))}
    </group>
  );
}

function TankFarms() {
  const tanks = useSimStore((s) => s.snap.tanks);
  return (
    <group>
      {tanks.map((t) => (
        <StorageTank
          key={t.id}
          product={t.product}
          index={t.index}
          level={t.level}
          capacity={t.capacity}
          alarm={t.alarm}
        />
      ))}
    </group>
  );
}

function SceneContents() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        castShadow
        position={[40, 55, 20]}
        intensity={1.35}
        shadow-mapSize={[2048, 2048]}
      />
      <Sky sunPosition={[40, 20, 40]} turbidity={4} rayleigh={1.2} />
      <hemisphereLight args={["#cfe8ff", "#d4b896", 0.55]} />
      <Ground />
      <RailTracks />
      <Pipelines />
      <TankFarms />
      <JettyDeck />
      <TrainViz />
      <TankerViz />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={140}
        blur={2.5}
      />
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.05}
        minDistance={25}
        maxDistance={140}
        target={[5, 0, 10]}
      />
    </>
  );
}

export function TerminalScene() {
  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#87a8b8]">
      <Canvas
        shadows
        camera={{ position: [55, 42, 55], fov: 42, near: 0.5, far: 400 }}
        dpr={[1, 1.75]}
      >
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
    </div>
  );
}
