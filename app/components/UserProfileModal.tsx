"use client";

import { useState, useEffect } from 'react';
import { X, User, Briefcase, TrendingUp, DollarSign, Target, Award } from 'lucide-react';

interface UserStats {
  totalJobs: number;
  activeJobs: number;
  appliedJobs: number;
  interviewingJobs: number;
  offersReceived: number;
  
  // Coach mode stats
  coachModeUsed: number;
  averageScoreImprovement: number;
  totalAiCost: number;
  totalTokensUsed: number;
  
  // Writing style (if evaluated)
  writingStyle?: {
    vocabularyLevel: string;
    dominantTones: string[];
    storytellingApproach: string;
  };
  
  // Common interview questions
  mostCommonQuestions?: string[];
  
  // Success metrics
  successRate: number; // Offers / Applications
  averageTimeToOffer: number; // days
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'writing' | 'preferences'>('stats');

  useEffect(() => {
    if (isOpen) {
      loadUserStats();
    }
  }, [isOpen]);

  const loadUserStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-3">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Your Profile</h2>
              <p className="text-sm opacity-90">JoTrack Career Stats & Insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              📊 Career Stats
            </button>
            <button
              onClick={() => setActiveTab('writing')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'writing'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              ✍️ Writing Style
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              ⚙️ Preferences
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading your profile...</p>
            </div>
          ) : (
            <>
              {/* Stats Tab */}
              {activeTab === 'stats' && stats && (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                        <Briefcase size={18} />
                        <p className="text-xs font-medium">Total Jobs</p>
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalJobs}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                        <Target size={18} />
                        <p className="text-xs font-medium">Applied</p>
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.appliedJobs}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                        <Award size={18} />
                        <p className="text-xs font-medium">Offers</p>
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.offersReceived}</p>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Success Rate</p>
                      <span className="text-2xl font-bold text-green-600">{stats.successRate}%</span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000"
                        style={{ width: `${stats.successRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      {stats.offersReceived} offers from {stats.appliedJobs} applications
                    </p>
                  </div>

                  {/* Coach Mode Usage */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-purple-600 dark:text-purple-400" />
                        <p className="text-xs font-medium text-purple-900 dark:text-purple-100">Avg Score Improvement</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        +{stats.averageScoreImprovement}%
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                        Used Coach Mode {stats.coachModeUsed} times
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={16} className="text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Total AI Cost</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${stats.totalAiCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        {(stats.totalTokensUsed / 1000).toFixed(0)}K tokens used
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Writing Style Tab */}
              {activeTab === 'writing' && (
                <div className="space-y-6">
                  {stats?.writingStyle ? (
                    <>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3">Your Writing Profile</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vocabulary Level</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                              {stats.writingStyle.vocabularyLevel}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Storytelling Style</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                              {stats.writingStyle.storytellingApproach.replace('-', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Dominant Tones</p>
                        <div className="flex flex-wrap gap-2">
                          {stats.writingStyle.dominantTones.map((tone, idx) => (
                            <span key={idx} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full capitalize">
                              {tone}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Complete Coach Mode discovery to analyze your writing style
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      User preferences coming soon!
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Default coach threshold, notification settings, export preferences
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

