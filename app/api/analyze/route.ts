import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { SceneAnalysis } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const itemSchema = {
  type: SchemaType.OBJECT,
  properties: {
    id: { type: SchemaType.STRING },
    label: { type: SchemaType.STRING },
    evidenceType: {
      type: SchemaType.STRING,
      enum: ["weapon", "biological", "trace", "impression", "digital", "environmental", "other"],
      format: "enum",
    },
    description: { type: SchemaType.STRING },
    photoIndex: { type: SchemaType.INTEGER },
    box: {
      type: SchemaType.OBJECT,
      properties: {
        ymin: { type: SchemaType.INTEGER },
        xmin: { type: SchemaType.INTEGER },
        ymax: { type: SchemaType.INTEGER },
        xmax: { type: SchemaType.INTEGER },
      },
      required: ["ymin", "xmin", "ymax", "xmax"],
    },
    estimatedSize: { type: SchemaType.STRING },
    priority: { type: SchemaType.STRING, enum: ["critical", "high", "medium", "low"], format: "enum" },
    confidence: { type: SchemaType.INTEGER },
    suggestedProcessing: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    relatedTo: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: [
    "id", "label", "evidenceType", "description", "photoIndex", "box",
    "estimatedSize", "priority", "confidence", "suggestedProcessing", "relatedTo",
  ],
} as const;

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    sceneType: { type: SchemaType.STRING },
    sceneSummary: { type: SchemaType.STRING },
    items: { type: SchemaType.ARRAY, items: itemSchema },
    floorPlan: {
      type: SchemaType.OBJECT,
      properties: {
        roomWidthMeters: { type: SchemaType.NUMBER },
        roomDepthMeters: { type: SchemaType.NUMBER },
        items: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              label: { type: SchemaType.STRING },
              x: { type: SchemaType.NUMBER },
              y: { type: SchemaType.NUMBER },
            },
            required: ["id", "label", "x", "y"],
          },
        },
        distances: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              fromId: { type: SchemaType.STRING },
              toId: { type: SchemaType.STRING },
              meters: { type: SchemaType.NUMBER },
            },
            required: ["fromId", "toId", "meters"],
          },
        },
        caveat: { type: SchemaType.STRING },
      },
      required: ["roomWidthMeters", "roomDepthMeters", "items", "distances", "caveat"],
    },
    missedEvidence: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          item: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
          action: { type: SchemaType.STRING },
        },
        required: ["item", "reason", "action"],
      },
    },
    narrativeReport: { type: SchemaType.STRING },
  },
  required: ["sceneType", "sceneSummary", "items", "floorPlan", "missedEvidence", "narrativeReport"],
} as const;

const SYSTEM_PROMPT = `You are SceneSync AI, a forensic scene documentation assistant used by first responders.
You analyze incident scene photographs and produce a structured documentation package.

IMPORTANT PRINCIPLES:
- You are a DOCUMENTATION AND TRIAGE assistant, not a forensic examiner. Never state forensic conclusions as fact.
  Use language like "possible", "candidate for", "flag for specialist analysis".
- Detect and classify every item of potential evidentiary value in each photo: possible weapons,
  possible biological material (stains that could be blood), trace evidence (glass fragments, fibres),
  impressions (footprints, tool marks), displaced objects, points of entry/exit, digital devices.
- For each item return a tight bounding box in that photo, normalized to 0-1000 coordinates
  (ymin, xmin, ymax, xmax).
- photoIndex is the 0-based index of the photo the item appears in. If the same physical item appears in
  multiple photos, report it once, in the clearest photo.
- Give each item a short unique id like "E1", "E2"...
- relatedTo lists ids of other items with a plausible spatial or causal relationship, e.g. a footprint
  aligned with an overturned chair.
- MISSED EVIDENCE: infer the scene type, then cross-reference what was photographed against standard
  forensic documentation protocols for that scene type. List concrete things an officer should photograph
  or collect BEFORE leaving that are NOT visible in the supplied photos (e.g. door handles for prints,
  window latches, wider establishing shots, scale references). Base this ONLY on what is genuinely absent.
  If documentation looks complete, return an empty list.
- FLOOR PLAN (approximate): estimate a top-down layout of the scene. Place each evidence item at x,y
  coordinates on a 0-100 grid (x = left-right, y = near-far from main camera position). Estimate room
  dimensions in meters and distances between key item pairs. Always include a caveat that this is an
  AI-estimated sketch from photographs, not a measured survey.
- narrativeReport: a concise, professional preliminary scene report (5-10 sentences) suitable for a case file,
  written in neutral, non-conclusory language.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
  }

  let body: { images: { data: string; mimeType: string }[]; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.images?.length) {
    return NextResponse.json({ error: "No images provided." }, { status: 400 });
  }
  if (body.images.length > 8) {
    return NextResponse.json({ error: "Maximum 8 photos per scan." }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as never,
      temperature: 0.2,
    },
  });

  const parts = [
    {
      text:
        `Analyze these ${body.images.length} scene photographs (photo indexes 0-${body.images.length - 1}).` +
        (body.notes ? ` Officer notes: ${body.notes}` : ""),
    },
    ...body.images.map((img) => ({ inlineData: { data: img.data, mimeType: img.mimeType } })),
  ];

  try {
    const result = await model.generateContent(parts);
    const analysis = JSON.parse(result.response.text()) as SceneAnalysis;
    return NextResponse.json(analysis);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
