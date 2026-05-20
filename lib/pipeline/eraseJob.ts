import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getJob, updateJob } from '@/lib/db';
import { inpaintWithMaskOpenAI } from './openai';

const PIPELINE_VERSION = '0.6.0-eraser';
const STORAGE = './storage';

async function ensureDirs() {
  for (const d of ['outputs', 'thumbs', 'audits']) {
    await fs.mkdir(path.join(STORAGE, d), { recursive: true });
  }
}

export async function eraseJob(jobId: string): Promise<void> {
  try {
    const job = getJob(jobId);
    if (!job) throw new Error(`job not found: ${jobId}`);
    if (!job.mask_path) throw new Error(`job missing mask: ${jobId}`);
    updateJob(jobId, { status: 'processing', error: null });
    await ensureDirs();

    const timings: Record<string, number> = {};
    const t0 = Date.now();

    const origBuf = await fs.readFile(job.original_path);
    const maskBuf = await fs.readFile(job.mask_path);
    const meta = await sharp(origBuf).metadata();
    const width = meta.width!;
    const height = meta.height!;
    timings.load = Date.now() - t0;

    const t1 = Date.now();
    const outBuf = await inpaintWithMaskOpenAI(origBuf, maskBuf, width, height, job.quality);
    timings.openai = Date.now() - t1;

    const t2 = Date.now();
    const outputPath = path.join(STORAGE, 'outputs', `${jobId}.png`);
    await fs.writeFile(outputPath, outBuf);
    const thumbPath = path.join(STORAGE, 'thumbs', `${jobId}.png`);
    await sharp(outBuf).resize({ width: 512, height: 512, fit: 'inside' }).png().toFile(thumbPath);
    timings.write = Date.now() - t2;
    timings.total = Date.now() - t0;

    const audit = {
      jobId,
      dimensions: { width, height },
      pipeline_version: PIPELINE_VERSION,
      timings,
      createdAt: new Date().toISOString(),
      mode: 'eraser',
    };
    const auditPath = path.join(STORAGE, 'audits', `${jobId}.json`);
    await fs.writeFile(auditPath, JSON.stringify(audit, null, 2));

    updateJob(jobId, {
      status: 'done',
      output_path: outputPath,
      thumb_path: thumbPath,
      audit_path: auditPath,
      safety_score: null,
      error: null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    try {
      updateJob(jobId, { status: 'failed', error: msg });
    } catch {
      // ignore
    }
  }
}
