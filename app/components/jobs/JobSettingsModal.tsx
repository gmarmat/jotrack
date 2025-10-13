'use client';

import { useState } from 'react';
import { X, FileText, Info, StickyNote, Zap } from 'lucide-react';
import { useVersions } from '@/app/hooks/useVersions';
import { formatFileSize } from '@/lib/files';
import { formatDateTime } from '@/lib/timeDelta';
import GlobalNotesHub from '@/app/components/jobs/GlobalNotesHub';
import type { JobStatus } from '@/lib/status';
import Link from 'next/link';

type Tab = 'files' | 'meta' | 'notes' | 'actions';

interface JobSettingsModalProps {
  jobId: string;
  job: any;
  onClose: () => void;
  onJumpToStatus?: (status: JobStatus) => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

export default function JobSettingsModal({
  jobId,
  job,
  onClose,
  onJumpToStatus,
  onDelete,
  onArchive
}: JobSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('files');

  const resume = useVersions(jobId, 'resume');
  const jd = useVersions(jobId, 'jd');
  const cover = useVersions(jobId, 'cover_letter');

  const renderFiles = () => {
    const allFiles = [
      ...resume.data.map((v) => ({ ...v, kind: 'resume' })),
      ...jd.data.map((v) => ({ ...v, kind: 'jd' })),
      ...cover.data.map((v) => ({ ...v, kind: 'cover_letter' })),
    ];

    if (allFiles.length === 0) {
      return <div className="text-sm text-gray-500 text-center py-8">No files uploaded</div>;
    }

    return (
      <div className="space-y-2">
        {allFiles.map((file) => (
          <a
            key={file.id}
            href={`/api/files/stream?path=${encodeURIComponent(file.path)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            data-testid={`file-${file.id}`}
          >
            <div className="text-sm font-medium text-gray-900 truncate">{file.filename}</div>
            <div className="text-xs text-gray-600 mt-1">
              {file.kind} • v{file.version} • {formatFileSize(file.size)}
            </div>
          </a>
        ))}
      </div>
    );
  };

  const renderMeta = () => {
    return (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium text-gray-700">Job ID:</div>
          <div className="text-gray-600 font-mono text-xs truncate">{job.id}</div>

          <div className="font-medium text-gray-700">Title:</div>
          <div className="text-gray-600">{job.title}</div>

          <div className="font-medium text-gray-700">Company:</div>
          <div className="text-gray-600">{job.company}</div>

          <div className="font-medium text-gray-700">Status:</div>
          <div className="text-gray-600">{job.status.replace('_', ' ')}</div>

          <div className="font-medium text-gray-700">Created:</div>
          <div className="text-gray-600">{formatDateTime(job.created_at || job.createdAt)}</div>

          <div className="font-medium text-gray-700">Updated:</div>
          <div className="text-gray-600">{formatDateTime(job.updated_at || job.updatedAt)}</div>
        </div>

        {job.posting_url && (
          <div className="pt-3 border-t">
            <a
              href={job.posting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              View original posting →
            </a>
          </div>
        )}
      </div>
    );
  };

  const renderGlobalNotes = () => {
    return <GlobalNotesHub jobId={jobId} onJumpToStatus={onJumpToStatus} />;
  };

  const renderActions = () => {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href={`/coach/${jobId}`}
              className="block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all text-center font-medium"
            >
              🎯 Open Coach Mode
            </Link>
            
            <Link
              href={`/settings/ai?from=/jobs/${jobId}`}
              className="block w-full px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-center font-medium"
            >
              ⚙️ AI Settings
            </Link>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Danger Zone</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                onArchive?.();
                onClose();
              }}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
            >
              📁 Archive Job
            </button>
            
            <button
              onClick={() => {
                onDelete?.();
                onClose();
              }}
              className="w-full px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-center font-medium"
            >
              🗑️ Move to Trash
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4"
      onClick={onClose}
      data-testid="job-settings-modal"
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">⚙️ Job Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close settings"
            data-testid="close-job-settings"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'files'
                ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="tab-files"
          >
            <FileText size={16} className="inline mr-2" />
            Files
          </button>
          <button
            onClick={() => setActiveTab('meta')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'meta'
                ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="tab-meta"
          >
            <Info size={16} className="inline mr-2" />
            Meta
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'notes'
                ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="tab-notes"
          >
            <StickyNote size={16} className="inline mr-2" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'actions'
                ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="tab-actions"
          >
            <Zap size={16} className="inline mr-2" />
            Actions
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'files' && renderFiles()}
          {activeTab === 'meta' && renderMeta()}
          {activeTab === 'notes' && renderGlobalNotes()}
          {activeTab === 'actions' && renderActions()}
        </div>

        {/* Footer Hint */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 text-center">
          <div className="text-xs text-gray-600">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
}

