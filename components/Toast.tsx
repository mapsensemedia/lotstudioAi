'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type ToastKind = 'success' | 'error' | 'info';

type ToastInput = {
  kind?: ToastKind;
  title: string;
  description?: string;
  duration?: number;
};

type ToastItem = Required<Pick<ToastInput, 'title'>> & {
  id: number;
  kind: ToastKind;
  description?: string;
  duration: number;
};

type ToastContextValue = {
  toast: (opts: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe no-op fallback so calls don't crash if provider isn't mounted.
    return { toast: () => {} };
  }
  return ctx;
}

const borderByKind: Record<ToastKind, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  info: 'border-l-slate-400',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: ToastInput) => {
    const id = ++idRef.current;
    const item: ToastItem = {
      id,
      kind: opts.kind ?? 'info',
      title: opts.title,
      description: opts.description,
      duration: opts.duration ?? 4000,
    };
    setItems((prev) => [...prev, item]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed z-50 flex flex-col gap-2 top-4 left-1/2 -translate-x-1/2 sm:top-auto sm:left-auto sm:translate-x-0 sm:bottom-4 sm:right-4 w-[min(92vw,22rem)]"
        aria-live="polite"
        aria-atomic="true"
      >
        {items.map((t) => (
          <ToastView key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const timer = setTimeout(onClose, item.duration);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [item.duration, onClose]);

  return (
    <div
      role="status"
      className={`pointer-events-auto rounded-md bg-white shadow-lg ring-1 ring-slate-200 border-l-4 ${
        borderByKind[item.kind]
      } px-4 py-3 transition duration-200 ease-out ${
        shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900">{item.title}</div>
          {item.description && (
            <div className="mt-0.5 text-xs text-slate-600">{item.description}</div>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Dismiss notification"
          className="text-slate-400 hover:text-slate-700 text-lg leading-none -mt-0.5"
        >
          ×
        </button>
      </div>
    </div>
  );
}
