"use client";
import { useState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { STATUS_LABELS, type JobStatus } from "@/lib/status";
import type { Job } from "@/db/schema";

interface JobDetailsPanelProps {
  job: Job;
  currentStatus: JobStatus;
}

export default function JobDetailsPanel({ job, currentStatus }: JobDetailsPanelProps) {
  const [postingUrl, setPostingUrl] = useState(job.postingUrl || "");
  const [notes, setNotes] = useState(job.notes || "");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const postingTimeoutRef = useRef<NodeJS.Timeout>();
  const notesTimeoutRef = useRef<NodeJS.Timeout>();

  const updatePostingUrl = async (url: string) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}/meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postingUrl: url }),
      });
      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Failed to update posting URL:', err);
    }
  };

  const updateNotes = async (newNotes: string) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}/meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: newNotes }),
      });
      if (res.ok) {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Failed to update notes:', err);
    }
  };

  const handlePostingUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setPostingUrl(newUrl);
    
    if (postingTimeoutRef.current) {
      clearTimeout(postingTimeoutRef.current);
    }
    
    postingTimeoutRef.current = setTimeout(() => {
      updatePostingUrl(newUrl);
    }, 600);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    
    notesTimeoutRef.current = setTimeout(() => {
      updateNotes(newNotes);
    }, 1000);
  };

  const handleNotesBlur = () => {
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }
    updateNotes(notes);
  };

  const isValidUrl = postingUrl && (postingUrl.startsWith('http://') || postingUrl.startsWith('https://'));

  useEffect(() => {
    return () => {
      if (postingTimeoutRef.current) clearTimeout(postingTimeoutRef.current);
      if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    };
  }, []);

  return (
    <section className="bg-white rounded-xl border shadow p-6">
      <h2 className="font-semibold text-lg mb-4 text-gray-900">Details</h2>
      
      <div className="space-y-6">
        {/* Posting Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Posting Link
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={postingUrl}
              onChange={handlePostingUrlChange}
              placeholder="https://..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="posting-url"
            />
            <a
              href={postingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isValidUrl
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              data-testid="posting-open"
              {...(!isValidUrl && { 'aria-disabled': true })}
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={handleNotesChange}
            onBlur={handleNotesBlur}
            placeholder="Add notes about this job application..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            data-testid="notes-area"
          />
          {lastSaved && (
            <div className="mt-2 text-xs text-gray-500" data-testid="notes-saved">
              Saved • {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Job Info */}
        <div className="pt-4 border-t border-gray-200">
          <dl className="text-sm space-y-3">
            <div className="flex gap-8">
              <div className="flex-1">
                <dt className="text-gray-500 font-medium">Current Status</dt>
                <dd className="text-gray-900 mt-1">{STATUS_LABELS[currentStatus]}</dd>
              </div>
              <div className="flex-1">
                <dt className="text-gray-500 font-medium">Created</dt>
                <dd className="text-gray-900 mt-1">{new Date(job.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex-1">
                <dt className="text-gray-500 font-medium">Last Updated</dt>
                <dd className="text-gray-900 mt-1">{new Date(job.updatedAt).toLocaleDateString()}</dd>
              </div>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
