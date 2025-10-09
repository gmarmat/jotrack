"use client";
import { useState } from "react";
import { ExternalLink, SquarePlus, Files, Copy } from "lucide-react";
import type { Job } from "@/db/schema";

interface JobActionsBarProps {
  job: Job;
  attachmentCount: number;
}

export default function JobActionsBar({ job, attachmentCount }: JobActionsBarProps) {
  const [copied, setCopied] = useState(false);

  const handleOpenPosting = () => {
    if (job.postingUrl) {
      window.open(job.postingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch('/api/jobs/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.job?.id) {
          window.location.href = `/jobs/${data.job.id}`;
        }
      }
    } catch (err) {
      console.error('Failed to duplicate job:', err);
    }
  };

  const handleOpenAllDocs = async () => {
    try {
      const res = await fetch(`/api/jobs/${job.id}/attachments`);
      if (res.ok) {
        const attachments = await res.json();
        attachments.forEach((att: any) => {
          window.open(att.url, '_blank', 'noopener,noreferrer');
        });
      }
    } catch (err) {
      console.error('Failed to open attachments:', err);
    }
  };

  const handleCopySummary = async () => {
    try {
      const summary = `${job.title} at ${job.company}\nStatus: ${job.status}\nNotes: ${job.notes || 'None'}\nCreated: ${new Date(job.createdAt).toLocaleDateString()}`;
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  return (
    <div className="flex items-center gap-1" data-testid="job-actions-bar">
      <button
        onClick={handleOpenPosting}
        disabled={!job.postingUrl}
        className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Open posting"
        title={job.postingUrl ? "Open job posting" : "No posting URL"}
        data-testid="action-open-posting"
      >
        <ExternalLink size={16} />
      </button>

      <button
        onClick={handleDuplicate}
        className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 focus-visible:ring-2"
        aria-label="Duplicate job"
        title="Duplicate this job"
        data-testid="action-duplicate"
      >
        <SquarePlus size={16} />
      </button>

      <button
        onClick={handleOpenAllDocs}
        disabled={attachmentCount === 0}
        className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Open all documents"
        title={attachmentCount > 0 ? `Open all ${attachmentCount} documents` : "No attachments"}
        data-testid="action-open-docs"
      >
        <Files size={16} />
      </button>

      <button
        onClick={handleCopySummary}
        className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 focus-visible:ring-2"
        aria-label="Copy job summary"
        title="Copy job summary to clipboard"
        data-testid="action-copy-summary"
      >
        <Copy size={16} />
      </button>

      {copied && (
        <span className="text-xs text-green-600 font-medium" data-testid="copy-feedback">
          Copied!
        </span>
      )}
    </div>
  );
}
