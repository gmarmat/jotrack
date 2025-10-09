'use client';
import { useState } from 'react';
import RestoreModal from './RestoreModal';
import { useToast } from './ToastProvider';

function parseFilenameFromCD(cd: string | null): string | null {
  if (!cd) return null;
  // e.g. attachment; filename="jotrack-backup-YYYYMMDD-HHMMSS.zip"
  const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd);
  return m ? decodeURIComponent(m[1].replace(/\"/g, '')) : null;
}

export default function BackupRestorePanel() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'backup' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { showToast } = useToast();

  async function onBackup() {
    setBusy('backup');
    setMessage(null);
    try {
      const res = await fetch('/api/backup', { method: 'GET' });
      if (!res.ok) throw new Error(`Backup failed: ${res.status}`);
      const cd = res.headers.get('content-disposition');
      const name = parseFilenameFromCD(cd) || `jotrack-backup-${Date.now()}.zip`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage(`Backup downloaded: ${name}`);
      showToast({ kind: 'success', title: 'Backup complete', detail: name });
    } catch (e: any) {
      setMessage(e?.message || 'Backup failed');
      showToast({ kind: 'error', title: 'Backup failed', detail: String(e?.message || '') });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border p-3 flex items-center gap-3 bg-white">
      <div className="font-semibold">Backup & Restore</div>
      <button
        onClick={onBackup}
        disabled={busy === 'backup'}
        className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-50"
        aria-label="Backup ZIP"
        data-testid="backup-btn"
      >
        {busy === 'backup' ? 'Backing up…' : 'Backup (ZIP)'}
      </button>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50"
        aria-label="Open restore modal"
        data-testid="restore-btn"
      >
        Restore…
      </button>
      {message && <span className="ml-2 text-xs text-gray-600">{message}</span>}
      {open && <RestoreModal onClose={() => setOpen(false)} />}
    </div>
  );
}

