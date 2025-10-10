"use client";

import { JobStatus, ORDERED_STATUSES, STATUS_LABELS } from "@/lib/status";
import { JOURNEY_MAPPING } from "@/lib/statusJourney";

interface HorizontalTimelineProps {
  currentStatus: JobStatus;
  onStatusClick?: (status: JobStatus) => void;
  currentStatusDelta?: string; // e.g., "6d"
}

export default function HorizontalTimeline({
  currentStatus,
  onStatusClick,
  currentStatusDelta,
}: HorizontalTimelineProps) {
  const currentIndex = ORDERED_STATUSES.indexOf(currentStatus);

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

  return (
    <div 
      className="bg-white border-b border-gray-200 overflow-x-auto sticky top-0 z-40 shadow-sm"
      data-testid="horizontal-timeline"
    >
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
                className={`flex flex-col items-center min-w-[120px] px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  isActive
                    ? "bg-blue-100 ring-2 ring-blue-500"
                    : isPast
                    ? "bg-green-50 hover:bg-green-100"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                aria-label={`${STATUS_LABELS[status]} ${isActive ? "(current)" : ""}`}
                data-current={isActive}
                tabIndex={0}
              >
                {/* Status Indicator */}
                <div
                  className={`w-3 h-3 rounded-full mb-2 ${
                    isActive
                      ? "bg-blue-600"
                      : isPast
                      ? "bg-green-600"
                      : "bg-gray-300"
                  }`}
                />

                {/* Label */}
                <div
                  className={`text-xs font-semibold ${
                    isActive
                      ? "text-blue-900"
                      : isPast
                      ? "text-green-900"
                      : "text-gray-600"
                  }`}
                >
                  {STATUS_LABELS[status]}
                  {isActive && currentStatusDelta && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                      {currentStatusDelta}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="text-[10px] text-gray-500 text-center mt-1 leading-tight">
                  {journey.description}
                </div>

                {/* Interviewer indicator */}
                {journey.allowsMultipleInterviewers && (
                  <div className="text-[9px] text-blue-600 mt-1">
                    👥 Multi-interviewer
                  </div>
                )}
              </button>

              {/* Connector */}
              {index < ORDERED_STATUSES.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${
                    index < currentIndex ? "bg-green-400" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Scrollable hint */}
      <div className="md:hidden text-xs text-gray-500 text-center pb-2">
        ← Scroll to see all stages →
      </div>
    </div>
  );
}

