import path from 'node:path';
import type { Job } from './db';

export type JobDTO = {
  id: string;
  preset: string;
  status: Job['status'];
  safety_score: number | null;
  approved: number;
  rejected: number;
  quality: 'low' | 'medium' | 'high';
  shot_type: 'exterior' | 'interior' | 'detail' | 'interior_white';
  error: string | null;
  created_at: number;
  updated_at: number;
  original_url: string | null;
  mask_url: string | null;
  output_url: string | null;
  thumb_url: string | null;
  audit_url: string | null;
};

function toUrl(kind: string, p: string | null): string | null {
  if (!p) return null;
  return `/api/files/${kind}/${path.basename(p)}`;
}

export function jobToDTO(j: Job): JobDTO {
  return {
    id: j.id,
    preset: j.preset,
    status: j.status,
    safety_score: j.safety_score,
    approved: j.approved,
    rejected: j.rejected,
    quality: j.quality,
    shot_type: j.shot_type,
    error: j.error,
    created_at: j.created_at,
    updated_at: j.updated_at,
    original_url: toUrl('originals', j.original_path),
    mask_url: toUrl('masks', j.mask_path),
    output_url: toUrl('outputs', j.output_path),
    thumb_url: toUrl('thumbs', j.thumb_path),
    audit_url: toUrl('audits', j.audit_path),
  };
}
