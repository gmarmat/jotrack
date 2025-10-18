'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Target, CheckCircle2 } from 'lucide-react';

interface CoachModeEntryCardProps {
  jobId: string;
  matchScore?: number;  // 0.0 - 1.0
  coachStatus?: string;
}

export default function CoachModeEntryCard({ jobId, matchScore = 0, coachStatus = 'not_started' }: CoachModeEntryCardProps) {
  const router = useRouter();
  
  const scorePercent = Math.round(matchScore * 100);
  
  const getScoreTier = (score: number) => {
    const percent = score * 100;
    if (percent >= 80) return 'high';
    if (percent >= 60) return 'medium';
    return 'low';
  };

  const tier = getScoreTier(matchScore);

  const tierConfig = {
    low: {
      bg: 'from-red-500 to-orange-500',
      text: 'Score Low ({scorePercent}%) - Coach Mode can help bridge gaps',
      icon: Target,
    },
    medium: {
      bg: 'from-yellow-500 to-amber-500',
      text: 'Score Medium ({scorePercent}%) - Coach Mode can optimize your application',
      icon: TrendingUp,
    },
    high: {
      bg: 'from-green-500 to-emerald-500',
      text: 'Score High ({scorePercent}%) - Coach Mode will polish final details',
      icon: CheckCircle2,
    },
  };

  const config = tierConfig[tier];
  const Icon = config.icon;

  if (coachStatus === 'applied' || coachStatus === 'interview-prep') {
    return (
      <div className="mb-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg" data-testid="coach-mode-entry-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">
                Application Submitted!
              </h3>
              <p className="text-purple-100">
                Access your interview prep materials and practice questions
              </p>
            </div>
          </div>
          
          <button
            onClick={() => router.push(`/coach/${jobId}`)}
            data-testid="continue-interview-prep"
            className="px-8 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-md"
          >
            Continue Interview Prep →
          </button>
        </div>
      </div>
    );
  }

  if (!matchScore || matchScore === 0) {
    return (
      <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-6" data-testid="coach-mode-entry-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Sparkles size={32} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                Ready for Coach Mode?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Run Match Score analysis first to see how Coach Mode can help you
              </p>
            </div>
          </div>
          
          <button
            onClick={() => router.push(`/coach/${jobId}`)}
            data-testid="enter-coach-mode-preview"
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Preview Coach Mode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-8 bg-gradient-to-r ${config.bg} rounded-2xl p-6 text-white shadow-lg`} data-testid="coach-mode-entry-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Icon size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">
              {config.text.replace('{scorePercent}', scorePercent.toString())}
            </h3>
            <p className="text-white/90 text-sm">
              Build your extended profile, generate ATS-optimized resume, and prep for interviews
            </p>
          </div>
        </div>
        
        <button
          onClick={() => router.push(`/coach/${jobId}`)}
          data-testid="enter-coach-mode"
          className="px-8 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-md flex items-center gap-2"
        >
          <Sparkles size={20} />
          Enter Coach Mode
        </button>
      </div>

      {/* Quick Preview of What's Inside */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span>Discovery Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span>Score Improvement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span>Resume Generator</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span>Interview Prep</span>
          </div>
        </div>
      </div>
    </div>
  );
}

