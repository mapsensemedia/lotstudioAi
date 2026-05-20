'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MaskEditor from '@/components/MaskEditor';
import { useToast } from '@/components/Toast';

export default function ErasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(list: FileList | null) {
    if (!list || list.length === 0) return;
    const f = list[0];
    if (!f.type.startsWith('image/')) {
      toast({ kind: 'error', title: 'Unsupported file', description: 'Please choose an image.' });
      return;
    }
    setFile(f);
  }

  async function handleSubmit(maskBlob: Blob) {
    if (!file) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('mask', maskBlob, 'mask.png');
      const res = await fetch('/api/erase', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { job: { id: string } };
      router.push(`/jobs/${data.job.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erase failed';
      toast({ kind: 'error', title: 'Could not start erase', description: message });
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Magic Eraser</h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Brush over distractions like dealer cards, glare, reflections, or stray paperwork. The
          unbrushed pixels of your photo are preserved exactly — gear lever, cluster, dashboard,
          and badges stay identical.
        </p>
      </header>

      {!file && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Upload a photo</h2>
          <p className="text-sm text-slate-500 mt-1">
            JPG or PNG. One image at a time.
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
              pickFile(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`mt-4 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <p className="text-sm font-medium text-slate-700">
              Drag and drop an image, or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Only the brushed area is repainted. Everything else is byte-identical.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </section>
      )}

      {file && previewUrl && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <MaskEditor
            src={previewUrl}
            onSubmit={handleSubmit}
            onCancel={() => setFile(null)}
            submitting={submitting}
          />
        </section>
      )}
    </div>
  );
}
