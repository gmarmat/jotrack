'use client';

import { SignalConfidence, OverallConfidence } from '@/lib/interview/confidenceScoring';

interface ConfidenceScoreCardProps {
  overall: OverallConfidence;
}

export function ConfidenceScoreCard({ overall }: ConfidenceScoreCardProps) {
  const getColorClasses = (confidence: number) => {
    if (confidence >= 80) return {
      bg: 'bg-green-500',
      text: 'text-green-600',
      bgLight: 'bg-green-50',
      border: 'border-green-200'
    };
    if (confidence >= 60) return {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600',
      bgLight: 'bg-yellow-50',
      border: 'border-yellow-200'
    };
    return {
      bg: 'bg-red-500',
      text: 'text-red-600',
      bgLight: 'bg-red-50',
      border: 'border-red-200'
    };
  };
  
  const overallColors = getColorClasses(overall.score);
  
  return (
    <div className={`${overallColors.bgLight} border ${overallColors.border} rounded-xl p-6 mb-6 dark:bg-gray-800/50 dark:border-gray-700`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`text-5xl font-bold ${overallColors.text}`}>
          {overall.score}%
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Preparation Confidence
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Based on {overall.signals.length} data {overall.signals.length === 1 ? 'source' : 'sources'}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg ${overallColors.bgLight} ${overallColors.border} border-2`}>
          <p className={`text-sm font-semibold ${overallColors.text}`}>
            {overall.category.toUpperCase()}
          </p>
        </div>
      </div>
      
      {/* Signal Breakdown */}
      <div className="space-y-3 mb-6">
        {overall.signals.map(signal => {
          const colors = getColorClasses(signal.confidence);
          
          return (
            <div key={signal.signal} className="flex items-center gap-3">
              {/* Signal Name */}
              <div className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {signal.signal}
              </div>
              
              {/* Progress Bar */}
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colors.bg} transition-all duration-500`}
                  style={{ width: `${signal.confidence}%` }}
                />
              </div>
              
              {/* Percentage */}
              <div className={`text-sm font-semibold ${colors.text} w-12 text-right`}>
                {signal.confidence}%
              </div>
              
              {/* Impact Badge */}
              <div className={`text-xs px-2 py-1 rounded ${
                signal.impact === 'high' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                signal.impact === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {signal.impact}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Detailed Reasons (Expandable) */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
          <span className="transform group-open:rotate-90 transition-transform">▶</span>
          View detailed breakdown
        </summary>
        <div className="mt-3 space-y-2 pl-6">
          {overall.signals.map(signal => (
            <div key={signal.signal} className="text-xs space-y-1">
              <p className="font-medium text-gray-900 dark:text-white">{signal.signal}</p>
              <p className="text-gray-600 dark:text-gray-400">{signal.reason}</p>
              {signal.sources && (
                <p className="text-gray-500 dark:text-gray-500">
                  Sources: {signal.sources}
                </p>
              )}
              {signal.breakdown && (
                <div className="flex gap-3 mt-1">
                  {signal.breakdown.linkedin && (
                    <span className="text-purple-600 dark:text-purple-400">
                      LinkedIn: {signal.breakdown.linkedin}%
                    </span>
                  )}
                  {signal.breakdown.webValidation && (
                    <span className="text-green-600 dark:text-green-400">
                      Web: +{signal.breakdown.webValidation}%
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </details>
      
      {/* Recommendation */}
      {overall.recommendation && (
        <div className={`mt-4 ${
          overall.category === 'low' 
            ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' 
            : overall.category === 'medium'
              ? 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
              : 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
        } rounded-lg p-3`}>
          <p className={`text-sm ${
            overall.category === 'low' ? 'text-yellow-800 dark:text-yellow-200' :
            overall.category === 'medium' ? 'text-blue-800 dark:text-blue-200' :
            'text-green-800 dark:text-green-200'
          }`}>
            {overall.category === 'low' ? '⚠️' : overall.category === 'medium' ? '💡' : '✅'} {overall.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact confidence badge (reusable)
 */
interface ConfidenceBadgeProps {
  confidence: number;
  validatedBy?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceBadge({ confidence, validatedBy, size = 'md' }: ConfidenceBadgeProps) {
  const colors = confidence >= 80 
    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
    : confidence >= 60
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
      : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };
  
  return (
    <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} rounded-full border ${colors}`}>
      <span className="font-medium">{confidence}% Confidence</span>
      {validatedBy && (
        <span className="opacity-75 text-xs">({validatedBy})</span>
      )}
    </div>
  );
}

