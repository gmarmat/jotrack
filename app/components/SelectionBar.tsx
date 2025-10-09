"use client";
import { useState } from "react";
import { ORDERED_STATUSES, STATUS_LABELS, type JobStatus, isJobStatus } from "@/lib/status";

export function SelectionBar({ selectedIds, clearSelection }: { selectedIds: string[]; clearSelection: () => void }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<JobStatus>("ON_RADAR");

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
      <button
        onClick={clearSelection}
        className="px-2 py-1 text-sm underline text-gray-600 hover:text-gray-900"
      >
        Clear
      </button>
    </div>
  );
}

