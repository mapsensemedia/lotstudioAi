# QA Notes — LotStudio AI

Minor issues found during qa-safety-reviewer pass on 2026-05-19. No critical or major issues; pipeline and all flows verified clean.

## Minor

1. **`approved_at` column maps to `updated_at`** — `app/api/export/route.ts:52` writes `job.updated_at` into the `approved_at` CSV column. This is the most recent update timestamp, which in practice equals the approval time only if no other update follows. Consider adding a dedicated `approved_at` column to the `jobs` table and setting it inside `approve/route.ts`.

2. **Reject does not clear a prior approval timestamp** — Related to #1: once a separate `approved_at` is added, the reject route should null it out.

3. **`edge_artifact_score` is a constant `1.0`** — `lib/pipeline/safety.ts:29`. Placeholder value; not used in production scoring today but worth wiring to a real metric (e.g., gradient diff across mask boundary) before exposing in UI.

4. **`shadowRgba` computed but unused** — `lib/pipeline/processJob.ts:59-69` builds a buffer that is only referenced via `void shadowRgba` at line 98. Dead code; remove to reduce confusion.

5. **Export route streams via `PassThrough` cast to `ReadableStream`** — `app/api/export/route.ts:62`. Works in current Node/Next runtime but the cast bypasses types; consider `Readable.toWeb(stream)` for cleanliness.

6. **Download route only serves `output_path`, no thumb/original variant** — `app/api/jobs/[id]/download/route.ts`. Minor UX; the `/api/files/...` route covers other kinds.

7. **`getJob` typed as `Job | undefined` but used with non-null `!` in approve/reject after the explicit not-found check** — fine, but switching to a single fetch + reuse would shave a query.

## Verified clean

- Vehicle preservation invariant: original RGB joined with mask alpha, composited over background+shadow; runtime assertion at `lib/pipeline/processJob.ts:104-106` throws when `vehicle_pixel_diff > 0.001`.
- Path traversal: `app/api/files/[kind]/[name]/route.ts:27-37` validates kind allowlist, rejects `..`, `/`, `\`, and enforces `startsWith(baseDir + sep)`.
- ZIP export: includes `audit_report.csv` with header `id,preset,safety_score,approved_at,original_filename,output_filename` and `outputs/` directory.
- Mock mode: no env vars required; pipeline uses local `sharp` + SVG only.
- Safety score surfaced in `components/JobCard.tsx:90-94` with color-coded badge.
- No `TODO`, `FIXME`, `lorem`, or `console.log` leaks in production paths (grep clean).
- Approve/reject return updated DTO; UI refetches via `onChange()`.
