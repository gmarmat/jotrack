"use client";
import { useState } from "react";
import { ExternalLink, SquarePlus, Files, Copy } from "lucide-react";
import type { Job } from "@/db/schema";
import { useToast } from "./ToastProvider";

interface JobActionsBarProps {
  job: Job;
  attachmentCount: number;
}

export default function JobActionsBar({ job, attachmentCount }: JobActionsBarProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

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
          showToast(`Duplicated to: ${data.job.title}`, 'success');
          setTimeout(() => {
            window.location.href = `/jobs/${data.job.id}`;
          }, 500);
        }
      } else {
        showToast('Failed to duplicate job', 'error');
      }
    } catch (err) {
      console.error('Failed to duplicate job:', err);
      showToast('Something went wrong', 'error');
    }
  };

  const handleOpenAllDocs = async () => {
    try {
      const res = await fetch(`/api/jobs/${job.id}/attachments`);
      if (res.ok) {
        const attachments = await res.json();
        
        // Filter for active attachments of specific kinds (resume, jd, cover_letter)
        const docKinds = ['resume', 'jd', 'cover_letter'];
        const activeDocs = attachments.filter((att: any) => 
          docKinds.includes(att.kind) && att.url
        );
        
        if (activeDocs.length === 0) {
          showToast('No active documents to open', 'info');
          return;
        }
        
        activeDocs.forEach((att: any) => {
          window.open(att.url, '_blank', 'noopener,noreferrer');
        });
      } else {
        showToast('Failed to fetch attachments', 'error');
      }
    } catch (err) {
      console.error('Failed to open attachments:', err);
      showToast('Something went wrong', 'error');
    }
  };

  const handleCopySummary = async () => {
    try {
      // Format notes: first 200 chars, single-line, ellipsis if longer
      let notesText = job.notes || 'N/A';
      if (notesText !== 'N/A') {
        // Collapse whitespace and newlines
        notesText = notesText.replace(/\s+/g, ' ').trim();
        if (notesText.length > 200) {
          notesText = notesText.substring(0, 200) + '...';
        }
      }
      
      const summary = `Job: ${job.title}
Status: ${job.status}
Posting: ${job.postingUrl || 'N/A'}
Notes: ${notesText}`;
      
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      showToast('Summary copied', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
      showToast('Failed to copy', 'error');
    }
  };

  // Check if posting URL is valid http(s)
  const hasValidPostingUrl = job.postingUrl && /^https?:\/\/.+/.test(job.postingUrl);
  
  // Check which documents are missing
  const getMissingDocsTooltip = () => {
    if (attachmentCount === 0) {
      return "No active documents (resume, JD, cover letter)";
    }
    return `Open all active documents`;
  };

  const btnClass = "inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300";

  return (
    <div className="flex items-center gap-1" data-testid="job-actions-bar">
      <button
        onClick={handleOpenPosting}
        disabled={!hasValidPostingUrl}
        className={btnClass}
        aria-label="Open posting"
        title={hasValidPostingUrl ? "Open job posting" : "Add a posting URL to enable"}
        data-testid="action-open-posting"
      >
        <ExternalLink size={16} />
      </button>

      <button
        onClick={handleDuplicate}
        className={btnClass}
        aria-label="Duplicate job"
        title="Duplicate this job"
        data-testid="action-duplicate"
      >
        <SquarePlus size={16} />
      </button>

      <button
        onClick={handleOpenAllDocs}
        disabled={attachmentCount === 0}
        className={btnClass}
        aria-label="Open all documents"
        title={getMissingDocsTooltip()}
        data-testid="action-open-docs"
      >
        <Files size={16} />
      </button>

      <button
        onClick={handleCopySummary}
        className={btnClass}
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

