'use client';

import { useState, useRef, useEffect } from 'react';
import { ORDERED_STATUSES, STATUS_LABELS, type JobStatus } from '@/lib/status';
import StatusBadge from '@/app/components/StatusBadge';

interface StatusChipDropdownProps {
  jobId: string;
  currentStatus: JobStatus;
  onStatusChange?: (newStatus: JobStatus) => void;
}

export default function StatusChipDropdown({ 
  jobId, 
  currentStatus, 
  onStatusChange 
}: StatusChipDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedStatus(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStatusClick = (status: JobStatus) => {
    if (status === currentStatus) {
      setIsOpen(false);
      return;
    }
    setSelectedStatus(status);
  };

  const handleConfirm = async () => {
    if (!selectedStatus) return;

    setIsSaving(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = await response.json();

      if (data.success) {
        onStatusChange?.(selectedStatus);
        setIsOpen(false);
        setSelectedStatus(null);
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef} data-testid="status-chip-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        data-testid="status-chip-trigger"
      >
        <StatusBadge status={currentStatus} />
        <svg 
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
              Change Status
            </div>
            
            <div className="space-y-1">
              {ORDERED_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusClick(status as JobStatus)}
                  disabled={isSaving}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    status === currentStatus
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : selectedStatus === status
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  data-testid={`status-option-${status}`}
                >
                  <span>{STATUS_LABELS[status]}</span>
                  
                  {status === currentStatus && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  
                  {selectedStatus === status && status !== currentStatus && (
                    <input
                      type="checkbox"
                      checked
                      readOnly
                      className="w-4 h-4 text-green-600 dark:text-green-400 rounded focus:ring-green-500 dark:focus:ring-green-400"
                      data-testid={`status-checkbox-${status}`}
                    />
                  )}
                </button>
              ))}
            </div>

            {selectedStatus && selectedStatus !== currentStatus && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleConfirm}
                  disabled={isSaving}
                  className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  data-testid="confirm-status-change"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm Change
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

