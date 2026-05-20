import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import path from 'node:path';
import fs from 'node:fs';
import { createJob, updateJob } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ORIGINALS_DIR = path.resolve('storage/originals');

function fireProcess(id: string) {
  import('@/lib/pipeline/processJob')
    .then((m) => m.processJob(id))
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
    const form = await req.formData();
    const preset = (form.get('preset')?.toString() || 'studio_gray').trim();
    const qRaw = (form.get('quality')?.toString() || 'medium').trim();
    const quality: 'low' | 'medium' | 'high' =
      qRaw === 'low' || qRaw === 'high' ? qRaw : 'medium';

    const files: File[] = [];
    for (const entry of form.getAll('files')) {
      if (entry instanceof File) files.push(entry);
    }
    for (const entry of form.getAll('file')) {
      if (entry instanceof File) files.push(entry);
    }
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const jobs: { id: string; status: string }[] = [];
    for (const file of files) {
      const id = nanoid();
      const ext = path.extname(file.name || '') || '.jpg';
      const safeExt = ext.replace(/[^.A-Za-z0-9]/g, '').slice(0, 8) || '.jpg';
      const dest = path.join(ORIGINALS_DIR, `${id}${safeExt}`);
      const buf = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(dest, buf);
      createJob({ id, original_path: dest, preset, quality });
      fireProcess(id);
      jobs.push({ id, status: 'queued' });
    }

    return NextResponse.json({ jobs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
