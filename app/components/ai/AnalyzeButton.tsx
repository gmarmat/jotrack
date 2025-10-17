'use client';

import { Sparkles, Check } from 'lucide-react';
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
  const [isCompleting, setIsCompleting] = useState(false); // Rapid completion animation
  const [showSuccess, setShowSuccess] = useState(false); // Brief success state

  // Reset timer when analysis starts/stops
  useEffect(() => {
    if (isAnalyzing) {
      setStartTime(Date.now());
      setElapsedSeconds(0);
      setIsCompleting(false);
      setShowSuccess(false);
    } else if (!isAnalyzing && startTime) {
      // Analysis finished - trigger completion animation
      const finalElapsed = Math.floor((Date.now() - startTime) / 1000);
      
      if (finalElapsed < estimatedSeconds) {
        // Finished early - speed up to completion
        setIsCompleting(true);
        
        // Rapid countdown to 0
        const remainingTime = estimatedSeconds - finalElapsed;
        const speedUpDuration = 500; // 500ms to reach 0
        const steps = Math.ceil(remainingTime);
        const stepDuration = speedUpDuration / steps;
        
        let currentStep = 0;
        const speedUpInterval = setInterval(() => {
          currentStep++;
          setElapsedSeconds(finalElapsed + currentStep);
          
          if (currentStep >= steps) {
            clearInterval(speedUpInterval);
            setIsCompleting(false);
            setShowSuccess(true);
            
            // Show success checkmark briefly
            setTimeout(() => {
              setShowSuccess(false);
              setStartTime(null);
              setElapsedSeconds(0);
            }, 300); // 300ms success state
          }
        }, stepDuration);
      } else {
        // Took longer than estimate - just show success
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setStartTime(null);
          setElapsedSeconds(0);
        }, 300);
      }
    }
  }, [isAnalyzing, startTime, estimatedSeconds]);

  // Countdown timer (normal speed)
  useEffect(() => {
    if (!isAnalyzing || !startTime || isCompleting) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 100); // Update every 100ms for smooth progress

    return () => clearInterval(interval);
  }, [isAnalyzing, startTime, isCompleting]);

  // Calculate progress (0-100)
  const progress = (isAnalyzing || isCompleting || showSuccess)
    ? Math.min((elapsedSeconds / estimatedSeconds) * 100, showSuccess ? 100 : 95) // 100% on success
    : 0;

  // Remaining time
  const remainingSeconds = Math.max(0, estimatedSeconds - elapsedSeconds);
  const isOverEstimate = elapsedSeconds > estimatedSeconds && !isCompleting;

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
      {(isAnalyzing || isCompleting || showSuccess) && (
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
            stroke={
              showSuccess 
                ? "rgba(34, 197, 94, 0.9)" // Green on success
                : isOverEstimate 
                  ? "rgba(251, 191, 36, 0.8)" // Amber if overtime
                  : "rgba(255, 255, 255, 0.9)" // White normally
            }
            strokeWidth="2"
            strokeDasharray="100.53"
            strokeDashoffset={100.53 - (progress * 100.53) / 100}
            strokeLinecap="round"
            className={
              showSuccess 
                ? "transition-all duration-200" // Fast transition on success
                : isCompleting 
                  ? "transition-all duration-100" // Fast during speedup
                  : isOverEstimate 
                    ? "animate-pulse" // Pulse when overtime
                    : "transition-all duration-300" // Normal smooth
            }
          />
        </svg>
      )}

      {/* Button Content */}
      <div className="relative z-10 flex items-center justify-center">
        {showSuccess ? (
          // Success State: Show checkmark
          <Check className="w-4 h-4 text-green-400 animate-in fade-in zoom-in duration-200" />
        ) : (isAnalyzing || isCompleting) ? (
          // Active/Completing State: Show countdown
          <span className={`text-xs font-semibold tabular-nums ${isCompleting ? 'text-green-300' : ''}`}>
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

