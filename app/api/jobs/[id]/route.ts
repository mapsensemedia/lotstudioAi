import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import { getJob, deleteJob, countByOriginalPath } from '@/lib/db';
import { jobToDTO } from '@/lib/urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const job = getJob(params.id);
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ job: jobToDTO(job) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const job = deleteJob(params.id);
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Skip unlinking original_path if any other job still references it (reprocess shares originals).
    const originalStillReferenced = job.original_path ? countByOriginalPath(job.original_path) > 0 : false;
    const toUnlink = [
      originalStillReferenced ? null : job.original_path,
      job.mask_path,
      job.output_path,
      job.thumb_path,
      job.audit_path,
    ];
    for (const p of toUnlink) {
      if (!p) continue;
      try { await fs.unlink(p); } catch { /* ignore */ }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
