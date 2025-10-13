'use client';

import { useState } from 'react';
import { Download, FileArchive, Trash2, Archive, Settings, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface JobQuickActionsProps {
  jobId: string;
  onDelete?: () => void;
  onArchive?: () => void;
}

export default function JobQuickActions({ jobId, onDelete, onArchive }: JobQuickActionsProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleCSVExport = async () => {
    try {
      const res = await fetch("/api/export/csv");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jotrack-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export failed:", error);
      alert("Export failed");
    }
  };

  const handleJobZipExport = async () => {
    try {
      const res = await fetch(`/api/export/job-zip/${jobId}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-export-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Job ZIP export failed:", error);
      alert("Export failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm('Move this job to trash? It will be permanently deleted in 5 days.')) return;
    
    try {
      const res = await fetch(`/api/jobs/${jobId}/delete`, { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        onDelete?.();
        window.location.href = '/';
      } else {
        alert('Failed to delete job');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete job');
    }
  };

  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/archive`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true })
      });
      const data = await res.json();
      
      if (data.success) {
        onArchive?.();
        window.location.href = '/';
      } else {
        alert('Failed to archive job');
      }
    } catch (error) {
      console.error('Archive failed:', error);
      alert('Failed to archive job');
    }
  };

  return (
    <div className="flex items-center gap-2" data-testid="job-quick-actions">
      {/* Coach Mode Button */}
      <Link
        href={`/coach/${jobId}`}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 text-sm font-medium transition-all shadow-sm"
        data-testid="coach-mode-button"
      >
        <Sparkles size={16} />
        Coach Mode
      </Link>

      {/* Export Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          data-testid="export-dropdown-trigger"
        >
          <Download size={16} />
          Export
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showExportMenu && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="py-1">
              <button
                onClick={() => {
                  handleJobZipExport();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                data-testid="export-zip"
              >
                <FileArchive size={16} />
                Export as ZIP
              </button>
              <button
                onClick={() => {
                  handleCSVExport();
                  setShowExportMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                data-testid="export-csv"
              >
                <Download size={16} />
                Export as CSV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Archive Button */}
      <button
        onClick={handleArchive}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
        data-testid="archive-button"
        title="Archive this job"
      >
        <Archive size={16} />
        Archive
      </button>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
        data-testid="delete-button"
        title="Move to trash"
      >
        <Trash2 size={16} />
        Delete
      </button>

      {/* Settings Button - removed for now, will be replaced by Job Settings Modal */}
    </div>
  );
}

