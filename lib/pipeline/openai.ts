import sharp from 'sharp';

export type Preset =
  | 'studio_white'
  | 'studio_gray'
  | 'showroom'
  | 'outdoor'
  | 'neutral_white'
  | 'ai_showroom'
  | 'ai_outdoor'
  | 'ai_luxury';

const SCENE: Record<Preset, string> = {
  studio_white:
    'a clean neutral pure white dealership photography studio with a soft natural floor reflection',
  studio_gray:
    'a clean neutral light gray dealership photography studio with soft even lighting',
  showroom:
    'a clean modern car dealership showroom interior with a polished light floor and soft overhead lights',
  outdoor:
    'a clean empty outdoor dealership lot with smooth asphalt and a soft natural sky',
  neutral_white:
    'a clean neutral pure white dealership studio background',
  ai_showroom:
    'a photorealistic professional car dealership showroom interior with polished concrete floor and soft overhead studio lighting',
  ai_outdoor:
    'a photorealistic outdoor dealership lot with smooth asphalt and soft natural daylight',
  ai_luxury:
    'a photorealistic luxury dealership showroom with polished marble floor and warm accent spotlights',
};

function buildPrompt(preset: Preset): string {
  return [
    'TASK: Clean and professionalize this vehicle listing photo.',
    '',
    'ABSOLUTE RULE — VEHICLE IS IMMUTABLE:',
    'Treat the vehicle in the input image as a fixed, locked, untouchable object. Reproduce the vehicle pixel-accurately — same outline, same paint, same wheels, same badges, same lights, same trim, same windows, same mirrors, same panel gaps, same reflections that are already on it, same position in the frame, same scale, same camera angle.',
    'The vehicle in the output MUST be visually indistinguishable from the vehicle in the input.',
    '',
    'STRICT REQUIREMENTS:',
    '- Preserve the EXACT vehicle shape and geometry',
    '- Preserve all manufacturer details and badges (every emblem, every letter, every logo identical)',
    '- Preserve exact wheel/rim design (same spoke count, same finish, same brake calipers)',
    '- Preserve exact paint color and finish (do not shift hue, do not change gloss, do not re-saturate)',
    '- Preserve headlights, taillights, mirrors, trim, and body lines (every contour identical)',
    '- Preserve license plate position and shape (text may be left blank or kept as-is, but do not relocate it)',
    '- Preserve window tint exactly',
    '- Preserve ride height and wheel position exactly',
    '- Do NOT redesign, restyle, or "improve" the vehicle in any way',
    '- Do NOT change perspective, framing, or camera angle',
    '- Do NOT alter proportions',
    '- Do NOT add aftermarket modifications, spoilers, decals, or accessories',
    '- Do NOT hallucinate new reflections, highlights, or features on the body',
    '- Do NOT change panel gaps, contours, or sheet-metal lines',
    '- Do NOT make the car look CGI, plastic, or rendered',
    '- Do NOT oversaturate, over-sharpen, or over-smooth the vehicle',
    '',
    'ALLOWED CHANGES (background and environment ONLY):',
    `- Replace the background with ${SCENE[preset]}`,
    '- Remove background distractions: other vehicles, people, poles, signs, dealership buildings, dirt, clutter, debris',
    '- Improve overall lighting consistency on the scene',
    '- Reduce harsh ambient shadows in the surroundings',
    '- Add a soft, realistic contact shadow directly under the vehicle to ground it in the new scene',
    '- Slightly enhance sharpness and clarity (do not over-process)',
    '- Clean floor reflections naturally',
    '- Improve overall professionalism',
    '',
    'STYLE:',
    'Photorealistic automotive dealership photography. Natural lighting. OEM-accurate appearance. High-end but realistic. Not CGI. Not stylized. Not over-edited.',
    '',
    'FINAL CHECK BEFORE OUTPUT:',
    'If you cannot reproduce the vehicle exactly, prefer leaving it untouched. The background may change; the vehicle may NOT.',
  ].join('\n');
}

function pickSize(width: number, height: number): '1024x1024' | '1536x1024' | '1024x1536' {
  const aspect = width / height;
  if (aspect > 1.2) return '1536x1024';
  if (aspect < 0.83) return '1024x1536';
  return '1024x1024';
}

export type Quality = 'low' | 'medium' | 'high';
export type ShotType = 'exterior' | 'interior' | 'detail';

