import { NextResponse } from 'next/server';
import { getJob, updateJob } from '@/lib/db';
import { jobToDTO } from '@/lib/urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const job = getJob(params.id);
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    updateJob(params.id, { approved: 1, rejected: 0 });
    const updated = getJob(params.id)!;
    return NextResponse.json({ job: jobToDTO(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
