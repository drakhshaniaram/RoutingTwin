"use client";

import { PRODUCTS, PRODUCT_ORDER } from "@/lib/products";
import { useSimStore } from "@/lib/sim/store";

export function View2D() {
  const snap = useSimStore((s) => s.snap);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1a2733]">
      <svg viewBox="0 0 1000 640" className="h-full w-full">
        <defs>
          <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9c3a1" />
            <stop offset="100%" stopColor="#c4a87a" />
          </linearGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7eacb8" />
            <stop offset="100%" stopColor="#5f8f9e" />
          </linearGradient>
        </defs>
        <rect width="1000" height="640" fill="url(#sand)" />
        <path d="M520 0 L1000 0 L1000 640 L420 640 Z" fill="url(#sea)" />

        {/* rails */}
        {[70, 120, 170, 220].map((y, i) => (
          <g key={y}>
            <rect x="40" y={y} width="420" height="18" fill="#5c5346" rx="2" />
            <rect x="40" y={y + 4} width="420" height="3" fill="#9ca3af" />
            <rect x="40" y={y + 12} width="420" height="3" fill="#9ca3af" />
            <text x="30" y={y + 14} fill="#334" fontSize="11" textAnchor="end">
              {PRODUCT_ORDER[i]}
            </text>
          </g>
        ))}

        {/* trains */}
        {snap.trains.map((t, idx) => {
          const yi = PRODUCT_ORDER.indexOf(t.product);
          const y = 70 + yi * 50 + 2;
          let x = 60;
          if (t.phase === "approach") x = 60 + t.progress * 200;
          if (t.phase === "unload") x = 280;
          if (t.phase === "depart") x = 280 + t.progress * 200;
          if (t.phase === "lead") x = 20;
          return (
            <g key={t.id} transform={`translate(${x},${y})`}>
              <rect width="28" height="14" fill="#e6b422" rx="2" />
              {[0, 1, 2].map((c) => (
                <rect
                  key={c}
                  x={32 + c * 22}
                  width="18"
                  height="14"
                  fill={PRODUCTS[t.product].color}
                  rx="2"
                  opacity={0.85}
                />
              ))}
            </g>
          );
        })}

        {/* tank farms 2x2 */}
        {PRODUCT_ORDER.map((product, pi) => {
          const ox = 120 + (pi % 2) * 200;
          const oy = 280 + Math.floor(pi / 2) * 160;
          const tanks = snap.tanks.filter((t) => t.product === product);
          return (
            <g key={product}>
              <rect
                x={ox - 10}
                y={oy - 10}
                width="160"
                height="140"
                fill="#8e969c"
                opacity={0.45}
                rx="6"
              />
              <text
                x={ox}
                y={oy - 18}
                fill="#1f2937"
                fontSize="13"
                fontWeight="700"
              >
                {PRODUCTS[product].label}
              </text>
              {tanks.map((tank, i) => {
                const cx = ox + (i % 2) * 70 + 30;
                const cy = oy + Math.floor(i / 2) * 60 + 30;
                const fill = tank.level / tank.capacity;
                return (
                  <g key={tank.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={24}
                      fill="#cfd6db"
                      stroke="#6b7280"
                      strokeWidth="2"
                    />
                    <clipPath id={`clip-${tank.id}`}>
                      <circle cx={cx} cy={cy} r={22} />
                    </clipPath>
                    <rect
                      x={cx - 22}
                      y={cy + 22 - 44 * fill}
                      width={44}
                      height={44 * fill}
                      fill={PRODUCTS[product].color}
                      clipPath={`url(#clip-${tank.id})`}
                    />
                    {tank.alarm && (
                      <circle cx={cx + 18} cy={cy + 18} r={5} fill="#ff7a18" />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* pipeline hub */}
        <circle cx="520" cy="360" r="18" fill="#374151" />
        <text x="520" y="364" textAnchor="middle" fill="#fff" fontSize="10">
          HUB
        </text>
        {PRODUCT_ORDER.map((p, i) => (
          <line
            key={p}
            x1={200 + (i % 2) * 200}
            y1={340 + Math.floor(i / 2) * 160}
            x2="520"
            y2="360"
            stroke={PRODUCTS[p].color}
            strokeWidth="4"
            opacity={0.75}
          />
        ))}
        {PRODUCT_ORDER.map((p, i) => (
          <line
            key={`b-${p}`}
            x1="520"
            y1="360"
            x2={720 + i * 4}
            y2={480}
            stroke={PRODUCTS[p].color}
            strokeWidth="3"
            opacity={0.7}
          />
        ))}

        {/* jetty + tanker */}
        <rect x="680" y="420" width="70" height="180" fill="#a8b0b6" rx="4" />
        {snap.tanker && (
          <g
            transform={`translate(${
              snap.tanker.phase === "loading" || snap.tanker.phase === "docking"
                ? 780
                : 860
            },470)`}
          >
            <rect width="120" height="44" fill="#dfe5ea" rx="6" />
            {snap.tanker.holds.map((h, i) => (
              <rect
                key={i}
                x={8 + i * 28}
                y={8}
                width={24}
                height={28}
                fill={PRODUCTS[h.product].color}
                opacity={0.3 + 0.6 * (h.level / h.capacity)}
                rx="2"
              />
            ))}
          </g>
        )}
        {snap.tugs.map((tug, i) => (
          <rect
            key={tug.id}
            x={820 + i * 28}
            y={540}
            width={18}
            height={10}
            fill={tug.busy ? "#e6b422" : "#1f2933"}
            rx="2"
          />
        ))}

        <text x="40" y="30" fill="#1f2937" fontSize="16" fontWeight="700">
          Oil Terminal — 2D plan
        </text>
      </svg>
    </div>
  );
}
