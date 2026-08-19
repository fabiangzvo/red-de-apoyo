export const CATEGORIES = [
  { value: "alimentos", label: "Alimentos" },
  { value: "medicinas", label: "Medicinas" },
  { value: "materiales", label: "Materiales" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

// Approximate center of Colombia's coffee region (Quimbaya, Quindío),
// a historically seismic zone. Used as the initial map view.
export const DEFAULT_CENTER: [number, number] = [
  4.623447675440743, -75.76323151573685,
];
export const DEFAULT_ZOOM = 15;

export type ItemStatus = "pending" | "reserved" | "delivered";
