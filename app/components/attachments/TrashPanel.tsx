"use client";

import { useEffect, useState } from "react";

type TrashItem = {
  id: string;
  original_name: string;
  kind: string;
  version: number;
  deleted_at: number;
};

export default function TrashPanel({
  jobId,
  onClose,
}: {
  jobId: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/jobs/${jobId}/attachments/trash`);
      const j = await r.json();
      setItems(j.trash ?? []);
    } catch (error) {
      console.error("Failed to load trash:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [jobId]);

  const restore = async (id: string) => {
    try {
      await fetch(`/api/attachments/${id}/restore`, { method: "POST" });
      refresh();
    } catch (error) {
      console.error("Failed to restore:", error);
    }
  };

  const purgeOne = async (id: string) => {
    if (!confirm("Permanently delete this file? This cannot be undone.")) return;
    
    try {
      await fetch(`/api/attachments/${id}/purge`, { method: "POST" });
      refresh();
    } catch (error) {
      console.error("Failed to purge:", error);
    }
  };

  const purgeAll = async () => {
    if (items.length === 0) return;
    if (
      !confirm(
        `Permanently delete all ${items.length} trashed item(s)? This cannot be undone.`
      )
    )
      return;

    try {
      await fetch(`/api/jobs/${jobId}/attachments/trash/purge`, {
        method: "POST",
      });
      refresh();
    } catch (error) {
      console.error("Failed to purge all:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex"
      role="dialog"
      aria-label="Trash"
      onClick={onClose}
    >
      <div
        className="ml-auto h-full w-[520px] bg-white p-6 overflow-auto shadow-2xl"
        data-testid="trash-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Trash</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={purgeAll}
              disabled={items.length === 0}
              className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="purge-all"
            >
              Purge Trash ({items.length})
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
                data-testid="trash-row"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {it.original_name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {it.kind} • v{it.version}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => restore(it.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                    aria-label="Restore"
                    data-testid={`restore-${it.id}`}
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => purgeOne(it.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                    aria-label="Purge"
                    data-testid={`purge-${it.id}`}
                  >
                    Purge
                  </button>
                </div>
              </li>
            ))}
            {items.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500">
                No trashed items.
              </div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

