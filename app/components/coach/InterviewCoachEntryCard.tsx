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
        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-2xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-lg" 
        data-testid="interview-coach-entry-card-disabled"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <Brain size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300">Interview Coach</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Post-Application Preparation</p>
          </div>
        </div>

        {/* Teaser Description */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 text-base mb-4 leading-relaxed">
            Master your interviews with AI-powered preparation. Get real questions from Glassdoor, Reddit, and Blind, then practice answers with instant feedback.
          </p>
          
          {/* Feature Teaser List */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <MessageSquare size={16} className="flex-shrink-0" />
              <span>Real Interview Questions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Brain size={16} className="flex-shrink-0" />
              <span>AI Answer Scoring</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <FileText size={16} className="flex-shrink-0" />
              <span>STAR Talk Tracks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Target size={16} className="flex-shrink-0" />
              <span>Core Story Extraction</span>
            </div>
          </div>
        </div>

        {/* Prerequisites Box */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            🔒 Unlock Requirements:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {hasMatchScore ? (
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded flex-shrink-0" />
              )}
              <span className={hasMatchScore ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                Complete Match Score analysis
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {hasSkillsAnalysis ? (
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded flex-shrink-0" />
              )}
              <span className={hasSkillsAnalysis ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                Complete Skills Match analysis
              </span>
            </div>
          </div>
        </div>

        {/* Locked Button */}
        <button 
          disabled 
          className="w-full px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-bold text-lg cursor-not-allowed flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🔒</span>
          <span>Locked - Complete Prerequisites</span>
        </button>
      </div>
    );
  }
  
  // Show waiting state if prerequisites met but not post-application
  if (!isPostApplication) {
    return (
      <div 
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-8 border-2 border-blue-300 dark:border-blue-700 shadow-lg" 
        data-testid="interview-coach-entry-card-waiting"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
            <Brain size={28} className="text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">Interview Coach</h3>
            <p className="text-blue-600 dark:text-blue-300 text-sm">Post-Application Preparation</p>
          </div>
        </div>

        {/* Almost Ready Message */}
        <div className="mb-6">
          <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-4 mb-4">
            <p className="text-blue-800 dark:text-blue-200 text-base font-semibold mb-2">
              ✅ Prerequisites Complete!
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              You're all set! Interview Coach will unlock after you mark this job as <span className="font-bold">"Applied"</span>.
            </p>
          </div>
          
          {/* Feature Preview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>Real Interview Questions</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>AI Answer Scoring</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>STAR Talk Tracks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>Core Story Extraction</span>
            </div>
          </div>
        </div>

        {/* Waiting Button */}
        <button 
          disabled 
          className="w-full px-6 py-4 bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-xl font-bold text-lg cursor-not-allowed flex items-center justify-center gap-3"
        >
          <span className="text-2xl">⏳</span>
          <span>Waiting for Application</span>
        </button>
      </div>
    );
  }
  
  // Available state - show the full Interview Coach card
  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl" data-testid="interview-coach-entry-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Brain size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Interview Coach</h3>
              <p className="text-white/80 text-sm">Post-Application Preparation</p>
            </div>
          </div>
          <p className="text-white/90 text-base mb-4 leading-relaxed">
            Get real interview questions from Glassdoor, Reddit, and Blind. Practice answers with AI scoring, then master your STAR talk tracks.
          </p>
        </div>
      </div>

      {/* Feature List */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>Real Interview Questions</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>AI Answer Scoring</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>STAR Talk Tracks</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span>Core Story Extraction</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => router.push(`/interview-coach/${jobId}?type=recruiter`)}
        data-testid="enter-interview-coach"
        className="w-full px-6 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-lg flex items-center justify-center gap-3 group"
      >
        <Users size={24} className="group-hover:scale-110 transition-transform" />
        <span>Start Interview Coach</span>
        <span className="text-2xl">→</span>
      </button>
    </div>
  );
}
