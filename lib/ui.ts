import type { EvidenceItem, Priority } from "./types";

export const TYPE_COLORS: Record<EvidenceItem["evidenceType"], string> = {
  weapon: "#ef4444",
  biological: "#f97316",
  trace: "#eab308",
  impression: "#22c55e",
  digital: "#818cf8",
  environmental: "#3b82f6",
  other: "#94a3b8",
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/40",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/40",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
};
