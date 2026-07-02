"use client";

import type { SceneAnalysis } from "@/lib/types";
import { TYPE_COLORS } from "@/lib/ui";

export default function FloorPlan({
  analysis,
  selectedId,
  onSelect,
}: {
  analysis: SceneAnalysis;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const fp = analysis.floorPlan;
  const W = 640;
  const H = 480;
  const pad = 50;
  const px = (x: number) => pad + (x / 100) * (W - 2 * pad);
  const py = (y: number) => pad + (y / 100) * (H - 2 * pad);
  const typeOf = (id: string) => analysis.items.find((i) => i.id === id)?.evidenceType ?? "other";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-300">
        <span className="font-bold">BETA SKETCH</span>
        <span className="text-amber-200/80">{fp.caveat}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-2xl">
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#grid)" />
          <rect x={pad} y={pad} width={W - 2 * pad} height={H - 2 * pad} fill="none" stroke="#475569" strokeWidth="2" strokeDasharray="8 4" />
          <text x={W / 2} y={pad - 12} textAnchor="middle" fill="#64748b" fontSize="12" fontFamily="monospace">
            ~{fp.roomWidthMeters.toFixed(1)} m
          </text>
          <text x={pad - 14} y={H / 2} textAnchor="middle" fill="#64748b" fontSize="12" fontFamily="monospace" transform={`rotate(-90 ${pad - 14} ${H / 2})`}>
            ~{fp.roomDepthMeters.toFixed(1)} m
          </text>

          {fp.distances.map((d, i) => {
            const a = fp.items.find((it) => it.id === d.fromId);
            const b = fp.items.find((it) => it.id === d.toId);
            if (!a || !b) return null;
            const mx = (px(a.x) + px(b.x)) / 2;
            const my = (py(a.y) + py(b.y)) / 2;
            return (
              <g key={i}>
                <line x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <text x={mx} y={my - 4} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  ~{d.meters.toFixed(1)}m
                </text>
              </g>
            );
          })}

          {fp.items.map((it) => {
            const color = TYPE_COLORS[typeOf(it.id)];
            const sel = selectedId === it.id;
            return (
              <g key={it.id} onClick={() => onSelect(it.id)} className="cursor-pointer">
                {sel && <circle cx={px(it.x)} cy={py(it.y)} r={16} fill={color} opacity={0.25} />}
                <circle cx={px(it.x)} cy={py(it.y)} r={8} fill={color} stroke="#0f172a" strokeWidth="2" />
                <text x={px(it.x)} y={py(it.y) + 3.5} textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold" fontFamily="monospace">
                  {it.id.replace("E", "")}
                </text>
                <text x={px(it.x)} y={py(it.y) - 14} textAnchor="middle" fill="#e2e8f0" fontSize="10" fontFamily="monospace">
                  {it.label}
                </text>
              </g>
            );
          })}

          <g transform={`translate(${W / 2}, ${H - 24})`}>
            <path d="M -8 8 L 0 -6 L 8 8 Z" fill="#f59e0b" />
            <text x={0} y={22} textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace">
              CAMERA
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
