'use client';

import { getMatchScoreCategory } from '@/lib/matchScoreCategories';

interface MatchScoreGaugeProps {
  score: number; // 0-1 or 0-100
  size?: number;
  showInsights?: boolean;
}

export default function MatchScoreGauge({ score, size = 120, showInsights = false }: MatchScoreGaugeProps) {
  // Normalize score to 0-1 range
  const normalizedScore = score > 1 ? score / 100 : score;
  const percentage = Math.round(normalizedScore * 100);
  
  // Get category info
  const categoryInfo = getMatchScoreCategory(percentage);
  
  // Calculate stroke dash offset for circular progress
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore * circumference);

  return (
    <div className="flex flex-col items-center" data-testid="match-score-gauge">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={categoryInfo.color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold" style={{ color: categoryInfo.color }}>
            {percentage}
          </div>
          <div className="text-xs text-gray-500">Match Score</div>
        </div>
      </div>
      
      {/* Category Badge */}
      <div className={`mt-3 px-3 py-1 rounded-full text-sm font-medium ${categoryInfo.bgColor} ${categoryInfo.textColor}`}>
        {categoryInfo.emoji} {categoryInfo.label}
      </div>
      
      {showInsights && (
        <div className="mt-4 text-sm text-gray-600 text-center max-w-xs">
          <p className="italic">&quot;{categoryInfo.description}&quot;</p>
        </div>
      )}
    </div>
  );
}
