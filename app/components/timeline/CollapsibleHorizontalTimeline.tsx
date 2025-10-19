"use client";

import { useState, useEffect } from 'react';
import { JobStatus, ORDERED_STATUSES, STATUS_LABELS } from "@/lib/status";
import { JOURNEY_MAPPING } from "@/lib/statusJourney";
import { ChevronDown, ChevronUp, ExternalLink, FileText, Settings, Moon, Sun, User } from 'lucide-react';
import { calculateDelta, formatDateTime } from "@/lib/timeDelta";
import { useTheme } from "next-themes";
import GlobalSettingsModal from "../GlobalSettingsModal";

interface CollapsibleHorizontalTimelineProps {
  currentStatus: JobStatus;
  onStatusClick?: (status: JobStatus) => void;
  currentStatusDelta?: string; // e.g., "6d"
  // Header props
  postingUrl?: string | null;
  createdAt?: number;
  updatedAt?: number;
  currentStatusEnteredAt?: number;
  jdAttachmentId?: string | null;
  onViewJd?: () => void;
}

export default function CollapsibleHorizontalTimeline({
  currentStatus,
  onStatusClick,
  currentStatusDelta,
  postingUrl,
  createdAt,
  updatedAt,
  currentStatusEnteredAt,
  jdAttachmentId,
  onViewJd,
}: CollapsibleHorizontalTimelineProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentIndex = ORDERED_STATUSES.indexOf(currentStatus);
  
  const delta = currentStatusEnteredAt
    ? calculateDelta(currentStatusEnteredAt)
    : null;

  // Handle theme toggle on client only
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === 'dark';

  // Auto-collapse on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsCollapsed(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, status: JobStatus) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onStatusClick?.(status);
    }
    
    const currentIdx = ORDERED_STATUSES.indexOf(status);
    
    if (e.key === "ArrowLeft" && currentIdx > 0) {
      e.preventDefault();
      const prev = ORDERED_STATUSES[currentIdx - 1];
      onStatusClick?.(prev);
    } else if (e.key === "ArrowRight" && currentIdx < ORDERED_STATUSES.length - 1) {
      e.preventDefault();
      const next = ORDERED_STATUSES[currentIdx + 1];
      onStatusClick?.(next);
    }
  };

  // Compact version (collapsed) - integrated with header
  if (isCollapsed) {
    return (
      <div 
        className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950/65 dark:to-blue-950/65 border-b border-purple-200 dark:border-purple-800 sticky top-0 z-40 shadow-md transition-all duration-300 backdrop-blur-sm"
        data-testid="horizontal-timeline-compact"
      >
        <div className="flex items-center justify-between px-6 py-2">
          {/* Left: Timeline Info */}
          <div className="flex items-center gap-4">
            {/* Current Status Indicator */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {STATUS_LABELS[currentStatus]}
              </span>
              {currentStatusDelta && (
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">
                  {currentStatusDelta}
                </span>
              )}
            </div>

            {/* Mini Progress Bar */}
            <div className="hidden sm:flex items-center gap-1">
              {ORDERED_STATUSES.map((status, index) => {
                const isActive = status === currentStatus;
                const isPast = index < currentIndex;
                
                return (
                  <div
                    key={status}
                    className={`w-6 h-1.5 rounded-full transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-500"
                        : isPast
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    title={STATUS_LABELS[status]}
                  />
                );
              })}
            </div>

            {/* Progress Text */}
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Step {currentIndex + 1} of {ORDERED_STATUSES.length}
            </span>
          </div>

          {/* Right: Header Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              {jdAttachmentId && onViewJd && (
                <button
                  onClick={onViewJd}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="View JD"
                >
                  <FileText size={14} />
                </button>
              )}
              
              {postingUrl && (
                <a
                  href={postingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="View Posting"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              {createdAt && (
                <>
                  <span className="font-medium">{formatDateTime(createdAt)}</span>
                  <span>•</span>
                </>
              )}
              {updatedAt && (
                <>
                  <span className="font-medium">{formatDateTime(updatedAt)}</span>
                  {delta && <span>•</span>}
                </>
              )}
              
              {/* Delta Chip */}
              {delta && (
                <div 
                  className={`px-2 py-0.5 rounded-full font-semibold text-xs ${
                    delta.isStale
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  }`}
                  title={`In current status for ${delta.days} days`}
                >
                  {delta.label}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* User Profile Button */}
              <button
                onClick={() => {
                  alert('User Profile - Coming soon!');
                }}
                className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                title="User Profile"
              >
                <User className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => {
                    const newTheme = isDark ? 'light' : 'dark';
                    setTheme(newTheme);
                  }}
                  className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-700" />
                  )}
                </button>
              )}

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Expand Button */}
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg transition-colors"
              title="Expand timeline and header"
              aria-label="Expand timeline"
            >
              <ChevronDown className="text-purple-600 dark:text-purple-400" size={20} />
            </button>
          </div>
        </div>

        {/* Global Settings Modal */}
        <GlobalSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    );
  }

  // Full version (expanded)
  return (
    <div 
      className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/65 dark:to-blue-950/65 border-b border-purple-200 dark:border-purple-800 sticky top-0 z-40 shadow-sm transition-all duration-300 backdrop-blur-sm"
      data-testid="horizontal-timeline"
    >
      {/* Header Row - Full metadata and actions */}
      <div className="border-b border-purple-200 dark:border-purple-700/50 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Quick Links */}
          <div className="flex items-center gap-3">
            {jdAttachmentId && onViewJd && (
              <button
                onClick={onViewJd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                title="View JD"
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
                title="View Posting"
              >
                <ExternalLink size={14} />
                View Posting
              </a>
            )}
          </div>

          {/* Right: Metadata + Action Buttons */}
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            {createdAt && (
              <div title={formatDateTime(createdAt)}>
                <span className="font-medium">Created:</span> {formatDateTime(createdAt)}
              </div>
            )}
            {updatedAt && (
              <div title={formatDateTime(updatedAt)}>
                <span className="font-medium">Updated:</span> {formatDateTime(updatedAt)}
              </div>
            )}

            {/* Delta Chip */}
            {delta && (
              <div 
                className={`px-2.5 py-1 rounded-full font-semibold ${
                  delta.isStale
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                }`}
                title={`In current status for ${delta.days} days`}
              >
                {delta.label}
              </div>
            )}

            {/* Stale Badge */}
            {delta && delta.isStale && (
              <div className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-[10px] font-bold">
                ⏳ STALE
              </div>
            )}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            {/* User Profile Button */}
            <button
              onClick={() => {
                alert('User Profile - Coming soon!');
              }}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="View User Profile"
            >
              <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => {
                  const newTheme = isDark ? 'light' : 'dark';
                  setTheme(newTheme);
                }}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            {/* Collapse Button */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded transition-colors"
              title="Collapse timeline"
              aria-label="Collapse timeline"
            >
              <ChevronUp className="text-purple-600 dark:text-purple-400" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Row */}
      <div className="overflow-x-auto">
        <div className="flex items-center min-w-max px-6 py-4">
        {ORDERED_STATUSES.map((status, index) => {
          const isActive = status === currentStatus;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;
          const journey = JOURNEY_MAPPING[status];

          return (
            <div
              key={status}
              className="flex items-center"
              data-testid={`timeline-${status}`}
            >
              {/* Status Node */}
              <button
                onClick={() => onStatusClick?.(status)}
                onKeyDown={(e) => handleKeyDown(e, status)}
                className={`flex flex-col items-center min-w-[120px] px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                  isActive
                    ? "bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 ring-2 ring-purple-500"
                    : isPast
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30"
                    : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }`}
                aria-label={`${STATUS_LABELS[status]} ${isActive ? "(current)" : ""}`}
                data-current={isActive}
                tabIndex={0}
              >
                {/* Status Indicator */}
                <div
                  className={`w-3 h-3 rounded-full mb-2 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"
                      : isPast
                      ? "bg-gradient-to-r from-green-600 to-emerald-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />

                {/* Label */}
                <div
                  className={`text-xs font-semibold ${
                    isActive
                      ? "text-blue-900 dark:text-blue-200"
                      : isPast
                      ? "text-green-900 dark:text-green-300"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {STATUS_LABELS[status]}
                  {isActive && currentStatusDelta && (
                    <span className="ml-1 px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded text-[10px] font-bold">
                      {currentStatusDelta}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className={`text-[10px] text-center mt-1 leading-tight ${
                  isActive 
                    ? "text-gray-700 dark:text-gray-300" 
                    : "text-gray-500 dark:text-gray-500"
                }`}>
                  {journey.description}
                </div>

                {/* Interviewer indicator */}
                {journey.allowsMultipleInterviewers && (
                  <div className="text-[9px] text-purple-600 dark:text-purple-400 mt-1">
                    👥 Multi-interviewer
                  </div>
                )}
              </button>

              {/* Connector */}
              {index < ORDERED_STATUSES.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${
                    index < currentIndex 
                      ? "bg-gradient-to-r from-green-400 to-emerald-400" 
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Scrollable hint */}
      <div className="md:hidden text-xs text-gray-500 dark:text-gray-400 text-center pb-2">
        ← Scroll to see all stages →
      </div>
      </div>

      {/* Global Settings Modal */}
      <GlobalSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

