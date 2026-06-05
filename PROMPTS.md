# LotStudio AI — Prompts Reference

Source of truth: `lib/pipeline/openai.ts`. This file is a human-readable mirror — keep it in sync when you edit prompts.

Three prompts are used for "replace background" jobs (chosen by the **Photo type** field on upload), plus one for Magic Eraser inpainting.

---

## 1. Exterior — `buildPrompt(preset)`

Used when **Photo type = Exterior**. Replaces the background with the chosen preset while constraining the model to leave the vehicle alone.

```
TASK: Clean and professionalize this vehicle listing photo.

ABSOLUTE RULE — VEHICLE IS IMMUTABLE:
Treat the vehicle in the input image as a fixed, locked, untouchable object. Reproduce the vehicle pixel-accurately — same outline, same paint, same wheels, same badges, same lights, same trim, same windows, same mirrors, same panel gaps, same reflections that are already on it, same position in the frame, same scale, same camera angle.
The vehicle in the output MUST be visually indistinguishable from the vehicle in the input.

STRICT REQUIREMENTS:
- Preserve the EXACT vehicle shape and geometry
- Preserve all manufacturer details and badges (every emblem, every letter, every logo identical)
- Preserve exact wheel/rim design (same spoke count, same finish, same brake calipers)
- Preserve exact paint color and finish (do not shift hue, do not change gloss, do not re-saturate)
- Preserve headlights, taillights, mirrors, trim, and body lines (every contour identical)
- Preserve license plate position and shape (text may be left blank or kept as-is, but do not relocate it)
- Preserve window tint exactly
- Preserve ride height and wheel position exactly
- Do NOT redesign, restyle, or "improve" the vehicle in any way
- Do NOT change perspective, framing, or camera angle
- Do NOT alter proportions
- Do NOT add aftermarket modifications, spoilers, decals, or accessories
- Do NOT hallucinate new reflections, highlights, or features on the body
- Do NOT change panel gaps, contours, or sheet-metal lines
- Do NOT make the car look CGI, plastic, or rendered
- Do NOT oversaturate, over-sharpen, or over-smooth the vehicle

ALLOWED CHANGES (background and environment ONLY):
- Replace the background with {SCENE[preset]}
- Remove background distractions: other vehicles, people, poles, signs, dealership buildings, dirt, clutter, debris
- Improve overall lighting consistency on the scene
- Reduce harsh ambient shadows in the surroundings
- Add a soft, realistic contact shadow directly under the vehicle to ground it in the new scene
- Slightly enhance sharpness and clarity (do not over-process)
- Clean floor reflections naturally
- Improve overall professionalism

STYLE:
Photorealistic automotive dealership photography. Natural lighting. OEM-accurate appearance. High-end but realistic. Not CGI. Not stylized. Not over-edited.

FINAL CHECK BEFORE OUTPUT:
If you cannot reproduce the vehicle exactly, prefer leaving it untouched. The background may change; the vehicle may NOT.
```

### Scene fragment `{SCENE[preset]}` per preset

| preset value     | substituted text |
|------------------|------------------|
| `studio_white`   | a clean neutral pure white dealership photography studio with a soft natural floor reflection |
| `studio_gray`    | a clean neutral light gray dealership photography studio with soft even lighting |
| `showroom`       | a clean modern car dealership showroom interior with a polished light floor and soft overhead lights |
| `outdoor`        | a clean empty outdoor dealership lot with smooth asphalt and a soft natural sky |
| `neutral_white`  | a clean neutral pure white dealership studio background |
| `ai_showroom`    | a photorealistic professional car dealership showroom interior with polished concrete floor and soft overhead studio lighting |
| `ai_outdoor`     | a photorealistic outdoor dealership lot with smooth asphalt and soft natural daylight |
| `ai_luxury`      | a photorealistic luxury dealership showroom with polished marble floor and warm accent spotlights |

---

## 2. Interior — `buildInteriorPrompt()`

Used when **Photo type = Interior**. No background replacement; cleans dealer cards, glare, reflections inside the cabin.

```
TASK: Clean up this vehicle interior photo for a dealership listing.

ABSOLUTE RULE — VEHICLE INTERIOR IS IMMUTABLE:
Reproduce every dashboard surface, control, screen, gauge, seat, panel, stitching, leather/cloth texture, and trim element pixel-accurately. Treat the entire vehicle interior shown in the input as a fixed, locked, untouchable object.

ALLOWED CHANGES (distractions only):
- Remove printed papers, dealer cards, floor mats with logos or text, paperwork, or any non-OEM printed materials lying on seats, floors, dashboards, or center console
- Remove dust, fingerprints, smudges, and light dirt from glass, screens, and plastic surfaces
- Remove harsh ambient reflections of the surrounding shop / building visible in windows, screens, or chrome
- Remove any people, hands, or photographer reflections visible in glass
- Even out lighting on interior surfaces slightly

DO NOT:
- Change the steering wheel, gear lever, dashboard layout, screens, infotainment UI, instrument cluster readings, button labels, or seat design
- Re-color any surface, stitching, or trim
- Move, rotate, or rescale any control
- Replace OEM badges, logos, or screen graphics
- Make the interior look CGI, plastic, or rendered
- Invent new surfaces, new reflections, or new lighting that wasn't there

STYLE: Photorealistic OEM-accurate vehicle interior photography. Natural even lighting. Not CGI.
```

---

## 3. Detail — `buildDetailPrompt()`

Used when **Photo type = Detail**. For close-ups of a single part (gear lever, instrument cluster, badge, infotainment screen, wheel).

```
TASK: Clean up this vehicle detail close-up for a dealership listing.

ABSOLUTE RULE — THE SUBJECT IS IMMUTABLE:
The detail part (e.g. gear lever, instrument cluster, badge, control, wheel, infotainment screen) must be reproduced pixel-accurately. Same shape, same color, same labels, same readings, same reflections that are already on it.

ALLOWED CHANGES:
- Remove dust, fingerprints, smudges, fibers, and lint
- Remove distracting background clutter visible at the edges of the frame
- Remove harsh ambient reflections of the surrounding shop on glass or chrome
- Even out lighting slightly

DO NOT:
- Change any text, label, readout, number, or icon on the detail part
- Re-color any surface
- Resize, rotate, or recompose the detail part
- Make it look CGI, plastic, or rendered
- Invent new reflections, highlights, or features

STYLE: Photorealistic OEM-accurate close-up automotive photography. Natural lighting. Not CGI.
```

---

## 4. Magic Eraser — `ERASE_PROMPT`

Used by `/erase` / `inpaintWithMaskOpenAI`. Sent alongside a user-drawn mask; the model only fills the brushed area, so the rest of the photo is mathematically preserved by the API itself — the prompt only needs to describe what to put inside the brushed region.

```
Cleanly inpaint the masked area to match the surrounding surfaces, materials, lighting, and reflections. Photorealistic. No people, no text, no logos, no objects.
```

---

## Fixed call parameters

These apply to every job and are not part of the prompt text:

- Output dimensions: **1536×1024**
- Quality: **medium**
- Single image per call (`n=1`)
- Input image is pre-normalized to PNG and downscaled to a 1536px max edge before sending

## How to tune

If car details still drift, the lever is **specificity in the strict rules**. Add a line that names the exact thing being broken (e.g. "Preserve the chrome ring at the base of the gear lever") — concrete, observable constraints work better than general appeals.

If background replacements look fake, tune the **scene fragment** for the preset (table in §1) and the trailing STYLE line, NOT the strict rules.
