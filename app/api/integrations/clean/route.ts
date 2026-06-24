import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import sharp from 'sharp';
import { createJob, getJob, deleteJob } from '@/lib/db';
import { processJob } from '@/lib/pipeline/processJob';
import type { Preset } from '@/lib/pipeline/openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// The upstream image edit can run up to ~3 min; allow a generous ceiling.
export const maxDuration = 300;

const ORIGINALS_DIR = path.resolve('storage/originals');
const MAX_INPUT_BYTES = 25 * 1024 * 1024; // 25 MB
const FETCH_TIMEOUT_MS = 30_000;

const VALID_PRESETS = new Set<Preset>([
  'studio_white',
  'studio_gray',
  'showroom',
  'outdoor',
  'neutral_white',
  'ai_showroom',
  'ai_outdoor',
  'ai_luxury',
]);

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Machine-to-machine endpoint for external apps (e.g. a Lovable site) to clean a
 * single inventory image. Authenticated with the `x-api-key` header instead of the
 * Supabase cookie session — see middleware.ts where `/api/integrations/` is exempted
 * from the cookie gate so this key check is the sole gate.
 *
 * Request:  POST application/json
 *   { "image_url": "https://...", "preset"?, "shot_type"?, "quality"? }
 * Response: 200 application/json
 *   { "id", "mime": "image/png", "width", "height", "image_base64" }
 */
// Accept the key from several common header shapes and trim stray whitespace/newlines,
// so a caller that uses Authorization: Bearer or pastes a key with a trailing newline
// still authenticates.
function extractKey(req: NextRequest): { key: string; source: string } {
  const x = req.headers.get('x-api-key');
  if (x) return { key: x.trim(), source: 'x-api-key' };
  const auth = req.headers.get('authorization');
  if (auth) return { key: auth.replace(/^Bearer\s+/i, '').trim(), source: 'authorization' };
  const apikey = req.headers.get('apikey');
  if (apikey) return { key: apikey.trim(), source: 'apikey' };
  return { key: '', source: 'none' };
}

function mask(s: string): string {
  return s ? `${s.slice(0, 4)}…${s.slice(-4)} (len ${s.length})` : '(empty)';
}

export async function POST(req: NextRequest) {
  const expected = (process.env.INTEGRATION_API_KEY ?? '').trim();
  if (!expected) {
    return NextResponse.json({ error: 'integration_not_configured' }, { status: 503 });
  }
  const { key: provided, source } = extractKey(req);
  if (!provided || !timingSafeEqual(provided, expected)) {
    // Diagnostic body (masks the value) so callers can see WHY auth failed.
    return NextResponse.json(
      {
        error: 'unauthorized',
        debug: {
          header_used: source,
          provided_key: mask(provided),
          expected_len: expected.length,
          hint:
            source === 'none'
              ? 'No key header found. Send the key as the x-api-key header.'
              : provided.length !== expected.length
                ? 'Key length differs from expected — wrong value, or extra quotes/spaces.'
                : 'Same length but values differ — the key value does not match.',
        },
      },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const imageUrl = String(body.image_url ?? '').trim();
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return NextResponse.json({ error: 'invalid_image_url' }, { status: 400 });
  }

  const presetRaw = String(body.preset ?? 'studio_white').trim() as Preset;
  const preset: Preset = VALID_PRESETS.has(presetRaw) ? presetRaw : 'studio_white';

  const sRaw = String(body.shot_type ?? 'exterior').trim();
  const shot_type: 'exterior' | 'interior' | 'detail' =
    sRaw === 'interior' || sRaw === 'detail' ? sRaw : 'exterior';

  const qRaw = String(body.quality ?? 'medium').trim();
  const quality: 'low' | 'medium' | 'high' =
    qRaw === 'low' || qRaw === 'high' ? qRaw : 'medium';

  // Download the source image by URL.
  let inputBuf: Buffer;
  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(imageUrl, { signal: ac.signal });
    if (!res.ok) {
      return NextResponse.json({ error: `fetch_failed_${res.status}` }, { status: 400 });
    }
    const ct = res.headers.get('content-type') ?? '';
    if (ct && !ct.startsWith('image/')) {
      return NextResponse.json({ error: 'url_not_an_image' }, { status: 400 });
    }
    const arr = await res.arrayBuffer();
    if (arr.byteLength > MAX_INPUT_BYTES) {
      return NextResponse.json({ error: 'image_too_large' }, { status: 413 });
    }
    inputBuf = Buffer.from(arr);
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { error: aborted ? 'fetch_timeout' : 'fetch_error' },
      { status: 400 },
    );
  } finally {
    clearTimeout(timeout);
  }

  // Persist input and run the existing pipeline synchronously.
  fs.mkdirSync(ORIGINALS_DIR, { recursive: true });
  const id = nanoid();
  const origPath = path.join(ORIGINALS_DIR, `${id}.png`);

  try {
    await fsp.writeFile(origPath, inputBuf);
    createJob({ id, original_path: origPath, preset, quality, shot_type });

    await processJob(id);

    const job = getJob(id);
    if (!job || job.status !== 'done' || !job.output_path) {
      return NextResponse.json(
        { error: job?.error ?? 'processing_failed' },
        { status: 502 },
      );
    }

    const outBuf = await fsp.readFile(job.output_path);
    const meta = await sharp(outBuf).metadata();

    return NextResponse.json({
      id,
      mime: 'image/png',
      width: meta.width ?? null,
      height: meta.height ?? null,
      image_base64: outBuf.toString('base64'),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'clean_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Disk is only 1 GB and the caller keeps its own copy — clean up after each run.
    const job = getJob(id);
    deleteJob(id);
    for (const p of [origPath, job?.output_path, job?.thumb_path, job?.audit_path]) {
      if (p) {
        try {
          await fsp.unlink(p);
        } catch {
          /* ignore */
        }
      }
    }
  }
}
