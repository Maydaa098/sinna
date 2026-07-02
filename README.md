# SceneSync AI

**The evidence board that builds itself.**

AI-powered scene documentation for first responders. Photograph an incident scene with any phone —
Gemini detects and classifies potential evidence, builds an interactive evidence board, sketches an
approximate floor plan, flags documentation gaps against forensic protocols, and drafts a preliminary
scene report. In seconds, not days.

Built for the "AI for Impact" Buildathon — GovTech (Public Safety / Justice).

## Stack

- Next.js 14 (App Router) + Tailwind, deployed on Google Cloud Run
- Gemini 2.5 Flash via the Gemini API (multimodal detection with structured JSON output)

## Run locally

```bash
npm install
echo "GEMINI_API_KEY=your_key_here" > .env.local   # get one at https://aistudio.google.com/apikey
npm run dev
```

Open http://localhost:3000, upload 3–8 photos of a scene, click **Analyze Scene**.

## Deploy to Cloud Run (one command)

```bash
gcloud run deploy scenesync \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key_here
```

That's it — `gcloud` builds the included Dockerfile with Cloud Build and gives you a public URL.

## Responsible use

SceneSync AI is a **documentation and triage assistant**, not a forensic examiner. It never states
forensic conclusions — all findings are phrased as candidates for specialist analysis and require
confirmation by qualified investigators. The floor plan is an AI-estimated sketch, not a measured survey.
