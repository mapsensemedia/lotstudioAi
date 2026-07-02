import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createJob, getJob, updateJob } from '@/lib/db';
import { jobToDTO } from '@/lib/urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const source = getJob(params.id);
    if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let preset = source.preset;
    let quality: 'low' | 'medium' | 'high' = source.quality ?? 'medium';
    let shot_type: 'exterior' | 'interior' | 'detail' | 'interior_white' = source.shot_type ?? 'exterior';
    try {
      const text = await req.text();
      if (text) {
        const body = JSON.parse(text) as { preset?: string; quality?: string; shot_type?: string };
        if (body?.preset) preset = body.preset;
        if (body?.quality === 'low' || body?.quality === 'medium' || body?.quality === 'high') {
          quality = body.quality;
        }
        if (body?.shot_type === 'exterior' || body?.shot_type === 'interior' || body?.shot_type === 'detail' || body?.shot_type === 'interior_white') {
          shot_type = body.shot_type;
        }
      }
    } catch {
      /* ignore malformed body, fall back to source values */
    }

    const newId = nanoid();
    // Reuse the source's original_path directly; the file is shared between both jobs intentionally.
    createJob({ id: newId, original_path: source.original_path, preset, quality, shot_type });
    fireProcess(newId);

    const created = getJob(newId);
    if (!created) return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    return NextResponse.json({ job: jobToDTO(created) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reprocess failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
