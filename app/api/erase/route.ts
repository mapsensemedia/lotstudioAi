import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import path from 'node:path';
import fs from 'node:fs';
import { createJob, getJob, updateJob } from '@/lib/db';
import { jobToDTO } from '@/lib/urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ORIGINALS_DIR = path.resolve('storage/originals');
const MASKS_DIR = path.resolve('storage/masks');

function fireErase(id: string) {
  import('@/lib/pipeline/eraseJob')
    .then((m) => m.eraseJob(id))
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      try {
        updateJob(id, { status: 'failed', error: message });
      } catch {
        /* ignore */
      }
    });
}

export async function POST(req: NextRequest) {
  try {
    fs.mkdirSync(ORIGINALS_DIR, { recursive: true });
    fs.mkdirSync(MASKS_DIR, { recursive: true });
    const form = await req.formData();

    const image = form.get('image');
    const mask = form.get('mask');
    if (!(image instanceof File)) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }
    if (!(mask instanceof Blob)) {
      return NextResponse.json({ error: 'Missing mask' }, { status: 400 });
    }

    const qRaw = (form.get('quality')?.toString() || 'medium').trim();
    const quality: 'low' | 'medium' | 'high' =
      qRaw === 'low' || qRaw === 'high' ? qRaw : 'medium';

    const id = nanoid();
    const ext = path.extname(image.name || '') || '.jpg';
    const safeExt = ext.replace(/[^.A-Za-z0-9]/g, '').slice(0, 8) || '.jpg';
    const origPath = path.join(ORIGINALS_DIR, `${id}${safeExt}`);
    const maskPath = path.join(MASKS_DIR, `${id}.png`);

    fs.writeFileSync(origPath, Buffer.from(await image.arrayBuffer()));
    fs.writeFileSync(maskPath, Buffer.from(await mask.arrayBuffer()));

    createJob({
      id,
      original_path: origPath,
      preset: 'studio_white',
      quality,
      shot_type: 'detail',
    });
    updateJob(id, { mask_path: maskPath });
    fireErase(id);

    const job = getJob(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found after creation' }, { status: 500 });
    }
    return NextResponse.json({ job: jobToDTO(job) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erase failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
