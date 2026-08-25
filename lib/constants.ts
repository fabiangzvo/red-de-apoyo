export const CATEGORIES = [
  { value: "alimentos", label: "Alimentos" },
  { value: "medicinas", label: "Medicinas" },
  { value: "materiales", label: "Materiales" },
  { value: "Salud", label: "Salud" },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];

export function categoryLabel(value: string) {
  return (
    CATEGORIES.find(
      (c) => c.value.toLowerCase() === (value || "").toLowerCase(),
    )?.label ?? value
  );
}

export function categoryColor(value: string) {
  const normalized = (value || "").toLowerCase().trim();
  switch (normalized) {
    case "alimentos":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    case "medicinas":
      return "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
    case "salud":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
    case "materiales":
      return "bg-taupe-500/15 text-taupe-700 dark:text-taupe-300 border-taupe-500/30";
  }
}

// Approximate center of Colombia's coffee region (Quimbaya, Quindío),
// a historically seismic zone. Used as the initial map view.
export const DEFAULT_CENTER: [number, number] = [
  4.623447675440743, -75.76323151573685,
];
export const DEFAULT_ZOOM = 15;

export type ItemStatus = "pending" | "reserved" | "delivered" | "available";
