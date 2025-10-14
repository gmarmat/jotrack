"use client";
import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { ORDERED_STATUSES, STATUS_LABELS, type JobStatus, isJobStatus } from "@/lib/status";

export function SelectionBar({ selectedIds, clearSelection }: { selectedIds: string[]; clearSelection: () => void }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<JobStatus>("ON_RADAR");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const run = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/jobs/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status }),
      });
      setBusy(false);
      if (!res.ok) {
        console.error("bulk status failed");
        alert("Failed to update job statuses");
        return;
      }
      clearSelection();
      // Reload to show updated statuses (simple + reliable)
      window.location.reload();
    } catch (error) {
      setBusy(false);
      console.error("bulk status error:", error);
      alert("Error updating job statuses");
    }
  };

  const handleSoftDelete = async () => {
    if (!selectedIds.length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/jobs/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: selectedIds, permanent: false }),
      });
      if (!res.ok) {
        throw new Error("Failed to move jobs to trash");
      }
      clearSelection();
      window.location.reload();
    } catch (error) {
      console.error("Soft delete error:", error);
      alert("Error moving jobs to trash");
    } finally {
      setBusy(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!selectedIds.length) return;
    
    const confirmed = confirm(
      `Are you sure you want to PERMANENTLY delete ${selectedIds.length} job(s)?\n\nThis action cannot be undone!`
    );
    
    if (!confirmed) return;

    setBusy(true);
    try {
      const res = await fetch("/api/jobs/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: selectedIds, permanent: true }),
      });
      if (!res.ok) {
        throw new Error("Failed to delete jobs");
      }
      clearSelection();
      window.location.reload();
    } catch (error) {
      console.error("Permanent delete error:", error);
      alert("Error deleting jobs permanently");
    } finally {
      setBusy(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex items-center gap-3 border rounded-lg p-3 bg-blue-50 shadow-sm mb-4">
      <div className="text-sm font-medium text-gray-700">
        {selectedIds.length} selected
      </div>
      <select
        value={status}
        onChange={(e) => {
          const v = e.currentTarget.value;
          if (isJobStatus(v)) setStatus(v);
        }}
        className="border rounded px-2 py-1 text-sm bg-white"
        data-testid="bulk-status-select"
      >
        {ORDERED_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        onClick={run}
        disabled={busy}
        className="px-3 py-1 text-sm rounded bg-gray-900 text-white disabled:opacity-50 hover:bg-gray-800 transition-colors"
        data-testid="bulk-status-apply"
      >
        {busy ? "Updating…" : "Apply"}
      </button>
      
      <div className="h-6 w-px bg-gray-300"></div>
      
      <button
        onClick={handleSoftDelete}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1 text-sm rounded bg-orange-600 text-white disabled:opacity-50 hover:bg-orange-700 transition-colors"
        data-testid="bulk-soft-delete"
        title="Move to trash (can be restored)"
      >
        <Trash2 className="w-4 h-4" />
        Move to Trash
      </button>
      
      <button
        onClick={handlePermanentDelete}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-1 text-sm rounded bg-red-600 text-white disabled:opacity-50 hover:bg-red-700 transition-colors"
        data-testid="bulk-permanent-delete"
        title="Delete permanently (cannot be undone)"
      >
        <AlertTriangle className="w-4 h-4" />
        Delete Forever
      </button>
      
      <button
        onClick={clearSelection}
        className="px-2 py-1 text-sm underline text-gray-600 hover:text-gray-900"
      >
        Clear
      </button>
    </div>
  );
}

