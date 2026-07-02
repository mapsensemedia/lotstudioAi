import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = process.env.DATABASE_URL || './storage/lotstudio.db';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __lotstudio_db: Database.Database | undefined;
}

export const db = global.__lotstudio_db ?? new Database(dbPath);
if (!global.__lotstudio_db) {
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      original_path TEXT NOT NULL,
      mask_path TEXT,
      output_path TEXT,
      thumb_path TEXT,
      audit_path TEXT,
      preset TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      safety_score REAL,
      approved INTEGER NOT NULL DEFAULT 0,
      rejected INTEGER NOT NULL DEFAULT 0,
      quality TEXT NOT NULL DEFAULT 'medium',
      shot_type TEXT NOT NULL DEFAULT 'exterior',
      error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  // Migration: ensure `rejected` exists on databases created before it was added.
  try {
    const cols = db.prepare("PRAGMA table_info(jobs)").all() as { name: string }[];
    if (!cols.some((c) => c.name === 'rejected')) {
      db.exec("ALTER TABLE jobs ADD COLUMN rejected INTEGER NOT NULL DEFAULT 0");
    }
    if (!cols.some((c) => c.name === 'quality')) {
      db.exec("ALTER TABLE jobs ADD COLUMN quality TEXT NOT NULL DEFAULT 'medium'");
    }
    if (!cols.some((c) => c.name === 'shot_type')) {
      db.exec("ALTER TABLE jobs ADD COLUMN shot_type TEXT NOT NULL DEFAULT 'exterior'");
    }
  } catch {
    // ignore
  }
  global.__lotstudio_db = db;
}

export type Job = {
  id: string;
  original_path: string;
  mask_path: string | null;
  output_path: string | null;
  thumb_path: string | null;
  audit_path: string | null;
  preset: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  safety_score: number | null;
  approved: number;
  rejected: number;
  quality: 'low' | 'medium' | 'high';
  shot_type: 'exterior' | 'interior' | 'detail' | 'interior_white';
  error: string | null;
  created_at: number;
  updated_at: number;
};

export function createJob(j: Omit<Job, 'created_at' | 'updated_at' | 'status' | 'approved' | 'rejected' | 'mask_path' | 'output_path' | 'thumb_path' | 'audit_path' | 'safety_score' | 'error'>) {
  const now = Date.now();
  db.prepare(
    `INSERT INTO jobs (id, original_path, preset, quality, shot_type, status, approved, rejected, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'queued', 0, 0, ?, ?)`
  ).run(j.id, j.original_path, j.preset, j.quality, j.shot_type, now, now);
}

export function deleteJob(id: string): Job | undefined {
  const job = getJob(id);
  if (!job) return undefined;
  db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
  return job;
}

export function updateJob(id: string, patch: Partial<Job>) {
  const keys = Object.keys(patch);
  if (!keys.length) return;
  const sets = keys.map((k) => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE jobs SET ${sets}, updated_at = @updated_at WHERE id = @id`).run({
    ...patch,
    id,
    updated_at: Date.now(),
  });
}

export function getJob(id: string): Job | undefined {
  return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Job | undefined;
}

export function listJobs(): Job[] {
  return db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all() as Job[];
}

export function countByOriginalPath(p: string): number {
  const row = db.prepare('SELECT COUNT(*) as c FROM jobs WHERE original_path = ?').get(p) as { c: number };
  return row?.c ?? 0;
}

export function listApproved(): Job[] {
  return db.prepare("SELECT * FROM jobs WHERE approved = 1 AND status = 'done'").all() as Job[];
}
