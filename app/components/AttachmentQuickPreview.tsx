'use client';

import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Paperclip, FileText, FileSearch, FileSignature } from 'lucide-react';
import AttachmentsModal from './AttachmentsModal';
import { fetcher } from '@/src/lib/swr';

interface AttachmentQuickPreviewProps {
  jobId: string;
}

export default function AttachmentQuickPreview({ jobId }: AttachmentQuickPreviewProps) {
  const [showModal, setShowModal] = useState(false);
  const { mutate } = useSWRConfig();

  // SWR hooks for versions data
  const { data: resumeData, error: resumeError, isLoading: resumeLoading } = useSWR(
    `/api/jobs/${jobId}/attachments/versions?kind=resume`,
    fetcher
  );
  const { data: jdData, error: jdError, isLoading: jdLoading } = useSWR(
    `/api/jobs/${jobId}/attachments/versions?kind=jd`,
    fetcher
  );

  // Derive latest normalized file paths with fallbacks
  const resumePath: string | undefined =
    resumeData?.versions?.[0]?.variants?.normalized?.path ??
    resumeData?.versions?.[0]?.variants?.ai_optimized?.path ??
    resumeData?.versions?.[0]?.variants?.normalized_txt?.path;

  const jdPath: string | undefined =
    jdData?.versions?.[0]?.variants?.normalized?.path ??
    jdData?.versions?.[0]?.variants?.ai_optimized?.path ??
    jdData?.versions?.[0]?.variants?.normalized_txt?.path;
  
  const resumeHref = resumePath ? `/api/files/stream?path=${encodeURIComponent(resumePath)}` : undefined;
  const jdHref = jdPath ? `/api/files/stream?path=${encodeURIComponent(jdPath)}` : undefined;

  const handleModalClose = async () => {
    // Revalidate SWR caches when modal closes
    const keys = [
      `/api/jobs/${jobId}/attachments`,
      `/api/jobs/${jobId}/attachments/versions?kind=resume`,
      `/api/jobs/${jobId}/attachments/versions?kind=jd`,
    ];
    await Promise.all(keys.map(k => mutate(k, undefined, { revalidate: true })));
    setShowModal(false);
  };

  const handleOpenFile = (href: string) => {
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 text-xs text-gray-700 hover:text-blue-600 transition-colors"
          title="Click to view attachments"
        >
          <span className="font-medium">Attachments</span>
          <Paperclip size={12} className="text-gray-400" />
        </button>
        
        {/* Quick Access Buttons */}
        <div className="flex items-center gap-1">
          {/* Resume (AI) Button */}
          <button
            disabled={!resumeHref}
            onClick={() => handleOpenFile(resumeHref!)}
            className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={resumeLoading ? 'building…' : resumeHref ? 'Open AI-normalized Resume' : 'Not ready'}
            data-testid="quick-access-resume"
          >
            <FileText size={12} className={resumeHref ? "text-gray-700" : "text-gray-400"} />
          </button>

          {/* JD (AI) Button */}
          <button
            disabled={!jdHref}
            onClick={() => handleOpenFile(jdHref!)}
            className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={jdLoading ? 'building…' : jdHref ? 'Open AI-normalized JD' : 'Not ready'}
            data-testid="quick-access-jd"
          >
            <FileSearch size={12} className={jdHref ? "text-gray-700" : "text-gray-400"} />
          </button>
        </div>
      </div>

      {showModal && (
        <AttachmentsModal jobId={jobId} onClose={handleModalClose} />
      )}
    </>
  );
}

