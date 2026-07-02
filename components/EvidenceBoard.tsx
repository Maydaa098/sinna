"use client";

import type { EvidenceItem } from "@/lib/types";
import { PRIORITY_ORDER, PRIORITY_STYLES, TYPE_COLORS } from "@/lib/ui";

export default function EvidenceBoard({
  items,
  photos,
  selectedId,
  onSelect,
}: {
  items: EvidenceItem[];
  photos: string[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const sorted = [...items].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((item) => {
          const color = TYPE_COLORS[item.evidenceType];
          const isSel = item.id === selectedId;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(isSel ? null : item.id)}
              className={`rounded-xl border bg-slate-900/60 p-4 text-left transition-all hover:bg-slate-900 ${
                isSel ? "border-amber-400 ring-1 ring-amber-400/50" : "border-slate-800"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs font-bold" style={{ color }}>
                  {item.id} · {item.evidenceType.toUpperCase()}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLES[item.priority]}`}>
                  {item.priority}
                </span>
              </div>
              <div className="font-semibold text-slate-100">{item.label}</div>
              <div className="mt-1 line-clamp-2 text-xs text-slate-400">{item.description}</div>
              <div className="mt-3 h-1.5 w-full rounded bg-slate-800">
                <div className="h-1.5 rounded" style={{ width: `${item.confidence}%`, background: color }} />
              </div>
              <div className="mt-1 text-[10px] text-slate-500">AI confidence {item.confidence}%</div>
            </button>
          );
        })}
      </div>

      <aside className="h-fit rounded-xl border border-slate-800 bg-slate-900/80 p-5 lg:sticky lg:top-4">
        {!selected ? (
          <p className="text-sm text-slate-500">Select an evidence card to view detail, suggested processing, and related evidence.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="font-mono text-xs" style={{ color: TYPE_COLORS[selected.evidenceType] }}>
                {selected.id} · {selected.evidenceType.toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-100">{selected.label}</h3>
            </div>
            {photos[selected.photoIndex] && (
              <CroppedThumb src={photos[selected.photoIndex]} item={selected} />
            )}
            <p className="text-sm text-slate-300">{selected.description}</p>
            <div className="text-xs text-slate-400">
              <span className="text-slate-500">Estimated size: </span>{selected.estimatedSize}
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Suggested processing</div>
              <ul className="space-y-1">
                {selected.suggestedProcessing.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-amber-400">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            {selected.relatedTo.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Related evidence</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.relatedTo.map((id) => (
                    <button
                      key={id}
                      onClick={() => onSelect(id)}
                      className="rounded border border-slate-700 px-2 py-0.5 font-mono text-xs text-slate-300 hover:border-amber-400"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="border-t border-slate-800 pt-3 text-[10px] leading-relaxed text-slate-600">
              AI-assisted documentation aid. All findings require confirmation by a qualified investigator.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function CroppedThumb({ src, item }: { src: string; item: EvidenceItem }) {
  const { ymin, xmin, ymax, xmax } = item.box;
  const w = Math.max(xmax - xmin, 1);
  const h = Math.max(ymax - ymin, 1);
  return (
    <div className="h-40 w-full overflow-hidden rounded-lg border border-slate-800">
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: `${100000 / w}% ${100000 / h}%`,
          backgroundPosition: `${(xmin / (1000 - w)) * 100 || 0}% ${(ymin / (1000 - h)) * 100 || 0}%`,
        }}
      />
    </div>
  );
}
