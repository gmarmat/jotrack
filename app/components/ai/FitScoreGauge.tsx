'use client';

interface FitScoreGaugeProps {
  score: number; // 0-1 or 0-100
  threshold?: number;
  size?: number;
}

export default function FitScoreGauge({ score, threshold = 0.75, size = 120 }: FitScoreGaugeProps) {
  // Normalize score to 0-1 range
  const normalizedScore = score > 1 ? score / 100 : score;
  const percentage = Math.round(normalizedScore * 100);
  
  // Calculate stroke dash offset for circular progress
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore * circumference);
  
  // Color based on threshold
  const getColor = () => {
    if (normalizedScore >= threshold) return '#10b981'; // green
    if (normalizedScore >= threshold * 0.7) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="flex flex-col items-center" data-testid="fit-score-gauge">
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
          stroke={getColor()}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: size / 2 - 30 }}>
        <div className="text-3xl font-bold" style={{ color: getColor() }}>
          {percentage}
        </div>
        <div className="text-xs text-gray-500">Match Score</div>
      </div>
    </div>
  );
}
