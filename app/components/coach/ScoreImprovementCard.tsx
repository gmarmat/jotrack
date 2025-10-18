'use client';

import { TrendingUp, Award } from 'lucide-react';
import MatchScoreGauge from '../ai/MatchScoreGauge';

interface ScoreImprovementCardProps {
  scoreBefore: number;  // 0.0 - 1.0
  scoreAfter: number;   // 0.0 - 1.0
  improvement: number;  // 0.0 - 1.0
  fromResume: number;   // 0.0 - 1.0
  fromProfile: number;  // 0.0 - 1.0
}

export default function ScoreImprovementCard({ 
  scoreBefore, 
  scoreAfter, 
  improvement,
  fromResume,
  fromProfile 
}: ScoreImprovementCardProps) {
  const beforePercent = Math.round(scoreBefore * 100);
  const afterPercent = Math.round(scoreAfter * 100);
  const improvementPercent = Math.round(improvement * 100);
  const profileContribution = Math.round(fromProfile * 100);

  const getCategoryColor = (score: number) => {
    const percent = score * 100;
    if (percent >= 80) return 'green';
    if (percent >= 60) return 'yellow';
    return 'red';
  };

  const beforeColor = getCategoryColor(scoreBefore);
  const afterColor = getCategoryColor(scoreAfter);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Score Improvement Tracker
        </h3>
      </div>

      {/* Before/After Comparison */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Before (Resume Only) */}
        <div className={`bg-${beforeColor}-50 dark:bg-${beforeColor}-900/20 border-2 border-${beforeColor}-200 dark:border-${beforeColor}-800 rounded-lg p-4`}>
          <div className="text-center mb-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Initial Score
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">Resume Only</p>
          </div>
          
          <div className="flex items-center justify-center">
            <MatchScoreGauge score={scoreBefore} size={120} showInsights={false} />
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {beforePercent}% match
            </p>
          </div>
        </div>

        {/* After (Resume + Profile) */}
        <div className={`bg-${afterColor}-50 dark:bg-${afterColor}-900/20 border-2 border-${afterColor}-200 dark:border-${afterColor}-800 rounded-lg p-4`}>
          <div className="text-center mb-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Improved Score
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">Resume + Extended Profile</p>
          </div>
          
          <div className="flex items-center justify-center">
            <MatchScoreGauge score={scoreAfter} size={120} showInsights={false} />
          </div>
          
          <div className="mt-3 text-center space-y-1">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Resume: {beforePercent}% + Profile: {profileContribution}%
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
              = {afterPercent}% total
            </p>
          </div>
        </div>
      </div>

      {/* Improvement Highlight */}
      {improvement > 0 && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8" />
              <div>
                <p className="text-lg font-bold">
                  +{improvementPercent} Points!
                </p>
                <p className="text-sm opacity-90">
                  Your extended profile bridged key gaps
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-3xl font-bold">{afterPercent}%</p>
              <p className="text-xs opacity-75">New Match Score</p>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown */}
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Score Breakdown
        </h5>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">Resume contribution:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{beforePercent}%</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">Profile contribution:</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">+{profileContribution}%</span>
          </div>
          
          <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Total match score:</span>
            <span className="font-bold text-lg text-purple-600 dark:text-purple-400">{afterPercent}%</span>
          </div>
        </div>
      </div>

      {/* Next Steps Hint */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>💡 Next Step:</strong> Generate an ATS-optimized resume that incorporates your extended profile data!
        </p>
      </div>
    </div>
  );
}

