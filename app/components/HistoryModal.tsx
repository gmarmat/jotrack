'use client';

import { useState, useEffect } from 'react';
import { relativeTime } from '@/app/lib/utils';
import { STATUS_LABELS, type JobStatus } from '@/lib/status';

interface StatusHistoryEntry {
  id: string;
  jobId: string;
  status: string;
  changedAt: number;
}

interface HistoryModalProps {
  jobId: string;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryModal({ jobId, jobTitle, isOpen, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<StatusHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, jobId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}/history`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      } else {
        throw new Error(data.message || 'Failed to fetch history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-testid="history-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Status History</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="close-history-modal"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{jobTitle}</p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No status history found</div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3"
                  data-testid={`history-entry-${index}`}
                >
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div className={`h-3 w-3 rounded-full ${
                      index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                    }`}></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === 'OFFER' ? 'bg-green-100 text-green-800' :
                        entry.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        entry.status === 'ONSITE' ? 'bg-purple-100 text-purple-800' :
                        entry.status === 'PHONE_SCREEN' ? 'bg-blue-100 text-blue-800' :
                        entry.status === 'ON_RADAR' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {STATUS_LABELS[entry.status as JobStatus] || entry.status}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {relativeTime(entry.changedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

