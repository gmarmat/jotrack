'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Target, CheckCircle2 } from 'lucide-react';

interface CoachModeEntryCardProps {
  jobId: string;
  matchScore?: number;  // 0.0 - 1.0
  coachStatus?: string;
  hasBasicAnalysis?: boolean; // NEW: Has matchScore OR companyIntel
}

export default function CoachModeEntryCard({ jobId, matchScore = 0, coachStatus = 'not_started', hasBasicAnalysis = true }: CoachModeEntryCardProps) {
  const router = useRouter();
  
  const scorePercent = Math.round(matchScore * 100);
  
  // NEW: Show disabled state if no basic analysis yet (per TERMINOLOGY_GUIDE)
  if (!hasBasicAnalysis) {
    return (
      <div 
        className="mb-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 opacity-60" 
        data-testid="coach-mode-entry-card-disabled"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-1">
              Resume Coach
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Run Match Score or Company Intelligence analysis first to unlock
            </p>
          </div>
          <button 
            disabled 
            className="px-6 py-2 bg-gray-300 dark:bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed font-semibold"
          >
            Locked
          </button>
        </div>
      </div>
    );
  }
  
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
      text: 'Score Low ({scorePercent}%) - Resume Coach can help bridge gaps',
      icon: Target,
    },
    medium: {
      bg: 'from-yellow-500 to-amber-500',
      text: 'Score Medium ({scorePercent}%) - Resume Coach can optimize your application',
      icon: TrendingUp,
    },
    high: {
      bg: 'from-green-500 to-emerald-500',
      text: 'Score High ({scorePercent}%) - Resume Coach will polish final details',
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
    <div className={`bg-gradient-to-br ${config.bg} rounded-2xl p-8 text-white shadow-xl`} data-testid="coach-mode-entry-card">
      {/* Header with Score Badge */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Icon size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Resume Coach</h3>
              <p className="text-white/80 text-sm">Pre-Application Optimization</p>
            </div>
          </div>
          <p className="text-white/90 text-base mb-4 leading-relaxed">
            Build your extended profile, generate ATS-optimized resume, and improve your match score from <span className="font-bold text-white">{scorePercent}%</span>
          </p>
        </div>
      </div>

      {/* Feature List */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>Discovery Questions</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>Score Improvement</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>Resume Generator</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>Cover Letter</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => router.push(`/coach/${jobId}`)}
        data-testid="enter-coach-mode"
        className="w-full px-6 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center gap-3 group"
      >
        <Sparkles size={24} className="group-hover:scale-110 transition-transform" />
        <span>Start Resume Coach</span>
        <span className="text-2xl">→</span>
      </button>
    </div>
  );
}

