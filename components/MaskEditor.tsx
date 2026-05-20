'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  onSubmit: (maskPngBlob: Blob) => void;
  onCancel: () => void;
  submitting?: boolean;
};

type Mode = 'brush' | 'eraser';

export default function MaskEditor({ src, onSubmit, onCancel, submitting }: Props) {
  const imgCanvasRef = useRef<HTMLCanvasElement>(null);
  const brushCanvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [radius, setRadius] = useState(40);
  const [mode, setMode] = useState<Mode>('brush');

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const imgCanvas = imgCanvasRef.current;
      const brushCanvas = brushCanvasRef.current;
      if (!imgCanvas || !brushCanvas) return;
      imgCanvas.width = w;
      imgCanvas.height = h;
      brushCanvas.width = w;
      brushCanvas.height = h;
      const ctx = imgCanvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0, w, h);
      setDims({ w, h });
      setLoaded(true);
    };
    img.src = src;
  }, [src]);

  function pointerToCanvas(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = brushCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function paintAt(x: number, y: number, from?: { x: number; y: number } | null) {
    const canvas = brushCanvasRef.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = mode === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fillStyle = 'rgba(255, 0, 0, 0.45)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.45)';
    ctx.lineWidth = radius * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (from) {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as Element).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const p = pointerToCanvas(e);
    paintAt(p.x, p.y, null);
    lastPtRef.current = p;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const p = pointerToCanvas(e);
    paintAt(p.x, p.y, lastPtRef.current);
    lastPtRef.current = p;
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    drawingRef.current = false;
    lastPtRef.current = null;
  }

  function clearMask() {
    const canvas = brushCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }

  function handleSubmit() {
    const brush = brushCanvasRef.current;
    if (!brush) return;
    const { w, h } = dims;
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const outCtx = out.getContext('2d');
    if (!outCtx) return;

    outCtx.fillStyle = 'rgb(255,255,255)';
    outCtx.fillRect(0, 0, w, h);
    const baseData = outCtx.getImageData(0, 0, w, h);

    const brushCtx = brush.getContext('2d');
    if (!brushCtx) return;
    const brushData = brushCtx.getImageData(0, 0, w, h);

    for (let i = 0; i < brushData.data.length; i += 4) {
      if (brushData.data[i + 3] > 0) {
        baseData.data[i + 3] = 0;
      }
    }
    outCtx.putImageData(baseData, 0, 0);
    out.toBlob((blob) => {
      if (blob) onSubmit(blob);
    }, 'image/png');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('brush')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === 'brush'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Brush
          </button>
          <button
            type="button"
            onClick={() => setMode('eraser')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              mode === 'eraser'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Eraser
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">Size</label>
          <input
            type="range"
            min={10}
            max={120}
            step={1}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value, 10))}
            className="w-40"
          />
          <span className="text-xs text-slate-500 w-8 tabular-nums">{radius}</span>
        </div>
        <button
          type="button"
          onClick={clearMask}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Clear
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!loaded || submitting}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Working...' : 'Erase selected areas'}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Brush over anything to remove (dealer cards, reflections, glare). Everything else stays
        exactly as photographed.
      </p>

      <div
        ref={wrapRef}
        className="relative mx-auto max-w-3xl rounded-md overflow-hidden border border-slate-200 bg-slate-50"
        style={{ touchAction: 'none' }}
      >
        <canvas ref={imgCanvasRef} className="block w-full h-auto" />
        <canvas
          ref={brushCanvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  );
}
