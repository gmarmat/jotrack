'use client';

import { Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AnalyzeButtonProps {
  onAnalyze: () => void | Promise<void>;
  isAnalyzing: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  estimatedCost?: number;  // e.g., 0.025 = $0.025
  estimatedSeconds?: number;  // e.g., 30 seconds
}

export default function AnalyzeButton({ 
  onAnalyze, 
  isAnalyzing, 
  disabled = false,
  className = '',
  label = 'Analyze with AI',
  estimatedCost = 0.02,
  estimatedSeconds = 25
}: AnalyzeButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Reset timer when analysis starts/stops
  useEffect(() => {
    if (isAnalyzing) {
      setStartTime(Date.now());
      setElapsedSeconds(0);
    } else {
      setStartTime(null);
      setElapsedSeconds(0);
    }
  }, [isAnalyzing]);

  // Countdown timer
  useEffect(() => {
    if (!isAnalyzing || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 100); // Update every 100ms for smooth progress

    return () => clearInterval(interval);
  }, [isAnalyzing, startTime]);

  // Calculate progress (0-100)
  const progress = isAnalyzing 
    ? Math.min((elapsedSeconds / estimatedSeconds) * 100, 95) // Cap at 95% until complete
    : 0;

  // Remaining time
  const remainingSeconds = Math.max(0, estimatedSeconds - elapsedSeconds);
  const isOverEstimate = elapsedSeconds > estimatedSeconds;

  // Format cost for display
  const costDisplay = estimatedCost >= 0.01 
    ? `$${estimatedCost.toFixed(2)}` 
    : `${(estimatedCost * 100).toFixed(1)}¢`;

  return (
    <button
      onClick={onAnalyze}
      disabled={disabled || isAnalyzing}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isAnalyzing ? `Analyzing... (~${estimatedSeconds}s)` : `${label} (${costDisplay})`}
      data-testid="analyze-button"
    >
      {/* Circular Progress Ring (SVG) */}
      {isAnalyzing && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 36 36"
          style={{ overflow: 'visible' }}
        >
          {/* Background ring */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="2"
          />
          {/* Progress ring */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke={isOverEstimate ? "rgba(251, 191, 36, 0.8)" : "rgba(255, 255, 255, 0.9)"}
            strokeWidth="2"
            strokeDasharray="100.53"
            strokeDashoffset={100.53 - (progress * 100.53) / 100}
            strokeLinecap="round"
            className={isOverEstimate ? "animate-pulse" : "transition-all duration-300"}
          />
        </svg>
      )}

      {/* Button Content */}
      <div className="relative z-10 flex items-center justify-center">
        {isAnalyzing ? (
          // Active State: Show countdown
          <span className="text-xs font-semibold tabular-nums">
            {isOverEstimate ? '...' : `${remainingSeconds}s`}
          </span>
        ) : isHovered ? (
          // Hover State: Show cost
          <span className="text-xs font-semibold">
            {costDisplay}
          </span>
        ) : (
          // Idle State: Show icon
          <Sparkles className="w-4 h-4" />
        )}
      </div>
    </button>
  );
}

