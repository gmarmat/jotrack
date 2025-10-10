"use client";

import { Copy } from "lucide-react";
import { STATUS_LABELS, type JobStatus } from "@/lib/status";

interface CopyForEmailProps {
  job: {
    title: string;
    company: string;
    status: JobStatus;
  };
  statusNotes?: string;
  interviewers?: Array<{ name: string; title: string }>;
}

/**
 * Generates formatted text for email communication
 */
export default function CopyForEmail({
  job,
  statusNotes,
  interviewers = [],
}: CopyForEmailProps) {
  const handleCopy = () => {
    const formattedText = `
Job Application Update

Position: ${job.title}
Company: ${job.company}
Current Status: ${STATUS_LABELS[job.status]}

${interviewers.length > 0 ? `Interviewers:
${interviewers.map((i) => `• ${i.name}${i.title ? ` (${i.title})` : ""}`).join("\n")}

` : ""}${statusNotes ? `Notes:
${statusNotes}

` : ""}---
Generated from JoTrack on ${new Date().toLocaleDateString()}
    `.trim();

    navigator.clipboard.writeText(formattedText);
    alert("Status summary copied to clipboard!");
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
      data-testid="copy-for-email"
      title="Copy formatted status summary"
    >
      <Copy size={14} />
      Copy for Email
    </button>
  );
}

