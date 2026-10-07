import type { ProductId } from "./products";
import { PRODUCT_ORDER } from "./products";

/** World units — isometric desert terminal matching reference layout */
export const WORLD = {
  landSize: 120,
  waterZ: 42,
  seaLevel: 0,
};

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Tank farm positions: 4 products × 2×2 tanks */
export function tankFarmOrigin(product: ProductId): Vec3 {
  const i = PRODUCT_ORDER.indexOf(product);
  // petrol SW, diesel SE-of-petrol, fuelOil NE, crude NW-of-fuel
  const grid: Record<ProductId, Vec3> = {
    petrol: { x: -28, y: 0, z: 8 },
    diesel: { x: -8, y: 0, z: 8 },
    fuelOil: { x: 12, y: 0, z: -8 },
    crudeOil: { x: -8, y: 0, z: -12 },
  };
  return grid[product] ?? { x: i * 20, y: 0, z: 0 };
}

export function tankLocalOffset(index: number): Vec3 {
  const col = index % 2;
  const row = Math.floor(index / 2);
  return { x: col * 7 - 3.5, y: 0, z: row * 7 - 3.5 };
}

export function tankWorldPosition(product: ProductId, index: number): Vec3 {
  const o = tankFarmOrigin(product);
  const l = tankLocalOffset(index);
  return { x: o.x + l.x, y: o.y + l.y, z: o.z + l.z };
}

export const RAIL = {
  entry: { x: -55, y: 0.2, z: -28 } as Vec3,
  unloadSpots: PRODUCT_ORDER.map((p, i) => ({
    product: p,
    pos: { x: -48 + i * 0.5, y: 0.2, z: -22 + i * 6 } as Vec3,
  })),
  exit: { x: 55, y: 0.2, z: -28 } as Vec3,
};

export const JETTY = {
  root: { x: 28, y: 0, z: 28 } as Vec3,
  berth: { x: 38, y: 0.5, z: 36 } as Vec3,
  approach: { x: 55, y: 0.5, z: 48 } as Vec3,
  tugs: [
    { x: 44, y: 0.3, z: 42 },
    { x: 48, y: 0.3, z: 40 },
    { x: 46, y: 0.3, z: 46 },
  ] as Vec3[],
};

/** Pipeline hub near center */
export const HUB = { x: 4, y: 1.2, z: 18 } as Vec3;
