'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
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
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 overflow-y-auto p-4"
      onClick={onClose}
      data-testid="attachments-modal"
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow p-4 my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Attachments</h2>
          <button
            className="rounded-md p-2 hover:bg-gray-100"
            aria-label="Close attachments"
            onClick={onClose}
            data-testid="close-attachments"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            aria-label="Upload attachment"
            onChange={onUpload}
            disabled={uploading}
            className="block text-sm"
            data-testid="upload-attachment-input"
          />
          {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
          {error && <span className="text-xs text-red-600" data-testid="upload-error">{error}</span>}
          <button
            className="ml-auto text-sm underline"
            onClick={fetchList}
            aria-label="Refresh attachments"
            data-testid="refresh-attachments"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {list === null && <div className="text-sm text-gray-500">Loading…</div>}
          {list && list.length === 0 && (
            <div className="text-sm text-gray-500">No attachments yet.</div>
          )}
          {list && list.length > 0 && (
            <ul className="divide-y rounded-lg border" data-testid="attachments-list">
              {list.map((a) => {
                const isImage = /\.(png|jpg|jpeg|webp)$/i.test(a.filename);
                return (
                  <li key={a.id} className="p-3 flex items-center gap-3" data-testid={`attachment-${a.id}`}>
                    <div className="w-10 text-center">📎</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{a.filename}</div>
                      <div className="text-xs text-gray-500">
                        {formatBytes(Math.max(0, a.size))} • {relativeTime(a.created_at)}
                      </div>
                      {isImage && a.url && (
                        <div className="mt-2">
                          {/* preview via download URL; browser will render image */}
                          <img
                            src={a.url}
                            alt={a.filename}
                            className="max-h-32 rounded-md border"
                            data-testid={`preview-${a.id}`}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {a.url && (
                        <a
                          href={a.url}
                          className="text-sm underline"
                          download
                          aria-label={`Download ${a.filename}`}
                          data-testid={`download-${a.id}`}
                        >
                          Download
                        </a>
                      )}
                      <button
                        className="text-sm text-red-600 underline disabled:opacity-50"
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
          <div className="mt-3 text-xs text-gray-500">
            Tip: Images render inline; other files are available via Download.
          </div>
        )}
      </div>
    </div>
  );
}

