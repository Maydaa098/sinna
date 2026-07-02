"use client";

import { useCallback, useRef, useState } from "react";
import type { SceneAnalysis } from "@/lib/types";
import PhotoOverlay from "@/components/PhotoOverlay";
import EvidenceBoard from "@/components/EvidenceBoard";
import FloorPlan from "@/components/FloorPlan";

type Stage = "upload" | "analyzing" | "results";
type Tab = "photos" | "board" | "floorplan" | "report";

const MAX_PHOTOS = 8;
const MAX_DIM = 1280;

async function fileToResizedBase64(file: File): Promise<{ data: string; mimeType: string; preview: string }> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { data: dataUrl.split(",")[1], mimeType: "image/jpeg", preview: dataUrl };
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [photos, setPhotos] = useState<{ data: string; mimeType: string; preview: string }[]>([]);
  const [notes, setNotes] = useState("");
  const [analysis, setAnalysis] = useState<SceneAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("photos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const converted = await Promise.all(imgs.map(fileToResizedBase64));
    setPhotos((p) => [...p, ...converted].slice(0, MAX_PHOTOS));
  }, []);

  const analyze = async () => {
    setStage("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos.map(({ data, mimeType }) => ({ data, mimeType })),
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
      setAnalysis(json as SceneAnalysis);
      setTab("photos");
      setSelectedId(null);
      setStage("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setStage("upload");
    }
  };

  const reset = () => {
    setStage("upload");
    setPhotos([]);
    setNotes("");
    setAnalysis(null);
    setSelectedId(null);
    setError(null);
  };

  const selectFromAnywhere = (id: string) => {
    setSelectedId(id);
    setTab("board");
  };

  const critical = analysis?.items.filter((i) => i.priority === "critical").length ?? 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 font-mono text-lg font-black text-slate-950">S</div>
            <div>
              <h1 className="font-mono text-lg font-bold tracking-tight text-slate-100">
                SceneSync <span className="text-amber-400">AI</span>
              </h1>
              <p className="text-[11px] text-slate-500">The evidence board that builds itself</p>
            </div>
          </div>
          {stage === "results" && (
            <button onClick={reset} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-amber-400 hover:text-amber-400">
              + New Scan
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {stage === "upload" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-100">Scan a scene</h2>
              <p className="mt-2 text-sm text-slate-400">
                Upload 3–8 photos of the scene from different angles. Gemini will detect and classify potential
                evidence, build an interactive evidence board, and flag documentation gaps — in seconds.
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-10 text-center transition hover:border-amber-400/60"
            >
              <div className="font-mono text-4xl">📷</div>
              <p className="mt-3 font-semibold text-slate-300">Drop scene photos here, or tap to select</p>
              <p className="mt-1 text-xs text-slate-500">JPEG / PNG · up to {MAX_PHOTOS} photos · works from a phone camera</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files && addFiles(e.target.files)}
              />
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg border border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.preview} alt={`Photo ${i + 1}`} className="h-24 w-full object-cover" />
                    <button
                      onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 hidden h-6 w-6 rounded-full bg-black/70 text-xs text-white group-hover:block"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 font-mono text-[10px]">#{i}</span>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional officer notes (e.g. 'reported burglary, rear entrance')"
              rows={2}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm placeholder:text-slate-600 focus:border-amber-400 focus:outline-none"
            />

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            <button
              onClick={analyze}
              disabled={photos.length === 0}
              className="w-full rounded-xl bg-amber-400 py-4 font-mono text-lg font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-30"
            >
              🔍 ANALYZE SCENE
            </button>
            <p className="text-center text-[11px] leading-relaxed text-slate-600">
              SceneSync AI is a documentation &amp; triage assistant for first responders. It does not draw forensic
              conclusions — all findings are flagged for confirmation by qualified investigators.
            </p>
          </div>
        )}

        {stage === "analyzing" && (
          <div className="mx-auto max-w-md py-24 text-center">
            <div className="relative mx-auto h-32 w-32">
              <div className="absolute inset-0 animate-ping rounded-full border-2 border-amber-400/40" />
              <div className="absolute inset-4 animate-pulse rounded-full border-2 border-amber-400/60" />
              <div className="absolute inset-0 flex items-center justify-center font-mono text-3xl">🔍</div>
            </div>
            <h2 className="mt-8 font-mono text-xl font-bold text-amber-400">ANALYZING SCENE…</h2>
            <p className="mt-3 text-sm text-slate-400">
              Detecting evidence · estimating spatial layout · cross-referencing forensic protocols
            </p>
          </div>
        )}

        {stage === "results" && analysis && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Scene type" value={analysis.sceneType} />
              <Stat label="Evidence items" value={String(analysis.items.length)} />
              <Stat label="Critical priority" value={String(critical)} accent={critical > 0 ? "text-red-400" : undefined} />
              <Stat
                label="Documentation gaps"
                value={String(analysis.missedEvidence.length)}
                accent={analysis.missedEvidence.length > 0 ? "text-amber-400" : "text-emerald-400"}
              />
            </div>

            {analysis.missedEvidence.length > 0 && (
              <div className="animate-pulse-slow rounded-xl border border-red-500/50 bg-red-500/10 p-4">
                <div className="font-mono text-sm font-bold text-red-400">
                  ⚠️ {analysis.missedEvidence.length} POTENTIAL EVIDENCE ITEM{analysis.missedEvidence.length > 1 ? "S" : ""} NOT PHOTOGRAPHED
                </div>
                <ul className="mt-2 space-y-1.5">
                  {analysis.missedEvidence.map((m, i) => (
                    <li key={i} className="text-sm text-slate-300">
                      <span className="font-semibold text-red-300">→ {m.item}</span>
                      <span className="text-slate-400"> — {m.reason}. </span>
                      <span className="text-amber-300">{m.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">{analysis.sceneSummary}</p>

            <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 p-1">
              {(
                [
                  ["photos", "📷 Scene Photos"],
                  ["board", "🗂 Evidence Board"],
                  ["floorplan", "📐 Floor Plan (beta)"],
                  ["report", "📄 Report"],
                ] as [Tab, string][]
              ).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 font-mono text-sm font-semibold transition ${
                    tab === t ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            {tab === "photos" && (
              <div className="grid gap-5 md:grid-cols-2">
                {photos.map((p, i) => (
                  <div key={i}>
                    <div className="mb-1 font-mono text-xs text-slate-500">PHOTO #{i}</div>
                    <PhotoOverlay
                      src={p.preview}
                      items={analysis.items.filter((it) => it.photoIndex === i)}
                      selectedId={selectedId}
                      onSelect={selectFromAnywhere}
                    />
                  </div>
                ))}
              </div>
            )}

            {tab === "board" && (
              <EvidenceBoard
                items={analysis.items}
                photos={photos.map((p) => p.preview)}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            )}

            {tab === "floorplan" && <FloorPlan analysis={analysis} selectedId={selectedId} onSelect={selectFromAnywhere} />}

            {tab === "report" && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-amber-400">Preliminary Scene Report</h3>
                  <span className="font-mono text-[11px] text-slate-500">{new Date().toISOString()} · AI-generated draft</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">{analysis.narrativeReport}</p>
                <p className="mt-5 border-t border-slate-800 pt-3 text-[11px] text-slate-600">
                  Draft generated by SceneSync AI for investigator review. Not a substitute for an official forensic report.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 truncate font-mono text-lg font-bold ${accent ?? "text-slate-100"}`}>{value}</div>
    </div>
  );
}
