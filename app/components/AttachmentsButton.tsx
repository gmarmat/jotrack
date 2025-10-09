'use client';
import { useState } from 'react';
import AttachmentsModal from './AttachmentsModal';

export default function AttachmentsButton({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        aria-label="Attachments"
        className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50"
        onClick={() => setOpen(true)}
        data-testid={`attachments-btn-${jobId}`}
      >
        Attachments
      </button>
      {open && <AttachmentsModal jobId={jobId} onClose={() => setOpen(false)} />}
    </>
  );
}

