'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
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
}

export default function JobHeader({ 
  job, 
  currentStatus, 
  onStatusChange,
  onDelete,
  onArchive,
  onJumpToStatus
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

