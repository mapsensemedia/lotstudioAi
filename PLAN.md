# LotStudio AI — Build Plan

Web tool for car dealerships: upload vehicle photos → replace background → preserve real vehicle pixels via mask compositing → approve/reject → ZIP export with audit.

## Invariant (non-negotiable)
Vehicle pixels inside the segmentation mask are copied byte-for-byte from the original into the output. AI may only generate/modify the background. Enforced by `vehicle_pixel_diff` assertion in the pipeline.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- SQLite via `better-sqlite3`
- `sharp` for image ops
- Local filesystem storage under `./storage`
- Mock mode (`MOCK_MODE=1`) — no API keys required

## Phases

### Phase 1 — Scaffold + DevOps  *(owner: devops-setup)*
- `package.json`, `tsconfig.json`, Next.js + Tailwind config
- `.env.example`, `.gitignore`
- `storage/{originals,masks,outputs,thumbs,audits}/.gitkeep`
- `scripts/setup.sh`, `scripts/dev.sh`
- Initial `README.md`
- **Done when:** `./scripts/setup.sh && ./scripts/dev.sh` boots a blank Next.js page.

### Phase 2 — Backend API + DB + storage  *(owner: backend-api)*
- SQLite schema + migration on boot
- `/api/upload`, `/api/jobs`, `/api/jobs/:id`, `/api/jobs/:id/approve|reject`, `/api/jobs/:id/download`, `/api/export`, `/api/files/...`
- File storage helpers
- **Done when:** curl can upload an image, list jobs, and download it back.

### Phase 3 — Image Pipeline (mock first)  *(owner: image-pipeline)*
- `lib/pipeline/processJob.ts`
- Mock segmentation (ellipse mask), preset backgrounds, sharp composite, shadow pass, safety metrics, audit JSON
- Vehicle-preservation assertion
- **Done when:** processing a job produces mask/output/thumb/audit with `safety_score >= 95` on mock fixtures and `vehicle_pixel_diff == 0`.

### Phase 4 — Frontend UI  *(owner: frontend-ui)*
- Landing → Dashboard → Upload → Job cards → Before/After → Approve/Reject → Export ZIP
- **Done when:** end-to-end flow works in browser against real APIs.

### Phase 5 — QA & Safety pass  *(owner: qa-safety-reviewer)*
- Walk all flows, grep placeholders, verify invariant, fix critical/major
- **Done when:** `QA_NOTES.md` shows no critical/major open.

### Phase 6 — Copy & UX polish  *(owner: product-copy-ux)*
- Sweep all visible strings; enforce approved phrasing
- **Done when:** no banned phrasing remains; integrity disclaimer is visible.

## Out of scope (MVP)
Mobile app, DMS integrations, auth, billing, marketplace.

## Status
- [x] Subagents created in `.claude/agents/`
- [x] Plan written
- [ ] Phase 1 — Scaffold + DevOps  ← **next**
- [ ] Phase 2 — Backend API
- [ ] Phase 3 — Image Pipeline
- [ ] Phase 4 — Frontend UI
- [ ] Phase 5 — QA
- [ ] Phase 6 — Copy
