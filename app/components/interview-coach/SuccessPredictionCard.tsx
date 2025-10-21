'use client';

import { SuccessPrediction } from '@/lib/interview/successPrediction';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target } from 'lucide-react';

interface SuccessPredictionCardProps {
  prediction: SuccessPrediction;
}

export function SuccessPredictionCard({ prediction }: SuccessPredictionCardProps) {
  const getColorClasses = (category: string) => {
    switch (category) {
      case 'very-high':
        return {
          bg: 'from-green-500 to-emerald-500',
          text: 'text-green-600',
          bgLight: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-500'
        };
      case 'high':
        return {
          bg: 'from-blue-500 to-cyan-500',
          text: 'text-blue-600',
          bgLight: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-500'
        };
      case 'medium':
        return {
          bg: 'from-yellow-500 to-orange-500',
          text: 'text-yellow-600',
          bgLight: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-500'
        };
      default:
        return {
          bg: 'from-red-500 to-pink-500',
          text: 'text-red-600',
          bgLight: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-500'
        };
    }
  };
  
  const colors = getColorClasses(prediction.category);
  
  return (
    <div className={`${colors.bgLight} border-2 ${colors.border} rounded-2xl p-6 mb-6 dark:bg-gray-800/50 dark:border-gray-700`}>
      {/* Header with Big Number */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative">
          <div className={`text-7xl font-black ${colors.text} flex items-baseline`}>
            {prediction.overallProbability}
            <span className="text-3xl ml-1">%</span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
            ±{prediction.confidenceInterval[1] - prediction.overallProbability}%
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Target className={`w-6 h-6 ${colors.icon}`} />
            Interview Success Probability
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Based on 15 signals: profile match, answer quality, interviewer insights, and more
          </p>
          <div className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full ${colors.bgLight} ${colors.border} border`}>
            <span className={`text-sm font-semibold ${colors.text} uppercase`}>
              {prediction.category.replace('-', ' ')} CONFIDENCE
            </span>
          </div>
        </div>
      </div>
      
      {/* Confidence Interval Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Worst Case</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">Predicted Range</span>
          <span>Best Case</span>
        </div>
        <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`absolute h-full bg-gradient-to-r ${colors.bg} opacity-20`}
            style={{
              left: `${prediction.confidenceInterval[0]}%`,
              width: `${prediction.confidenceInterval[1] - prediction.confidenceInterval[0]}%`
            }}
          />
          <div 
            className={`absolute top-0 bottom-0 w-1 bg-gradient-to-r ${colors.bg}`}
            style={{ left: `${prediction.overallProbability}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium text-gray-700 dark:text-gray-300">
            <span>{prediction.confidenceInterval[0]}%</span>
            <span>{prediction.confidenceInterval[1]}%</span>
          </div>
        </div>
      </div>
      
      {/* Breakdown (Expandable) */}
      <details className="group mb-6">
        <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
          <span className="transform group-open:rotate-90 transition-transform">▶</span>
          View detailed breakdown
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {Object.entries(prediction.breakdown).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className={`font-semibold ${
                value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {value > 0 ? '+' : ''}{value}
              </span>
            </div>
          ))}
        </div>
      </details>
      
      {/* Strengths */}
      {prediction.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Key Strengths
          </h4>
          <ul className="space-y-1">
            {prediction.strengths.map((strength, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Risks */}
      {prediction.risks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Risks to Mitigate
          </h4>
          <ul className="space-y-1">
            {prediction.risks.map((risk, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">⚠</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Recommendations */}
      <div className={`bg-white dark:bg-gray-900 border ${colors.border} rounded-xl p-4`}>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
          <TrendingUp className={`w-5 h-5 ${colors.icon}`} />
          Top Recommendations to Improve Your Odds
        </h4>
        <ul className="space-y-2">
          {prediction.recommendations.map((rec, i) => (
            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3">
              <span className={`font-bold ${colors.text}`}>{i + 1}.</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Compact success probability badge
 */
interface SuccessProbabilityBadgeProps {
  probability: number;
  size?: 'sm' | 'md' | 'lg';
}

export function SuccessProbabilityBadge({ probability, size = 'md' }: SuccessProbabilityBadgeProps) {
  const color = probability >= 75 
    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300'
    : probability >= 60
      ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
      : probability >= 40
        ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
        : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };
  
  return (
    <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} rounded-full border ${color} font-semibold`}>
      <Target className="w-4 h-4" />
      {probability}% Success Probability
    </div>
  );
}

