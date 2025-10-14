"use client";

import { ExternalLink, FileText } from "lucide-react";
import { calculateDelta, formatDateTime } from "@/lib/timeDelta";
import GlobalSettingsButton from "../GlobalSettingsButton";

interface HeaderMetaProps {
  postingUrl?: string | null;
  createdAt: number;
  updatedAt: number;
  currentStatusEnteredAt?: number;
  jdAttachmentId?: string | null;
  onViewJd?: () => void;
}

export default function HeaderMeta({
  postingUrl,
  createdAt,
  updatedAt,
  currentStatusEnteredAt,
  jdAttachmentId,
  onViewJd,
}: HeaderMetaProps) {
  const delta = currentStatusEnteredAt
    ? calculateDelta(currentStatusEnteredAt)
    : null;

  return (
    <div 
      className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-3"
      data-testid="header-meta"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto flex-wrap gap-3">
        {/* Left: Quick Links */}
        <div className="flex items-center gap-3">
          {/* Global Settings Button - positioned here for Jobs page */}
          <div className="relative">
            <GlobalSettingsButton />
          </div>
          {jdAttachmentId && onViewJd && (
            <button
              onClick={onViewJd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              data-testid="view-jd-link"
            >
              <FileText size={14} />
              View JD
            </button>
          )}
          
          {postingUrl && (
            <a
              href={postingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
              data-testid="posting-link"
            >
              <ExternalLink size={14} />
              View Posting
            </a>
          )}
        </div>

        {/* Right: Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div title={formatDateTime(createdAt)}>
            <span className="font-medium">Created:</span> {formatDateTime(createdAt)}
          </div>
          <div title={formatDateTime(updatedAt)}>
            <span className="font-medium">Updated:</span> {formatDateTime(updatedAt)}
          </div>

          {/* Delta Chip */}
          {delta && (
            <div 
              className={`px-2.5 py-1 rounded-full font-semibold ${
                delta.isStale
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
              }`}
              data-testid="timeline-current-delta"
              title={`In current status for ${delta.days} days`}
            >
              {delta.label}
            </div>
          )}

          {/* Stale Badge */}
          {delta && delta.isStale && (
            <div 
              className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold"
              data-testid="stale-badge"
            >
              ⏳ STALE
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

