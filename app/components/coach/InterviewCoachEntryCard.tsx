'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, TrendingUp, CheckCircle2, Users, MessageSquare, FileText, Brain } from 'lucide-react';

interface InterviewCoachEntryCardProps {
  jobId: string;
  currentStatus: string;
  hasMatchScore: boolean;
  hasSkillsAnalysis: boolean;
}

export default function InterviewCoachEntryCard({ 
  jobId, 
  currentStatus, 
  hasMatchScore, 
  hasSkillsAnalysis 
}: InterviewCoachEntryCardProps) {
  const router = useRouter();
  
  const hasPrerequisites = hasMatchScore && hasSkillsAnalysis;
  const isPostApplication = currentStatus !== 'ON_RADAR';
  const isAvailable = hasPrerequisites && isPostApplication;
  
  // Show disabled state if prerequisites not met
  if (!hasPrerequisites) {
    return (
      <div 
        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-xl p-5 border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-lg relative overflow-hidden" 
        data-testid="interview-coach-entry-card-disabled"
      >
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-24 h-24 border-2 border-gray-200 dark:border-gray-700 rounded-full -translate-y-8 translate-x-8 opacity-20" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg">
              <Brain size={22} className="text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">Interview Coach</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Post-Application Preparation</p>
            </div>
          </div>
          
          {/* Locked Badge */}
          <div className="flex flex-col items-center bg-gray-200 dark:bg-gray-700 rounded-xl px-3 py-2 border border-gray-300 dark:border-gray-600">
            <div className="text-xl font-black leading-none">🔒</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Locked</div>
          </div>
        </div>

        {/* Compact Teaser Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-snug">
          Master interviews with AI prep. Real questions, answer scoring, and STAR talk tracks.
        </p>

        {/* Compact Prerequisites */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mb-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Unlock Requirements:
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              {hasMatchScore ? (
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 border-2 border-gray-300 dark:border-gray-600 rounded flex-shrink-0" />
              )}
              <span className={hasMatchScore ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                Match Score
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {hasSkillsAnalysis ? (
                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 border-2 border-gray-300 dark:border-gray-600 rounded flex-shrink-0" />
              )}
              <span className={hasSkillsAnalysis ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                Skills Match
              </span>
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-1">
            <MessageSquare size={12} />
            <span>Real Questions</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-1">
            <Brain size={12} />
            <span>AI Scoring</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-1">
            <FileText size={12} />
            <span>Talk Tracks</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-1">
            <Target size={12} />
            <span>Core Stories</span>
          </div>
        </div>

        {/* Compact Locked Button */}
        <button 
          disabled 
          className="w-full px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="text-lg">🔒</span>
          <span>Complete Prerequisites to Unlock</span>
        </button>
      </div>
    );
  }
  
  // Show waiting state if prerequisites met but not post-application
  if (!isPostApplication) {
    return (
      <div 
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-5 border-2 border-blue-300 dark:border-blue-700 shadow-lg relative overflow-hidden" 
        data-testid="interview-coach-entry-card-waiting"
      >
        {/* Decorative Background Element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 dark:bg-blue-800 rounded-full -translate-y-8 translate-x-8 opacity-20" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <Brain size={22} className="text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Interview Coach</h3>
              <p className="text-blue-600 dark:text-blue-300 text-xs">Post-Application Preparation</p>
            </div>
          </div>
          
          {/* Ready Badge */}
          <div className="flex flex-col items-center bg-blue-100 dark:bg-blue-800 rounded-xl px-3 py-2 border border-blue-300 dark:border-blue-600">
            <div className="text-xl font-black leading-none">✓</div>
            <div className="text-[10px] text-blue-600 dark:text-blue-300 font-medium">Ready</div>
          </div>
        </div>

        {/* Compact Almost Ready Message */}
        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 mb-3">
          <p className="text-blue-800 dark:text-blue-200 text-xs font-semibold mb-1">
            ✅ Prerequisites Complete!
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-xs">
            Mark job as <span className="font-bold">"Applied"</span> to unlock
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-full px-2 py-1">
            <CheckCircle2 size={12} />
            <span>Real Questions</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-full px-2 py-1">
            <CheckCircle2 size={12} />
            <span>AI Scoring</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-full px-2 py-1">
            <CheckCircle2 size={12} />
            <span>Talk Tracks</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-full px-2 py-1">
            <CheckCircle2 size={12} />
            <span>Core Stories</span>
          </div>
        </div>

        {/* Compact Waiting Button */}
        <button 
          disabled 
          className="w-full px-4 py-2.5 bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-lg font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="text-lg">⏳</span>
          <span>Waiting for Application</span>
        </button>
      </div>
    );
  }
  
  // Available state - show the full Interview Coach card
  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden" data-testid="interview-coach-entry-card">
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      
      {/* Header with Ready Badge */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <Brain size={22} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Interview Coach</h3>
            <p className="text-white/70 text-xs">Post-Application Preparation</p>
          </div>
        </div>
        
        {/* Ready Badge - Eye-catching */}
        <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/30">
          <div className="text-2xl font-black leading-none">🎯</div>
          <div className="text-[10px] text-white/80 font-medium">Ready</div>
        </div>
      </div>

      {/* Compact Description */}
      <p className="text-white/90 text-sm mb-4 leading-snug">
        Real questions from Glassdoor, Reddit, Blind. AI scoring and STAR talk tracks.
      </p>

      {/* Compact Feature List - Single Row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-1 text-xs bg-white/10 rounded-full px-2 py-1">
          <CheckCircle2 size={12} className="flex-shrink-0" />
          <span>Real Questions</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-white/10 rounded-full px-2 py-1">
          <CheckCircle2 size={12} className="flex-shrink-0" />
          <span>AI Scoring</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-white/10 rounded-full px-2 py-1">
          <CheckCircle2 size={12} className="flex-shrink-0" />
          <span>Talk Tracks</span>
        </div>
        <div className="flex items-center gap-1 text-xs bg-white/10 rounded-full px-2 py-1">
          <CheckCircle2 size={12} className="flex-shrink-0" />
          <span>Core Stories</span>
        </div>
      </div>

      {/* Compact CTA Button */}
      <button
        onClick={() => router.push(`/interview-coach/${jobId}?type=recruiter`)}
        data-testid="enter-interview-coach"
        className="w-full px-4 py-2.5 bg-white text-purple-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all shadow-md flex items-center justify-center gap-2 group"
      >
        <Users size={18} className="group-hover:scale-110 transition-transform" />
        <span>Start Interview Coach</span>
        <span className="text-lg">→</span>
      </button>
    </div>
  );
}
