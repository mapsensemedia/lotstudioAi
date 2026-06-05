'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BeforeAfter from '@/components/BeforeAfter';
import type { JobDTO } from '@/components/JobCard';

const PRESETS = [
  { value: 'studio_white', label: 'Studio White' },
  { value: 'studio_gray', label: 'Studio Gray' },
  { value: 'showroom', label: 'Showroom' },
  { value: 'outdoor', label: 'Outdoor Lot' },
  { value: 'ai_showroom', label: 'Luxury Showroom' },
  { value: 'ai_outdoor', label: 'Outdoor (Photoreal)' },
  { value: 'ai_luxury', label: 'Marble Luxury' },
];

const PRESET_LABELS: Record<string, string> = Object.fromEntries(
  PRESETS.map((p) => [p.value, p.label])
);

const statusStyles: Record<JobDTO['status'], string> = {
  queued: 'bg-slate-200 text-slate-700',
  processing: 'bg-indigo-100 text-indigo-700',
  done: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
};

function relTime(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.round(diff / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s} seconds ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [job, setJob] = useState<JobDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);
  const [selPreset, setSelPreset] = useState<string>('studio_white');

  const [audit, setAudit] = useState<Record<string, any> | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const presetInit = useRef(false);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Job not found.');
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const j: JobDTO = data.job ?? data;
      setJob(j);
      if (!presetInit.current && j?.preset) {
        setSelPreset(j.preset);
        presetInit.current = true;
      }
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load job.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchJob();
  }, [id, fetchJob]);

  useEffect(() => {
    const needs = job?.status === 'queued' || job?.status === 'processing';
    if (needs && !pollRef.current) {
      pollRef.current = setInterval(fetchJob, 2000);
    } else if (!needs && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current && !needs) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [job?.status, fetchJob]);

  useEffect(() => {
    if (!job?.audit_url) {
      setAudit(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(job.audit_url!, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setAudit(data);
          setAuditError(null);
        }
      } catch (e: any) {
        if (!cancelled) setAuditError(e.message ?? 'Could not load audit.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [job?.audit_url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  async function action(kind: 'approve' | 'reject') {
    if (!job) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/${kind}`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      await fetchJob();
    } catch {
      alert(`Couldn’t ${kind} this job — please try again in a moment.`);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!job) return;
    if (!window.confirm('Delete this job permanently?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      router.push('/dashboard');
    } catch {
      alert('Couldn’t delete this job — please try again in a moment.');
      setBusy(false);
    }
  }

  async function handleReprocess() {
    if (!job) return;
    setReprocessing(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/reprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: selPreset }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const newJob: JobDTO = data.job ?? data;
      if (newJob?.id && newJob.id !== job.id) {
        router.push(`/jobs/${newJob.id}`);
      } else {
        await fetchJob();
      }
    } catch (e: any) {
      alert(`Couldn’t re-process this job — ${e.message ?? 'please try again in a moment.'}`);
    } finally {
      setReprocessing(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading job…</div>;
  }
  if (error || !job) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-sm text-red-600">{error ?? 'Job not available.'}</div>
        <Link href="/dashboard" className="text-sm text-indigo-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const approved = job.approved === 1;
  const rejected = job.rejected === 1;
  const done = job.status === 'done';
  const presetLabel = PRESET_LABELS[job.preset] ?? job.preset;
  const outputReady = !!(job.original_url && job.output_url);

  return (
    <div className="pb-16">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 -mx-6 px-6 py-3 border-b border-slate-200 bg-white/95 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/dashboard"
            className="text-sm text-slate-600 hover:text-slate-900 whitespace-nowrap"
          >
            ← Back to dashboard
          </Link>
          <span className="font-mono text-xs text-slate-500 truncate">
            {job.id.slice(0, 8)}
          </span>
        </div>
        <button
          onClick={copyLink}
          className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Slider area */}
        <div className="lg:col-span-2">
          <div className="mx-auto max-w-5xl">
            {outputReady ? (
              <BeforeAfter beforeUrl={job.original_url!} afterUrl={job.output_url!} shotType={job.shot_type} />
            ) : job.original_url ? (
              <div className="space-y-3">
                <img
                  src={job.original_url}
                  alt="Original"
                  className="w-full rounded-md border border-slate-200"
                />
                {job.status === 'failed' ? (
                  <p className="text-sm text-red-600">
                    Processing failed. {job.error ?? 'Try re-processing below.'}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    Processing — refreshing every 2s.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
                No preview available yet.
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[job.status]}`}
              >
                {job.status}
              </span>
              {approved && (
                <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Approved
                </span>
              )}
              {rejected && (
                <span className="inline-block rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  Rejected
                </span>
              )}
            </div>

            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Background</dt>
                <dd className="text-slate-900 font-medium">{presetLabel}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Created</dt>
                <dd className="text-slate-900">{relTime(job.created_at)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Updated</dt>
                <dd className="text-slate-900">{relTime(job.updated_at)}</dd>
              </div>
              {typeof job.safety_score === 'number' && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Safety score</dt>
                  <dd className="text-slate-900">{job.safety_score.toFixed(2)}</dd>
                </div>
              )}
            </dl>

            {job.error && (
              <div className="text-xs text-red-600 break-words">{job.error}</div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
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
              <a
                href={`/api/jobs/${job.id}/download`}
                className={`rounded border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 text-center hover:bg-slate-50 ${
                  done ? '' : 'pointer-events-none opacity-40'
                }`}
              >
                Download
              </a>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="rounded border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Re-process */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Re-process</h3>
            <p className="text-xs text-slate-500">
              Generate a new version with a different studio background. Your vehicle
              pixels stay untouched.
            </p>
            <label className="block text-sm">
              <span className="block text-slate-600 mb-1">Background</span>
              <select
                value={selPreset}
                onChange={(e) => setSelPreset(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
              >
                {PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={handleReprocess}
              disabled={reprocessing}
              className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {reprocessing ? 'Submitting…' : 'Re-process with this background'}
            </button>
          </div>
        </aside>
      </div>

      {/* Processing summary */}
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
        {job.status === 'failed' ? (
          <p className="mt-2 text-sm text-red-600">
            Processing didn't finish. You can re-process this photo with the panel above.
          </p>
        ) : job.status !== 'done' ? (
          <p className="mt-2 text-sm text-slate-500">
            Your photo is still being prepared with the {presetLabel} background. We refresh
            every few seconds.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-700">
              Your photo's original background was replaced with the{' '}
              <span className="font-medium text-slate-900">{presetLabel}</span> background.
              The vehicle stays in place — only the surroundings change.
            </p>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-slate-500 sm:text-right">Background</dt>
              <dd className="text-slate-900">{presetLabel}</dd>
              {audit?.dimensions && typeof audit.dimensions === 'object' && (
                <>
                  <dt className="text-slate-500 sm:text-right">Image size</dt>
                  <dd className="text-slate-900">
                    {audit.dimensions.width}×{audit.dimensions.height}px
                  </dd>
                </>
              )}
              <dt className="text-slate-500 sm:text-right">Processed</dt>
              <dd className="text-slate-900">{relTime(job.updated_at)}</dd>
              {job.approved === 1 && (
                <>
                  <dt className="text-slate-500 sm:text-right">Status</dt>
                  <dd className="text-emerald-700 font-medium">Approved for export</dd>
                </>
              )}
              {job.rejected === 1 && (
                <>
                  <dt className="text-slate-500 sm:text-right">Status</dt>
                  <dd className="text-red-700 font-medium">Rejected</dd>
                </>
              )}
            </dl>
          </>
        )}
        {auditError && (
          <p className="mt-3 text-xs text-slate-400">
            Some processing details couldn't be loaded.
          </p>
        )}
      </section>
    </div>
  );
}
