'use client';

import { useRef, useState } from 'react';

const AFTER_LABEL: Record<'exterior' | 'interior' | 'detail' | 'interior_white', string> = {
  exterior: 'Studio background',
  interior: 'Interior cleanup',
  detail: 'Detail cleanup',
  interior_white: 'Interior · white background',
};

export default function BeforeAfter({
  beforeUrl,
  afterUrl,
  shotType = 'exterior',
}: {
  beforeUrl: string;
  afterUrl: string;
  shotType?: 'exterior' | 'interior' | 'detail' | 'interior_white';
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function updateFromClientX(clientX: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  }

  return (
    <div
      ref={ref}
      className="relative w-full select-none overflow-hidden rounded-md border border-slate-200 bg-slate-100"
      style={{ aspectRatio: '4 / 3' }}
      onMouseDown={(e) => {
        dragging.current = true;
        updateFromClientX(e.clientX);
      }}
      onMouseMove={(e) => dragging.current && updateFromClientX(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchStart={(e) => updateFromClientX(e.touches[0].clientX)}
      onTouchMove={(e) => updateFromClientX(e.touches[0].clientX)}
    >
      {/* after (full) */}
      <img
        src={afterUrl}
        alt="With studio background"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      {/* before clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={beforeUrl}
          alt="Original"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ width: `${(100 / pos) * 100}%`, maxWidth: 'none' }}
          draggable={false}
        />
      </div>
      {/* divider */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white border border-slate-300 shadow flex items-center justify-center text-slate-600 text-xs cursor-ew-resize">
          ↔
        </div>
      </div>
      <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        Original
      </div>
      <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {AFTER_LABEL[shotType]}
      </div>
    </div>
  );
}