function buildInteriorPrompt(): string {
  return [
    'TASK: Clean up this vehicle interior photo for a dealership listing.',
    '',
    'ABSOLUTE RULE — VEHICLE INTERIOR IS IMMUTABLE:',
    'Reproduce every dashboard surface, control, screen, gauge, seat, panel, stitching, leather/cloth texture, and trim element pixel-accurately. Treat the entire vehicle interior shown in the input as a fixed, locked, untouchable object.',
    '',
    'ALLOWED CHANGES (distractions only):',
    '- Remove printed papers, dealer cards, floor mats with logos or text, paperwork, or any non-OEM printed materials lying on seats, floors, dashboards, or center console',
    '- Remove dust, fingerprints, smudges, and light dirt from glass, screens, and plastic surfaces',
    '- Remove harsh ambient reflections of the surrounding shop / building visible in windows, screens, or chrome',
    '- Remove any people, hands, or photographer reflections visible in glass',
    '- Even out lighting on interior surfaces slightly',
    '',
    'DO NOT:',
    '- Change the steering wheel, gear lever, dashboard layout, screens, infotainment UI, instrument cluster readings, button labels, or seat design',
    '- Re-color any surface, stitching, or trim',
    '- Move, rotate, or rescale any control',
    '- Replace OEM badges, logos, or screen graphics',
    '- Make the interior look CGI, plastic, or rendered',
    '- Invent new surfaces, new reflections, or new lighting that wasn\'t there',
    '',
    'STYLE: Photorealistic OEM-accurate vehicle interior photography. Natural even lighting. Not CGI.',
  ].join('\n');
}

function buildDetailPrompt(): string {
  return [
    'TASK: Clean up this vehicle detail close-up for a dealership listing.',
    '',
    'ABSOLUTE RULE — THE SUBJECT IS IMMUTABLE:',
    'The detail part (e.g. gear lever, instrument cluster, badge, control, wheel, infotainment screen) must be reproduced pixel-accurately. Same shape, same color, same labels, same readings, same reflections that are already on it.',
    '',
    'ALLOWED CHANGES:',
    '- Remove dust, fingerprints, smudges, fibers, and lint',
    '- Remove distracting background clutter visible at the edges of the frame',
    '- Remove harsh ambient reflections of the surrounding shop on glass or chrome',
    '- Even out lighting slightly',
    '',
    'DO NOT:',
    '- Change any text, label, readout, number, or icon on the detail part',
    '- Re-color any surface',
    '- Resize, rotate, or recompose the detail part',
    '- Make it look CGI, plastic, or rendered',
    '- Invent new reflections, highlights, or features',
    '',
    'STYLE: Photorealistic OEM-accurate close-up automotive photography. Natural lighting. Not CGI.',
  ].join('\n');
}

export async function editImageWithOpenAI(
  origBuf: Buffer,
  width: number,
  height: number,
  preset: Preset,
  quality: Quality = 'medium',
  shotType: ShotType = 'exterior',
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  // Downscale large inputs to ~1536px max edge — gpt-image accepts up to 1536,
  // and smaller inputs upload + process faster without affecting output quality
  // (the model renders at the requested `size` regardless of input dims).
  const maxEdge = 1536;
  const needsResize = Math.max(width, height) > maxEdge;
  const pngBuf = needsResize
    ? await sharp(origBuf).resize({ width: maxEdge, height: maxEdge, fit: 'inside' }).png().toBuffer()
    : await sharp(origBuf).png().toBuffer();
  const size = pickSize(width, height);

  const prompt =
    shotType === 'interior' ? buildInteriorPrompt() :
    shotType === 'detail' ? buildDetailPrompt() :
    buildPrompt(preset);

  const form = new FormData();
  form.append('model', 'gpt-image-2');
  form.append('prompt', prompt);
  form.append('size', size);
  form.append('n', '1');
  form.append('quality', quality);
  form.append('image', new Blob([pngBuf], { type: 'image/png' }), 'input.png');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI images/edits failed: ${res.status} ${errText}`);
  }
  const data = (await res.json()) as { data: Array<{ b64_json?: string; url?: string }> };
  const item = data.data[0];
  let outBuf: Buffer;
  if (item.b64_json) {
    outBuf = Buffer.from(item.b64_json, 'base64');
  } else if (item.url) {
    const imgRes = await fetch(item.url);
    outBuf = Buffer.from(await imgRes.arrayBuffer());
  } else {
    throw new Error('OpenAI response missing image data');
  }
  return sharp(outBuf).resize(width, height, { fit: 'cover' }).png().toBuffer();
}
