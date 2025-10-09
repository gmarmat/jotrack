'use client';
import { useEffect, useMemo, useState } from 'react';

type Health = { ok: boolean; jobs: number; attachments: number; env: string; now: number };

export default function HealthChip() {
  const [h, setH] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isProd = useMemo(() => h?.env?.toLowerCase?.() === 'production', [h?.env]);

  async function load(signal?: AbortSignal) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/health', { cache: 'no-store', signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Health;
      setH(json);
    } catch (e: any) {
      if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load health');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    const id = window.setInterval(() => load(ctrl.signal), 30_000); // 30s
    return () => {
      ctrl.abort();
      window.clearInterval(id);
    };
  }, []);

  return (
    <div className="ml-auto flex items-center gap-1 text-[11px] leading-4">
      <div
        className={[
          'rounded-full border px-2 py-0.5 bg-white',
          h?.ok ? 'border-green-200' : 'border-red-200',
        ].join(' ')}
        aria-live="polite"
        title={h?.ok ? 'Healthy' : 'Unhealthy'}
      >
        {h?.ok ? '🟢' : '🔴'} Health
        {h && (
          <span className="ml-1 text-gray-600">
            jobs: <span className="font-medium">{h.jobs}</span> • att:{' '}
            <span className="font-medium">{h.attachments}</span>
            {!isProd && h.env ? (
              <span className="ml-1 text-gray-500">• {h.env}</span>
            ) : null}
          </span>
        )}
        {err && <span className="ml-1 text-red-600">error</span>}
      </div>
      <button
        onClick={() => load()}
        className="rounded-md border px-2 py-0.5 hover:bg-gray-50 disabled:opacity-50"
        disabled={loading}
        aria-label="Refresh health"
      >
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}

