import { NextResponse } from 'next/server';
import archiver from 'archiver';
import { PassThrough } from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';
import { listApproved } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function POST() {
  try {
    const approved = listApproved();

    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = new PassThrough();
    archive.pipe(stream);

    archive.on('warning', (err) => {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    });

    const header = [
      'id',
      'preset',
      'safety_score',
      'approved_at',
      'original_filename',
      'output_filename',
    ].join(',');
    const rows = [header];

    for (const job of approved) {
      const originalName = job.original_path ? path.basename(job.original_path) : '';
      const outputName = job.output_path ? path.basename(job.output_path) : '';
      if (job.output_path && fs.existsSync(job.output_path)) {
        archive.file(job.output_path, { name: `outputs/${outputName}` });
      }
      rows.push(
        [
          csvEscape(job.id),
          csvEscape(job.preset),
          csvEscape(job.safety_score ?? ''),
          csvEscape(job.updated_at),
          csvEscape(originalName),
          csvEscape(outputName),
        ].join(',')
      );
    }

    archive.append(rows.join('\n') + '\n', { name: 'audit_report.csv' });
    archive.finalize();

    const filename = `lotstudio-export-${Date.now()}.zip`;
    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
