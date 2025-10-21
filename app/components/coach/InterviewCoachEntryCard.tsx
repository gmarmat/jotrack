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
        className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 opacity-60" 
        data-testid="interview-coach-entry-card-disabled"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-1">
              Interview Coach
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Complete Match Score and Skills Analysis first to unlock
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
  
  // Show waiting state if prerequisites met but not post-application
  if (!isPostApplication) {
    return (
      <div 
        className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-6 border-2 border-blue-300 dark:border-blue-700" 
        data-testid="interview-coach-entry-card-waiting"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-1">
              Interview Coach
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Mark job as "Applied" to unlock interview preparation
            </p>
          </div>
          <button 
            disabled 
            className="px-6 py-2 bg-blue-300 dark:bg-blue-700 text-blue-500 rounded-lg cursor-not-allowed font-semibold"
          >
            Waiting for Application
          </button>
        </div>
      </div>
    );
  }
  
  // Available state - show the full Interview Coach card
  const config = {
    bg: 'from-purple-600 to-blue-600',
    text: 'Interview Coach Ready - Ace your interviews with personalized prep',
    icon: Brain,
  };
  
  const Icon = config.icon;

  return (
    <div className={`bg-gradient-to-r ${config.bg} rounded-2xl p-6 text-white shadow-lg`} data-testid="interview-coach-entry-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Icon size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-1">
              {config.text}
            </h3>
            <p className="text-white/90 text-sm">
              Get personalized questions, practice answers, and master your talk tracks
            </p>
          </div>
        </div>
        
        <button
          onClick={() => router.push(`/interview-coach/${jobId}?type=recruiter`)}
          data-testid="enter-interview-coach"
          className="px-8 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-md flex items-center gap-2"
        >
          <Users size={20} />
          Start Interview Coach
        </button>
      </div>

      {/* Quick Preview of What's Inside */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span>Real Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span>Answer Practice</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span>Talk Tracks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span>Core Stories</span>
          </div>
        </div>
      </div>
    </div>
  );
}
