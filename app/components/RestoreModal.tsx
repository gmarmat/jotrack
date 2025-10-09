'use client';
import { useRef, useState } from 'react';
import { useToast } from './ToastProvider';

type PlanSummary = {
  stagingId: string;
  zipSavedPath: string;
  stagingPath: string;
  dbFiles: { src: string; dest: string }[];
  attachments: { srcDir: string; destDir: string } | null;
  next?: string;
};

type DedupSummary = {
  stagingId: string;
  current: { count: number; groups: { fp: string; count: number; ids: string[] }[] };
  staged: { count: number; groups: { fp: string; count: number; ids: string[] }[] };
  overlap: { count: number; matches: { fp: string; currentIds: string[]; stagedIds: string[] }[] };
};

type ApplySummary = {
  stagingId: string;
  strategy: 'skip-duplicates'|'import-all';
  attachmentsMode: 'merge'|'replace';
  attempted: number;
  inserted: number;
  skippedDuplicates: number;
  autosavePath: string;
  autosaveSize: number;
  attachmentsCopied: boolean;
  dataDir: string;
};

export default function RestoreModal({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [dedup, setDedup] = useState<DedupSummary | null>(null);
  const [dedupError, setDedupError] = useState<string | null>(null);
  const [dedupLoading, setDedupLoading] = useState(false);
  const [applyBusy, setApplyBusy] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySummary, setApplySummary] = useState<ApplySummary | null>(null);
  const [strategy, setStrategy] = useState<'skip-duplicates'|'import-all'>('skip-duplicates');
  const [attachmentsMode, setAttachmentsMode] = useState<'merge'|'replace'>('merge');
  const { showToast } = useToast();

  async function onUpload(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setError(null);
    setPlan(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/restore', { method: 'POST', body: fd });
      if (!res.ok) {
        throw new Error((await res.json().catch(() => null))?.error || `Restore stage failed: ${res.status}`);
      }
      const json = (await res.json()) as PlanSummary;
      setPlan(json);
      if (inputRef.current) inputRef.current.value = '';
      showToast({ kind: 'success', title: 'Restore staged', detail: `Staging ID: ${json.stagingId}` });
      
      // Fetch dedup summary
      setDedup(null);
      setDedupError(null);
      setDedupLoading(true);
      try {
        const ds = await fetch(`/api/restore/dedup?stagingId=${encodeURIComponent(json.stagingId)}`, { cache: 'no-store' });
        if (!ds.ok) throw new Error(`Dedup failed: ${ds.status}`);
        const summary = await ds.json();
        setDedup(summary);
        showToast({ kind: 'info', title: 'Duplicates analyzed', detail: `Overlap groups: ${summary.overlap?.count ?? 0}` });
      } catch (e: any) {
        setDedupError(e?.message || 'Failed to compute duplicates');
        showToast({ kind: 'error', title: 'Dedup analysis failed', detail: String(e?.message || '') });
      } finally {
        setDedupLoading(false);
      }
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
      showToast({ kind: 'error', title: 'Restore staging failed', detail: String(e?.message || '') });
    } finally {
      setUploading(false);
    }
  }

  const dbCount = plan?.dbFiles?.length ?? 0;

  async function onApply() {
    if (!plan) return;
    setApplyBusy(true);
    setApplyError(null);
    setApplySummary(null);
    try {
      const res = await fetch('/api/restore/apply-ui', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          stagingId: plan.stagingId,
          strategy,
          attachmentsMode,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `Apply failed: ${res.status}`);
      const json = (await res.json()) as ApplySummary;
      setApplySummary(json);
      showToast({
        kind: 'success',
        title: 'Restore applied',
        detail: `Inserted ${json.inserted}, skipped ${json.skippedDuplicates}, attachments: ${json.attachmentsMode}`,
      });
    } catch (e: any) {
      setApplyError(e?.message || 'Apply failed');
      showToast({ kind: 'error', title: 'Apply failed', detail: String(e?.message || '') });
    } finally {
      setApplyBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow p-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Restore (Stage Only)</h2>
          <button
            className="rounded-md p-2 hover:bg-gray-100"
            aria-label="Close restore"
            onClick={onClose}
            data-testid="close-restore"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-600">
          Upload a backup ZIP to stage a restore plan. No live overwrite will occur.
        </p>

        <div className="mt-3 flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip"
            aria-label="Upload backup zip"
            onChange={onUpload}
            disabled={uploading}
            className="block text-sm"
            data-testid="restore-file-input"
          />
          {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
          {error && <span className="text-xs text-red-600" data-testid="restore-error">{error}</span>}
        </div>

        {plan && (
          <div className="mt-4 grid gap-2 text-sm" data-testid="restore-plan-summary">
            <div className="rounded-lg border p-3 bg-gray-50">
              <div><span className="font-medium">Staging ID:</span> {plan.stagingId}</div>
              <div><span className="font-medium">DB files detected:</span> {dbCount}</div>
              <div><span className="font-medium">Attachments:</span> {plan.attachments ? 'yes' : 'no'}</div>
              {plan.attachments && (
                <div className="text-xs text-gray-600 mt-1">
                  src: {plan.attachments.srcDir}<br/>
                  dest: {plan.attachments.destDir}
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">
                Plan path: {plan.stagingPath}/PLAN.json
              </div>
              {plan.next && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  ⚠️ {plan.next}
                </div>
              )}
            </div>
          </div>
        )}

        {dedupLoading && <div className="mt-3 text-xs text-gray-500">Analyzing duplicates…</div>}
        {dedupError && <div className="mt-3 text-xs text-red-600">{dedupError}</div>}
        {dedup && (
          <div className="mt-4 grid gap-2 text-sm">
            <h3 className="font-semibold">Duplicates Preview</h3>
            <div className="rounded-lg border p-3 bg-gray-50">
              <div>Within current DB: <span className="font-medium">{dedup.current.count}</span> potential duplicates</div>
              <div>Within staged ZIP: <span className="font-medium">{dedup.staged.count}</span> potential duplicates</div>
              <div>Overlap (current ↔ staged): <span className="font-medium">{dedup.overlap.count}</span> matching groups</div>
              {dedup.overlap.matches.length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Examples:
                  <ul className="list-disc ml-4">
                    {dedup.overlap.matches.slice(0,5).map(m => (
                      <li key={m.fp}>
                        fp={m.fp} • current: [{m.currentIds.join(', ')}] • staged: [{m.stagedIds.join(', ')}]
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-500">Note: fingerprinter = company | title | url(host+path)</div>
            </div>
          </div>
        )}

        {plan && (
          <div className="mt-4 grid gap-2 text-sm">
            <h3 className="font-semibold">Apply Restore</h3>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs">Import strategy:</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                className="border rounded-md px-2 py-1 text-sm"
                aria-label="Import strategy"
                disabled={applyBusy}
              >
                <option value="skip-duplicates">Skip duplicates (safer)</option>
                <option value="import-all">Import all (may create duplicates)</option>
              </select>

              <label className="text-xs ml-2">Attachments:</label>
              <select
                value={attachmentsMode}
                onChange={(e) => setAttachmentsMode(e.target.value as any)}
                className="border rounded-md px-2 py-1 text-sm"
                aria-label="Attachments mode"
                disabled={applyBusy}
              >
                <option value="merge">Merge (default)</option>
                <option value="replace">Replace (dangerous)</option>
              </select>

              <button
                onClick={onApply}
                disabled={applyBusy || !plan}
                className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-50"
                aria-label="Apply restore now"
                data-testid="apply-restore-btn"
              >
                {applyBusy ? 'Applying…' : 'Apply Restore'}
              </button>
              {applyError && <span className="text-xs text-red-600">{applyError}</span>}
            </div>

            {applySummary && (
              <div className="rounded-lg border p-3 bg-gray-50 text-xs leading-5" data-testid="apply-summary">
                <div className="font-medium mb-1">Apply Summary</div>
                <pre className="whitespace-pre-wrap">{JSON.stringify(applySummary, null, 2)}</pre>
                <div className="mt-2 text-gray-600">
                  Autosave created at: <code>{applySummary.autosavePath}</code>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


