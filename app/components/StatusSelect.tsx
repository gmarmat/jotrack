'use client';

import { useState } from 'react';
import { ORDERED_STATUSES, STATUS_LABELS, type JobStatus } from '@/lib/status';

interface StatusSelectProps {
  jobId: string;
  initialStatus: string;
  onStatusChange?: (jobId: string, newStatus: string) => void;
}

export default function StatusSelect({ jobId, initialStatus, onStatusChange }: StatusSelectProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setHasUnsavedChanges(true);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (data.success) {
        setHasUnsavedChanges(false);
        onStatusChange?.(jobId, status);
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      setStatus(initialStatus); // Revert on failure
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={handleStatusChange}
        disabled={isSaving}
        className="min-w-[140px] px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none"
        data-testid={`status-select-${jobId}`}
        style={{ zIndex: 1000 }}
      >
        {ORDERED_STATUSES.map((key) => (
          <option key={key} value={key} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            {STATUS_LABELS[key]}
          </option>
        ))}
      </select>

      {hasUnsavedChanges && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save status"
          data-testid={`save-status-${jobId}`}
        >
          {isSaving ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      {error && (
        <span className="text-xs text-red-600" data-testid={`status-error-${jobId}`}>
          {error}
        </span>
      )}
    </div>
  );
}

