'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { mutate } from 'swr';
import { formatBytes, relativeTime } from './format';

type Attachment = {
  id: string;
  filename: string;
  size: number;
  created_at: number;
  url: string; // download url
};

export default function AttachmentsModal({
  jobId,
  onClose,
}: {
  jobId: string;
  onClose: () => void;
}) {
  const handleClose = async () => {
    // Revalidate SWR caches on modal close
    const keys = [
      `/api/jobs/${jobId}/attachments`,
      `/api/jobs/${jobId}/analysis-data`,
      `/api/jobs/${jobId}/attachments/versions?kind=jd`,
      `/api/jobs/${jobId}/attachments/versions?kind=resume`,
    ];
    await Promise.all(keys.map(k => mutate(k, undefined, { revalidate: true })));
    onClose();
  };
  const [list, setList] = useState<Attachment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function fetchList() {
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/attachments`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`List failed: ${res.status}`);
      const data: Attachment[] = await res.json();
      setList(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load attachments');
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  const hasImages = useMemo(
    () => (list || []).some((a) => /\.(png|jpg|jpeg|webp)$/i.test(a.filename)),
    [list]
  );

  async function onUpload(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setError(null);

    // optimistic: add a temp item
    const tempId = `temp-${Date.now()}`;
    const optimistic: Attachment = {
      id: tempId,
      filename: file.name,
      size: file.size,
      created_at: Date.now(),
      url: '', // no download yet
    };
    setList((prev) => [optimistic, ...(prev || [])]);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/jobs/${jobId}/attachments`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Upload failed: ${res.status}`);
      }
      const created: Attachment = await res.json();

      // swap optimistic with actual
      setList((prev) =>
        (prev || []).map((a) => (a.id === tempId ? created : a))
      );
      // clear input
      if (inputRef.current) inputRef.current.value = '';
    } catch (e: any) {
      // revert optimistic
      setList((prev) => (prev || []).filter((a) => a.id !== tempId));
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(attId: string) {
    if (!confirm('Delete this attachment? This cannot be undone.')) return;
    // optimistic remove
    const prev = list ?? [];
    setDeletingId(attId);
    setList(prev.filter((a) => a.id !== attId));
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/attachments?attachment=${attId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => null))?.error || `Delete failed: ${res.status}`;
        throw new Error(msg);
      }
      // success: nothing else to do
    } catch (e: any) {
      // revert optimistic
      setList((_) => prev);
      setError(e.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4"
      onClick={handleClose}
      data-testid="attachments-modal"
    >
      <div
        className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl my-auto max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient (per UI_DESIGN_SYSTEM) */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Attachments</h2>
          <button
            className="rounded-md p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label="Close attachments"
            onClick={handleClose}
            data-testid="close-attachments"
          >
            ✕
          </button>
        </div>

        {/* Content area with padding */}
        <div className="p-6 overflow-y-auto">
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              aria-label="Upload attachment"
              onChange={onUpload}
              disabled={uploading}
              className="block text-sm text-gray-900 dark:text-gray-100"
              data-testid="upload-attachment-input"
            />
            {uploading && <span className="text-xs text-gray-500 dark:text-gray-400">Uploading…</span>}
            {error && <span className="text-xs text-red-600 dark:text-red-400" data-testid="upload-error">{error}</span>}
            <button
              className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              onClick={fetchList}
              aria-label="Refresh attachments"
              data-testid="refresh-attachments"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4">
            {list === null && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
            {list && list.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">No attachments yet.</div>
            )}
            {list && list.length > 0 && (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700" data-testid="attachments-list">
              {list.map((a) => {
                const isImage = /\.(png|jpg|jpeg|webp)$/i.test(a.filename);
                return (
                  <li key={a.id} className="p-3 flex items-center gap-3 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" data-testid={`attachment-${a.id}`}>
                    <div className="w-10 text-center text-2xl">📎</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.filename}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatBytes(Math.max(0, a.size))} • {relativeTime(a.created_at)}
                      </div>
                      {isImage && a.url && (
                        <div className="mt-2">
                          {/* preview via download URL; browser will render image */}
                          <img
                            src={a.url}
                            alt={a.filename}
                            className="max-h-32 rounded-md border border-gray-200 dark:border-gray-700"
                            data-testid={`preview-${a.id}`}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {a.url && (
                        <a
                          href={a.url}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          download
                          aria-label={`Download ${a.filename}`}
                          data-testid={`download-${a.id}`}
                        >
                          Download
                        </a>
                      )}
                      <button
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors disabled:opacity-50"
                        onClick={() => onDelete(a.id)}
                        disabled={deletingId === a.id}
                        aria-label={`Delete ${a.filename}`}
                        data-testid={`delete-${a.id}`}
                      >
                        {deletingId === a.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

          {hasImages && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-blue-900 dark:text-blue-300">Tip:</span> Images render inline; other files are available via Download.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

