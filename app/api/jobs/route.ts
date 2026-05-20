import { NextResponse } from 'next/server';
import { listJobs } from '@/lib/db';
import { jobToDTO } from '@/lib/urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jobs = listJobs().map(jobToDTO);
    return NextResponse.json({ jobs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to list jobs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
