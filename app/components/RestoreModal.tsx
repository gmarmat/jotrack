'use client';
import { useRef, useState } from 'react';

type PlanSummary = {
  stagingId: string;
  zipSavedPath: string;
  stagingPath: string;
  dbFiles: { src: string; dest: string }[];
  attachments: { srcDir: string; destDir: string } | null;
  next?: string;
};

export default function RestoreModal({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanSummary | null>(null);

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
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  const dbCount = plan?.dbFiles?.length ?? 0;

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
      </div>
    </div>
  );
}

