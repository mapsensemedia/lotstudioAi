'use client';

import { useState } from 'react';
import Link from 'next/link';
import Modal from './Modal';
import BeforeAfter from './BeforeAfter';
import { useToast } from './Toast';

export type JobDTO = {
  id: string;
  preset: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  safety_score: number | null;
  approved: number;
  rejected: number;
  error: string | null;
  created_at: number;
  updated_at: number;
  shot_type?: 'exterior' | 'interior' | 'detail' | 'interior_white';
  original_url: string | null;
  mask_url: string | null;
  output_url: string | null;
  thumb_url: string | null;
  audit_url: string | null;
};

const statusStyles: Record<JobDTO['status'], string> = {
  queued: 'bg-slate-200 text-slate-700',
  processing: 'bg-indigo-100 text-indigo-700',
  done: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

const PRESET_LABELS: Record<string, string> = {
  studio_white: 'Studio White',
  studio_gray: 'Studio Gray',
  showroom: 'Showroom',
  outdoor: 'Outdoor Lot',
  ai_showroom: 'Luxury Showroom',
  ai_outdoor: 'Outdoor (Photoreal)',
  ai_luxury: 'Marble Luxury',
};

export default function JobCard({
  job,
  onChange,
}: {
  job: JobDTO;
  onChange: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const done = job.status === 'done';
  const approved = job.approved === 1;
  const rejected = job.rejected === 1;
  const presetLabel = PRESET_LABELS[job.preset] ?? job.preset;

  async function action(kind: 'approve' | 'reject') {
    if (kind === 'approve' && approved) return;
    if (kind === 'reject' && rejected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/${kind}`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      onChange();
    } catch {
      toast({
        kind: 'error',
        title: kind === 'approve' ? 'Approve failed' : 'Reject failed',
        description: `Couldn’t ${kind} this job — please try again in a moment.`,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this job permanently?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      onChange();
    } catch {
      toast({
        kind: 'error',
        title: 'Delete failed',
        description: 'Couldn’t delete this job — please try again in a moment.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`relative rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col shadow-sm transition ${
        rejected ? 'opacity-60' : ''
      }`}
    >
      <button
        onClick={handleDelete}
        disabled={busy}
        aria-label="Delete job"
        className="absolute top-2 right-2 z-10 rounded-md bg-white/90 ring-1 ring-slate-200 p-1.5 text-slate-500 hover:text-red-600 hover:bg-white shadow-sm disabled:opacity-40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>

      <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
        {job.thumb_url ? (
          <img
            src={job.thumb_url}
            alt={`Job ${job.id}`}
            className="h-full w-full object-cover"
          />
        ) : job.original_url ? (
          <img
            src={job.original_url}
            alt={`Job ${job.id}`}
            className={`h-full w-full object-cover ${job.status === 'done' ? '' : 'opacity-70'}`}
          />
        ) : (
          <div className="text-slate-400 text-sm">No preview</div>
        )}
        {(job.status === 'queued' || job.status === 'processing') && (
          <>
            {/* shimmer sweep */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
            {/* center overlay */}
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
              <span className="h-9 w-9 rounded-full border-[3px] border-white/80 border-t-transparent animate-spin" />
              <span className="text-xs font-medium text-white uppercase tracking-wide">
                {job.status === 'queued' ? 'Queued' : 'Processing'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[job.status]}`}
          >
            {job.status}
          </span>
          {rejected ? (
            <span className="inline-block rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
              Rejected
            </span>
          ) : (
            <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
              {presetLabel}
            </span>
          )}
        </div>

        {job.error && (
          <div className="text-xs text-red-600 line-clamp-2">{job.error}</div>
        )}

        <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
          <div className="flex items-stretch gap-1">
            <button
              onClick={() => setOpen(true)}
              disabled={!job.original_url}
              className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              View
            </button>
            <Link
              href={`/jobs/${job.id}`}
              aria-label="Open job detail page"
              title="Open detail page"
              className="rounded border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
          <a
            href={`/api/jobs/${job.id}/download`}
            className={`rounded border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 text-center hover:bg-slate-50 ${done ? '' : 'pointer-events-none opacity-40'}`}
          >
            Download
          </a>
          <button
            onClick={() => action('approve')}
            disabled={!done || busy}
            className={`rounded px-2 py-1.5 text-xs font-medium disabled:opacity-40 ${
              approved
                ? 'border-2 border-emerald-600 text-emerald-700 bg-emerald-50'
                : 'border border-emerald-600 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {approved ? 'Approved' : 'Approve'}
          </button>
          <button
            onClick={() => action('reject')}
            disabled={!done || busy}
            className={`rounded px-2 py-1.5 text-xs font-medium disabled:opacity-40 ${
              rejected
                ? 'border-2 border-red-600 text-red-700 bg-red-50'
                : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {rejected ? 'Rejected' : 'Reject'}
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`Job ${job.id.slice(0, 8)}`}>
        {job.original_url && job.output_url ? (
          <BeforeAfter beforeUrl={job.original_url} afterUrl={job.output_url} shotType={job.shot_type} />
        ) : job.original_url ? (
          <div className="space-y-2">
            <img src={job.original_url} alt="Original" className="w-full rounded" />
            <p className="text-sm text-slate-500">
              Still working — the new studio background will appear here when processing completes.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No preview available.</p>
        )}
      </Modal>
    </div>
  );
}
