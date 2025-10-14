'use client';

import { useState } from 'react';
import { Paperclip, ExternalLink } from 'lucide-react';
import AttachmentsModal from './AttachmentsModal';

interface AttachmentQuickPreviewProps {
  jobId: string;
  attachmentSummary: Record<string, { count: number; latest: number | null }>;
}

export default function AttachmentQuickPreview({ jobId, attachmentSummary }: AttachmentQuickPreviewProps) {
  const [showModal, setShowModal] = useState(false);

  // Calculate total count
  const totalCount = Object.values(attachmentSummary).reduce((sum, info) => sum + (info?.count || 0), 0);

  // Get list of attachment types
  const kinds = Object.keys(attachmentSummary).filter(k => attachmentSummary[k]?.count > 0);
  const kindLabels = kinds.map(k => {
    if (k === 'resume') return 'Resume';
    if (k === 'jd') return 'JD';
    if (k === 'cover_letter') return 'Cover Letter';
    return k;
  });

  if (totalCount === 0) {
    return (
      <span className="text-xs text-gray-400">No files</span>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-blue-600 transition-colors"
        title={`Click to view: ${kindLabels.join(', ')}`}
      >
        <Paperclip size={14} />
        <span className="font-medium">{totalCount} file{totalCount !== 1 ? 's' : ''}</span>
        {kindLabels.length > 0 && (
          <span className="text-gray-500">({kindLabels.join(', ')})</span>
        )}
        <ExternalLink size={12} className="text-gray-400" />
      </button>

      {showModal && (
        <AttachmentsModal jobId={jobId} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

