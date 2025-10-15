'use client';

import { useState, useEffect } from 'react';
import { Paperclip, FileText, FileSearch, FileSignature } from 'lucide-react';
import AttachmentsModal from './AttachmentsModal';

interface AttachmentQuickPreviewProps {
  jobId: string;
}

interface AttachmentPresence {
  jd: boolean;
  resume: boolean;
  cover_letter: boolean;
  total: number;
}

export default function AttachmentQuickPreview({ jobId }: AttachmentQuickPreviewProps) {
  const [showModal, setShowModal] = useState(false);
  const [presence, setPresence] = useState<AttachmentPresence>({ jd: false, resume: false, cover_letter: false, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttachmentPresence = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/jobs/${jobId}/attachments`);
        if (response.ok) {
          const attachments = await response.json();
          const activeAttachments = attachments.filter((att: any) => att.isActive && !att.deletedAt);
          
          const presenceData = {
            jd: activeAttachments.some((att: any) => att.kind === 'jd'),
            resume: activeAttachments.some((att: any) => att.kind === 'resume'),
            cover_letter: activeAttachments.some((att: any) => att.kind === 'cover_letter'),
            total: activeAttachments.length
          };

          setPresence(presenceData);
        }
      } catch (error) {
        console.error('Error fetching attachments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachmentPresence();
  }, [jobId]);

  if (loading) {
    return <span className="text-xs text-gray-400">Loading...</span>;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-xs text-gray-700 hover:text-blue-600 transition-colors"
        title="Click to view attachments"
      >
        <span className="font-medium">Attachments</span>
        
        {/* Presence Indicators */}
        <div className="flex items-center gap-1">
          <span 
            className={`${presence.jd ? 'text-gray-700' : 'text-gray-300'}`}
            title={presence.jd ? 'Job Description present' : 'No Job Description'}
          >
            <FileSearch size={12} />
          </span>
          <span 
            className={`${presence.resume ? 'text-gray-700' : 'text-gray-300'}`}
            title={presence.resume ? 'Resume present' : 'No Resume'}
          >
            <FileText size={12} />
          </span>
          <span 
            className={`${presence.cover_letter ? 'text-gray-700' : 'text-gray-300'}`}
            title={presence.cover_letter ? 'Cover Letter present' : 'No Cover Letter'}
          >
            <FileSignature size={12} />
          </span>
        </div>
        
        <Paperclip size={12} className="text-gray-400" />
      </button>

      {showModal && (
        <AttachmentsModal jobId={jobId} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

