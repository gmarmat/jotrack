"use client";

import { useState, useEffect } from 'react';
import { JobStatus, ORDERED_STATUSES, STATUS_LABELS } from "@/lib/status";
import { JOURNEY_MAPPING } from "@/lib/statusJourney";
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleHorizontalTimelineProps {
  currentStatus: JobStatus;
  onStatusClick?: (status: JobStatus) => void;
  currentStatusDelta?: string; // e.g., "6d"
}

export default function CollapsibleHorizontalTimeline({
  currentStatus,
  onStatusClick,
  currentStatusDelta,
}: CollapsibleHorizontalTimelineProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentIndex = ORDERED_STATUSES.indexOf(currentStatus);

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

  // Compact version (collapsed)
  if (isCollapsed) {
    return (
      <div 
        className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950/65 dark:to-blue-950/65 border-b border-purple-200 dark:border-purple-800 sticky top-0 z-40 shadow-md transition-all duration-300 backdrop-blur-sm"
        data-testid="horizontal-timeline-compact"
      >
        <div className="flex items-center justify-between px-6 py-2">
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
                    className={`w-8 h-1.5 rounded-full transition-all ${
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

          {/* Expand Button */}
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded-lg transition-colors"
            title="Expand timeline"
            aria-label="Expand timeline"
          >
            <ChevronDown className="text-purple-600 dark:text-purple-400" size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Full version (expanded)
  return (
    <div 
      className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/65 dark:to-blue-950/65 border-b border-purple-200 dark:border-purple-800 overflow-x-auto sticky top-0 z-40 shadow-sm transition-all duration-300 backdrop-blur-sm"
      data-testid="horizontal-timeline"
    >
      {/* Collapse Button */}
      <div className="flex justify-end px-6 pt-2">
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded transition-colors"
          title="Collapse timeline"
          aria-label="Collapse timeline"
        >
          <ChevronUp className="text-purple-600 dark:text-purple-400" size={16} />
        </button>
      </div>

      <div className="flex items-center min-w-max px-6 pb-4">
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
  );
}

