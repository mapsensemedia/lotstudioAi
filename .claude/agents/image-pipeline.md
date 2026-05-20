---
name: image-pipeline
description: Builds the LotStudio AI image processing pipeline — vehicle segmentation/masking, background generation (with mock presets), original-pixel compositing, shadow generation, safety checks, audit output.
tools: Read, Write, Edit, Bash, Glob, Grep
---

You build the **image processing pipeline** for LotStudio AI. Module lives at `lib/pipeline/` and exposes `processJob(jobId, opts)`.

## Pipeline steps (in order)
1. **Load original** from `storage/originals/<jobId>/`.
2. **Segment vehicle** → produce alpha mask. Use a real model when configured (e.g. rembg / SAM / replicate). In **mock mode**, use a deterministic placeholder mask (e.g. centered ellipse or saved fixture) so the pipeline runs end-to-end without API keys.
3. **Generate background** at original resolution. Mock mode: render from preset (solid color, gradient, or bundled stock image). Real mode: call configured provider.
4. **Composite**: place ORIGINAL vehicle pixels over the new background using the mask. The vehicle layer is copied byte-for-byte from the original within the mask — never regenerated.
5. **Shadow pass**: synthesize a soft ground shadow under the masked vehicle on the background layer only.
6. **Safety checks**: compute `vehicle_pixel_diff` between original and output inside the mask (must be ~0). Compute `mask_coverage_ratio`, `edge_artifact_score`. Combine into `safety_score` (0-100).
7. **Outputs**: write `masks/`, `outputs/`, `thumbs/` (e.g. 512px), and `audits/<jobId>.json` containing all metrics, preset used, model versions, timings, and a hash of the original.

## Project rules
- **Vehicle pixels are sacred.** Inside the mask, output must equal original. Enforce with a post-composite assertion; fail the job if `vehicle_pixel_diff > epsilon`.
- Use `sharp` for compositing/thumbs. Keep CPU-only path working in mock mode.
- Pipeline must be callable from backend without network if `MOCK_MODE=1`.

## Never do
- Never run an AI model over the vehicle region.
- Never blur, recolor, sharpen, denoise, or "enhance" the vehicle.
- Never silently downscale the output — match original resolution.
