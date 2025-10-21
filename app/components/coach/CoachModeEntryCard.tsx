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
    <div className={`bg-gradient-to-br ${config.bg} rounded-xl p-5 text-white shadow-lg relative overflow-hidden`} data-testid="coach-mode-entry-card">
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      
      {/* Header with Score Badge */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Resume Coach</h3>
            <p className="text-white/70 text-xs">Pre-Application Optimization</p>
          </div>
        </div>
        
        {/* Score Badge - Eye-catching */}
        <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/30">
          <div className="text-2xl font-black leading-none">{scorePercent}%</div>
          <div className="text-[10px] text-white/80 font-medium">Current</div>
        </div>
      </div>

      {/* Compact Description */}
      <p className="text-white/90 text-sm mb-4 leading-snug">
        Build extended profile, generate ATS-optimized resume, and boost your match score
      </p>

      {/* Compact Feature List - Single Row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1 text-xs bg-white/10 rounded-full px-2 py-1">
          <CheckCircle2 size={12} className="flex-shrink-0" />
          <span>Discovery</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-white/10 rounded-full px-2 py-1">
          <CheckCircle2 size={12} className="flex-shrink-0" />
          <span>Score Boost</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-white/10 rounded-full px-2 py-1">
          <CheckCircle2 size={12} className="flex-shrink-0" />
          <span>Resume Gen</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-white/10 rounded-full px-2 py-1">
          <CheckCircle2 size={12} className="flex-shrink-0" />
          <span>Cover Letter</span>
        </div>
      </div>

      {/* Compact CTA Button */}
      <button
        onClick={() => router.push(`/coach/${jobId}`)}
        data-testid="enter-coach-mode"
        className="w-full px-4 py-2.5 bg-white text-purple-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all shadow-md flex items-center justify-center gap-2 group"
      >
        <Sparkles size={18} className="group-hover:scale-110 transition-transform" />
        <span>Start Resume Coach</span>
        <span className="text-lg">→</span>
      </button>
    </div>
  );
}

