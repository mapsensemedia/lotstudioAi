import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getJob } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const job = getJob(params.id);
    if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!job.output_path || !fs.existsSync(job.output_path)) {
      return NextResponse.json({ error: 'Output not ready' }, { status: 404 });
    }
    const buf = fs.readFileSync(job.output_path);
    const base = path.basename(job.output_path);
    const ext = path.extname(base).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${base}"`,
        'Content-Length': String(buf.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
