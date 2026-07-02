export type Priority = "critical" | "high" | "medium" | "low";

export interface EvidenceItem {
  id: string;
  label: string;
  evidenceType: "weapon" | "biological" | "trace" | "impression" | "digital" | "environmental" | "other";
  description: string;
  photoIndex: number;
  box: { ymin: number; xmin: number; ymax: number; xmax: number }; // normalized 0-1000
  estimatedSize: string;
  priority: Priority;
  confidence: number; // 0-100
  suggestedProcessing: string[];
  relatedTo: string[];
}

export interface FloorPlanItem {
  id: string;
  label: string;
  x: number; // 0-100 room coords
  y: number;
}

export interface MissedEvidence {
  item: string;
  reason: string;
  action: string;
}

export interface SceneAnalysis {
  sceneType: string;
  sceneSummary: string;
  items: EvidenceItem[];
  floorPlan: {
    roomWidthMeters: number;
    roomDepthMeters: number;
    items: FloorPlanItem[];
    distances: { fromId: string; toId: string; meters: number }[];
    caveat: string;
  };
  missedEvidence: MissedEvidence[];
  narrativeReport: string;
}
