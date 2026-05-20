# LotStudio AI

LotStudio AI replaces the background of car dealership photos while leaving every vehicle pixel untouched. The pipeline segments the vehicle, generates or selects a new background, and composites the original vehicle pixels back on top via a hard mask — so the car you see in the output is bit-for-bit the car from the input, just on a cleaner lot.

## MVP Scope

**In:**
- Single-image upload (drag-and-drop) in a Next.js web UI
- Vehicle segmentation -> background generation/selection -> mask composite
- Preset background library (showroom, studio, sunset lot, etc.)
- Local SQLite job/audit tracking
- Local filesystem storage for originals, masks, outputs, thumbnails, and audit artifacts
- Deterministic **mock mode** so the whole flow runs with zero external API calls

**Out (explicitly):**
- No mobile app
- No authentication / user accounts
- No billing or subscriptions
- No DMS (Dealer Management System) integrations
- No marketplace / multi-tenant features

## Quickstart

```
cp .env.example .env
./scripts/setup.sh
./scripts/dev.sh
```

Then open http://localhost:3000.

## Mock Mode

`MOCK_MODE=1` is the **default** in `.env.example` and is what `./scripts/dev.sh` runs with. In mock mode the pipeline:

- Produces a deterministic elliptical vehicle mask sized to the input image (no ML inference)
- Picks a preset background from the bundled library instead of calling any generation API
- Makes **zero external network calls** — safe for offline dev, CI, and demos

Flip `MOCK_MODE=0` once you wire in real segmentation and background-generation backends.

## Folder Layout

```
app/                    Next.js app router (UI + API routes)
components/             React components for upload, preview, results
lib/
  db/                   SQLite schema, migrations, query helpers
  pipeline/             Segmentation, background, compositing, integrity checks
storage/
  originals/            Uploaded source photos
  masks/                Generated vehicle masks
  outputs/              Final composited images
  thumbs/               Thumbnails for the UI
  audits/               Per-job audit artifacts (diffs, metrics, logs)
scripts/                setup.sh, dev.sh, and maintenance utilities
.claude/agents/         Subagent role specs for Claude Code
```

## API Summary

- `POST /api/upload` — accept an image, persist to `storage/originals/`, create a job row.
- `POST /api/jobs` — kick off the pipeline for an uploaded image with chosen background preset.
- `GET  /api/jobs/:id` — poll job status, get URLs to mask/output/thumb/audit.
- `GET  /api/presets` — list available background presets.
- `GET  /api/health` — liveness + mock-mode flag.

## Vehicle Integrity Guarantee

LotStudio AI guarantees that **every pixel inside the vehicle mask in the output is identical to the corresponding pixel in the input**. This is enforced by construction:

1. Segment the vehicle to produce a binary mask `M`.
2. Generate or select a new background image `B` sized to the input.
3. Composite: `output = M * original + (1 - M) * B`.

The generator never sees the chance to repaint the car — vehicle pixels are copied straight from the source. At runtime the pipeline performs a `vehicle_pixel_diff` assertion: it recomputes `M * output` vs `M * original` and aborts the job (writing a record to `storage/audits/`) if any masked pixel differs. A passing job means zero drift on the car itself.

## Deploy to Render

`render.yaml` is a Render Blueprint that defines a single Node web service with a 1GB persistent disk mounted at `/opt/render/project/src/storage` (so SQLite and uploaded files survive deploys and restarts).

1. Push the repo to GitHub.
2. Sign in to https://dashboard.render.com → **New +** → **Blueprint** → connect this repo → Render reads `render.yaml` automatically.
3. After Render provisions the service, open **Environment** and set `OPENAI_API_KEY` to your key.
4. First deploy will install native deps (`better-sqlite3`, `sharp`) and run `next build`. Expect ~3–5 minutes.

Notes:
- **Plan**: the Blueprint declares `plan: starter` ($7/mo). Persistent disks require Starter or higher — the free tier resets storage on every deploy.
- **First request after idle** can be slow on Starter due to cold start; bump to Standard if that matters.
- The `start` script reads `$PORT` from Render automatically.

## Future deployment notes

- **Worker queue**: image jobs currently run fire-and-forget inside the web service. For high volume, move the pipeline behind a queue (Inngest / Trigger.dev / a separate Render Background Worker).
- **Object storage**: swap the `storage/*` filesystem helpers for S3 or Cloudflare R2 when scaling past one node.
- **Postgres**: swap `better-sqlite3` for Render's managed Postgres if you need multi-instance read concurrency.

## Dependency Notes

- **Node 20+** required.
- Native deps **`better-sqlite3`** and **`sharp`** compile on install — make sure you have Xcode Command Line Tools (macOS) or `build-essential` + `python3` (Linux) available before running `./scripts/setup.sh`. No manual rebuild step is needed; `npm install` handles it.
