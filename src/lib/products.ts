export type ProductId = "petrol" | "diesel" | "fuelOil" | "crudeOil";

export interface ProductDef {
  id: ProductId;
  label: string;
  /** Hex fill matching AnyLogic sample palette */
  color: string;
  rgb: [number, number, number];
  short: string;
}

/** Colors extracted from Oil Terminal.alp Color(r,g,b) literals */
export const PRODUCTS: Record<ProductId, ProductDef> = {
  petrol: {
    id: "petrol",
    label: "Petrol",
    short: "P",
    color: "#2d7bc0",
    rgb: [45, 123, 192],
  },
  diesel: {
    id: "diesel",
    label: "Diesel",
    short: "D",
    color: "#cc8909",
    rgb: [204, 137, 9],
  },
  fuelOil: {
    id: "fuelOil",
    label: "Fuel Oil",
    short: "F",
    color: "#71181d",
    rgb: [113, 24, 29],
  },
  crudeOil: {
    id: "crudeOil",
    label: "Crude Oil",
    short: "C",
    color: "#453946",
    rgb: [69, 57, 70],
  },
};

export const PRODUCT_ORDER: ProductId[] = [
  "petrol",
  "diesel",
  "fuelOil",
  "crudeOil",
];

export function randomProduct(rng: () => number = Math.random): ProductId {
  return PRODUCT_ORDER[Math.floor(rng() * PRODUCT_ORDER.length)];
}
