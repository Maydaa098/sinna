"use client";

import type { EvidenceItem } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/ui";

export default function PhotoOverlay({
  src,
  items,
  selectedId,
  onSelect,
}: {
  src: string;
  items: EvidenceItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative inline-block w-full overflow-hidden rounded-lg border border-slate-800">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Scene photo" className="w-full select-none" draggable={false} />
      {items.map((item) => {
        const color = TYPE_COLORS[item.evidenceType];
        const selected = selectedId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="absolute cursor-pointer transition-all"
            style={{
              top: `${item.box.ymin / 10}%`,
              left: `${item.box.xmin / 10}%`,
              width: `${(item.box.xmax - item.box.xmin) / 10}%`,
              height: `${(item.box.ymax - item.box.ymin) / 10}%`,
              border: `2px solid ${color}`,
              boxShadow: selected ? `0 0 0 3px ${color}66, 0 0 20px ${color}88` : "none",
              background: selected ? `${color}22` : "transparent",
            }}
            aria-label={item.label}
          >
            <span
              className="absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-black"
              style={{ background: color }}
            >
              {item.id} · {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
