'use client';

import { useState } from 'react';
import { Info, Paperclip } from 'lucide-react';
import { type Job } from '@/db/schema';
import { type JobStatus } from '@/lib/status';
import StatusChipDropdown from './StatusChipDropdown';
import JobQuickActions from './JobQuickActions';
import JobSettingsModal from './JobSettingsModal';

interface JobHeaderProps {
  job: Job;
  currentStatus: JobStatus;
  onStatusChange?: (newStatus: JobStatus) => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onJumpToStatus?: (status: JobStatus) => void;
  attachmentCount?: number;
  onOpenAttachments?: () => void;
}

export default function JobHeader({ 
  job, 
  currentStatus, 
  onStatusChange,
  onDelete,
  onArchive,
  onJumpToStatus,
  attachmentCount = 0,
  onOpenAttachments
}: JobHeaderProps) {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border dark:border-gray-700" data-testid="job-header">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Title, Company, Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 truncate" data-testid="job-title">
                {job.title}
              </h1>
              <StatusChipDropdown 
                jobId={job.id} 
                currentStatus={currentStatus}
                onStatusChange={onStatusChange}
              />
              
              {/* Job Info Button */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Job Details"
                data-testid="open-job-info"
              >
                <Info size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400" data-testid="job-company">
              {job.company}
            </p>
            
            {/* Second Row: Attachments Button */}
            {onOpenAttachments && (
              <div className="mt-3">
                <button
                  onClick={onOpenAttachments}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                  data-testid="attachments-button-header"
                >
                  <Paperclip size={16} />
                  <span>Attachments</span>
                  {attachmentCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                      {attachmentCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right: Quick Actions */}
          <div className="flex-shrink-0">
            <JobQuickActions 
              jobId={job.id}
              onDelete={onDelete}
              onArchive={onArchive}
            />
          </div>
        </div>
      </div>

      {/* Job Settings Modal */}
      {showSettingsModal && (
        <JobSettingsModal
          jobId={job.id}
          job={job}
          onClose={() => setShowSettingsModal(false)}
          onJumpToStatus={onJumpToStatus}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      )}
    </>
  );
}

