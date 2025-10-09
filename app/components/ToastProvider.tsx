'use client';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type Toast = { id: number; kind: 'success' | 'error' | 'info'; title: string; detail?: string; timeout?: number };
type Ctx = { showToast: (t: Omit<Toast, 'id'>) => void };

const ToastCtx = createContext<Ctx | null>(null);
export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    const toast: Toast = { id, timeout: 3500, ...t };
    setToasts((prev) => [toast, ...prev].slice(0, 5));
    const ms = toast.timeout ?? 3500;
    window.setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), ms);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed z-[1000] top-3 right-3 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'rounded-xl shadow px-3 py-2 text-sm max-w-sm border bg-white',
              t.kind === 'success' ? 'border-green-200' : t.kind === 'error' ? 'border-red-200' : 'border-gray-200',
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            <div className="font-medium">
              {t.kind === 'success' ? '✅ ' : t.kind === 'error' ? '⚠️ ' : 'ℹ️ '}
              {t.title}
            </div>
            {t.detail && <div className="text-xs text-gray-600 mt-1 break-words">{t.detail}</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

