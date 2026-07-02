'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JobCard, { type JobDTO } from '@/components/JobCard';
import { useToast } from '@/components/Toast';

const PRESETS = [
  { value: 'studio_white', label: 'Studio White' },
  { value: 'studio_gray', label: 'Studio Gray' },
  { value: 'showroom', label: 'Showroom' },
  { value: 'outdoor', label: 'Outdoor Lot' },
  { value: 'ai_showroom', label: 'Luxury Showroom' },
  { value: 'ai_outdoor', label: 'Outdoor (Photoreal)' },
  { value: 'ai_luxury', label: 'Marble Luxury' },
];

type Filter = 'all' | 'approved' | 'rejected' | 'failed';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'failed', label: 'Failed' },
];

const EMPTY_COPY: Record<Filter, string> = {
  all: 'No jobs yet. Upload some photos above to get started.',
  approved: 'No approved jobs yet.',
  rejected: 'No rejected jobs yet.',
  failed: 'No failed jobs — nice.',
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [preset, setPreset] = useState(PRESETS[0].value);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [shotType, setShotType] = useState<'exterior' | 'interior' | 'detail' | 'interior_white'>('exterior');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [jobs, setJobs] = useState<JobDTO[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/jobs', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: JobDTO[] = Array.isArray(data) ? data : data.jobs ?? [];
      setJobs(list);
      setJobsError(null);
    } catch (e: any) {
      setJobsError(e.message ?? 'Could not load jobs — check your connection and click Refresh.');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const needsPoll = jobs.some((j) => j.status === 'queued' || j.status === 'processing');
    if (needsPoll && !pollRef.current) {
      pollRef.current = setInterval(fetchJobs, 2000);
    } else if (!needsPoll && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current && !needsPoll) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [jobs, fetchJobs]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (incoming.length === 0) return;
    setFiles((prev) => [...prev, ...incoming]);
  }

  // Object URLs for instant thumbnail previews; revoked on unmount or removal.
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleUpload() {
    if (files.length === 0) return;
    const count = files.length;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('preset', preset);
      fd.append('quality', quality);
      fd.append('shot_type', shotType);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchJobs();
      toast({
        kind: 'success',
        title: 'Upload received',
        description: `${count} ${count === 1 ? 'job' : 'jobs'} queued for processing.`,
      });
    } catch (e: any) {
      const description = e.message
        ? `Upload failed — ${e.message}`
        : 'Upload failed — check that each file is a JPG or PNG under 25MB and try again.';
      setUploadError(description);
      toast({ kind: 'error', title: 'Upload failed', description });
    } finally {
      setUploading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/export', { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lotstudio-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        kind: 'success',
        title: 'Export ready',
        description: 'ZIP downloaded to your device.',
      });
    } catch (e: any) {
      toast({
        kind: 'error',
        title: 'Export failed',
        description: `${e.message ?? e}. Try again in a moment, or refresh the page.`,
      });
    } finally {
      setExporting(false);
    }
  }

  const stats = useMemo(() => {
    const total = jobs.length;
    const processing = jobs.filter(
      (j) => j.status === 'queued' || j.status === 'processing'
    ).length;
    const approved = jobs.filter((j) => j.approved === 1).length;
    const rejected = jobs.filter((j) => j.rejected === 1).length;
    return { total, processing, approved, rejected };
  }, [jobs]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'approved':
        return jobs.filter((j) => j.approved === 1);
      case 'rejected':
        return jobs.filter((j) => j.rejected === 1);
      case 'failed':
        return jobs.filter((j) => j.status === 'failed');
      default:
        return jobs;
    }
  }, [jobs, filter]);

  return (
    <div className="space-y-6 pb-24">
      {/* Stats strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Processing', value: stats.processing },
          { label: 'Approved', value: stats.approved },
          { label: 'Rejected', value: stats.rejected },
        ].map((tile) => (
          <div
            key={tile.label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-semibold text-slate-900">{tile.value}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mt-1">
              {tile.label}
            </div>
          </div>
        ))}
      </section>

      {/* Upload panel */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Upload inventory photos</h2>
        <p className="text-sm text-slate-500 mt-1">
          Replace the background — your vehicle pixels stay untouched. JPG or PNG, up to 25MB
          per file.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <div className="mx-auto h-10 w-10 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 16l-4-4-4 4" />
              <path d="M12 12v9" />
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              <path d="M16 16l-4-4-4 4" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            Drag and drop images here, or click to browse
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Showroom-ready backgrounds applied automatically.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {files.map((f, i) => (
              <div
                key={`${f.name}-${i}`}
                className="group relative rounded-md overflow-hidden border border-slate-200 bg-slate-100 aspect-[4/3]"
              >
                <img
                  src={previews[i]}
                  alt={f.name}
                  className="h-full w-full object-cover"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  disabled={uploading}
                  aria-label="Remove file"
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-slate-900/70 text-white text-xs leading-none opacity-0 group-hover:opacity-100 transition disabled:opacity-0"
                >
                  ×
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
                  <p className="truncate text-[11px] text-white">{f.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <div className="text-sm text-slate-600 mb-2">
            Photo type — applied to every photo in this upload
          </div>
          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-1 text-sm">
            {([
              { v: 'exterior', label: 'Exterior', sub: 'Replace background' },
              { v: 'interior', label: 'Interior', sub: 'Clean distractions only' },
              { v: 'interior_white', label: 'Interior — white bg', sub: 'White through the glass' },
              { v: 'detail', label: 'Detail', sub: 'Clean distractions only' },
            ] as const).map((opt) => {
              const active = shotType === opt.v;
              return (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setShotType(opt.v)}
                  className={`rounded-md px-4 py-2 text-left transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className={`text-[11px] ${active ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
          {shotType === 'interior_white' && (
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
              Interior — white background — the cabin is left intact; only what is visible outside through the windows and windshield is replaced with a clean white background.
            </p>
          )}
          {(shotType === 'interior' || shotType === 'detail') && (
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
              {shotType === 'interior' ? 'Interior mode' : 'Detail mode'} — the vehicle and surroundings will be left intact; only distractions are cleaned up. No background is replaced.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          {shotType === 'exterior' && (
            <label className="text-sm">
              <span className="block text-slate-600 mb-1">Studio background</span>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 bg-white"
              >
                {PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {uploading ? 'Uploading…' : `Upload ${files.length || ''}`.trim()}
          </button>
          {uploadError && <span className="text-sm text-red-600">{uploadError}</span>}
        </div>
      </section>

      {/* Filter tabs */}
      <section>
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex gap-1">
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition ${
                    active
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={fetchJobs}
            className="text-xs text-slate-500 hover:text-slate-900 pb-2"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4">
          {jobsLoading ? (
            <div className="text-sm text-slate-500">Loading jobs…</div>
          ) : jobsError ? (
            <div className="text-sm text-red-600">Couldn’t load jobs: {jobsError}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              {EMPTY_COPY[filter]}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((job) => (
                <JobCard key={job.id} job={job} onChange={fetchJobs} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sticky export bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur shadow-[0_-4px_12px_-4px_rgba(15,23,42,0.08)]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{stats.approved}</span> approved
            {jobs.length > 0 && (
              <span className="text-slate-500"> of {jobs.length}</span>
            )}
            <span className="text-slate-400"> · ready to export</span>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || stats.approved === 0}
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 shadow-sm"
          >
            {exporting ? 'Preparing ZIP…' : 'Export approved as ZIP'}
          </button>
        </div>
      </div>
    </div>
  );
}
