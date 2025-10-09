'use client';
import { useEffect, useState } from 'react';

type Health = { ok: boolean; jobs: number; attachments: number; env: string; now: number };

export default function HealthChip() {
  const [h, setH] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as Health;
      setH(json);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load health');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="ml-auto flex items-center gap-2 text-xs">
      <div
        className={[
          'rounded-full border px-2 py-1 bg-white',
          h?.ok ? 'border-green-200' : 'border-red-200',
        ].join(' ')}
        aria-live="polite"
        title={h?.ok ? 'Healthy' : 'Unhealthy'}
      >
        {h?.ok ? '🟢' : '🔴'} Health
        {h && (
          <span className="ml-2 text-gray-600">
            jobs: <span className="font-medium">{h.jobs}</span> • att: <span className="font-medium">{h.attachments}</span> • {h.env}
          </span>
        )}
        {err && <span className="ml-2 text-red-600">error</span>}
      </div>
      <button
        onClick={load}
        className="rounded-md border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
        disabled={loading}
        aria-label="Refresh health"
      >
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}

