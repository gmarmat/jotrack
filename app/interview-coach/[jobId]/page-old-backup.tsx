'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Target, MessageCircle, TrendingUp, FileText, BookOpen, Trophy } from 'lucide-react';
import Link from 'next/link';
import { QuestionSelection } from '@/app/components/interview-coach/QuestionSelection';
import AnswerPracticeWorkspace from '@/app/components/interview-coach/AnswerPracticeWorkspace';
import { CoreStoriesDisplay } from '@/app/components/interview-coach/CoreStoriesDisplay';

/**
 * Interview Coach Page
 * Separate from Application Coach - focuses on interview prep
 * Uses 2-3 core stories strategy for maximum memorization
 */
export default function InterviewCoachPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'questions' | 'practice' | 'talk-tracks' | 'core-stories' | 'prep'>('questions');
  
  // Interview Coach state from coach_state.interview_coach_json
  const [interviewCoachState, setInterviewCoachState] = useState<any>({
    selectedQuestions: [],
    answers: {},
    coreStories: [],
    storyMapping: {},
    progress: {
      questionsSelected: 0,
      answersDrafted: 0,
      answersScored75Plus: 0,
      talkTracksGenerated: 0,
      coreStoriesExtracted: false
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Load Interview Coach state
  const loadInterviewCoachState = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/coach/${jobId}/save`);
      const data = await res.json();
      
      if (data.success && data.data?.interview_coach_json) {
        const icData = JSON.parse(data.data.interview_coach_json);
        setInterviewCoachState(icData);
        console.log('✅ Loaded Interview Coach state:', icData);
      } else {
        console.log('ℹ️ No Interview Coach data yet');
      }
    } catch (error) {
      console.error('Failed to load Interview Coach state:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);
  
  // Auto-save (debounced)
  useEffect(() => {
    if (loading) return; // Don't save during initial load
    
    const timer = setTimeout(() => {
      saveInterviewCoachState();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [interviewCoachState, loading]);
  
  const saveInterviewCoachState = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/coach/${jobId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewCoachJson: JSON.stringify(interviewCoachState)
        })
      });
      
      if (res.ok) {
        console.log('💾 Auto-saved Interview Coach state');
      }
    } catch (error) {
      console.error('Failed to save Interview Coach state:', error);
    } finally {
      setSaving(false);
    }
  };
  
  // Load on mount
  useEffect(() => {
    loadInterviewCoachState();
  }, [loadInterviewCoachState]);
  
  // Calculate progress
  const progress = interviewCoachState.progress || {};
  const readyForCoreStories = progress.talkTracksGenerated >= 3;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Interview Coach...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/jobs/${jobId}`}
                className="inline-flex items-center text-sm text-purple-100 hover:text-white mb-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Job Details
              </Link>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Target className="w-8 h-8" />
                Interview Coach
              </h1>
              <p className="text-purple-100 mt-1">
                Master 2-3 core stories to ace 90% of interview questions
              </p>
            </div>
            
            {/* Progress Summary */}
            <div className="hidden md:flex gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold">{progress.answersDrafted || 0}</div>
                <div className="text-purple-100">Answers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{progress.talkTracksGenerated || 0}</div>
                <div className="text-purple-100">Talk Tracks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{interviewCoachState.coreStories?.length || 0}</div>
                <div className="text-purple-100">Core Stories</div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'questions'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Select Questions
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'practice'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Practice & Score
            </button>
            <button
              onClick={() => setActiveTab('talk-tracks')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'talk-tracks'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Talk Tracks ({progress.talkTracksGenerated || 0})
            </button>
            <button
              onClick={() => setActiveTab('core-stories')}
              disabled={!readyForCoreStories}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'core-stories'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : readyForCoreStories
                  ? 'text-white hover:bg-white/20'
                  : 'text-purple-300 cursor-not-allowed'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Core Stories {!readyForCoreStories && '🔒'}
            </button>
            <button
              onClick={() => setActiveTab('prep')}
              disabled={!interviewCoachState.coreStories?.length}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'prep'
                  ? 'bg-white text-purple-600 shadow-lg'
                  : interviewCoachState.coreStories?.length
                  ? 'text-white hover:bg-white/20'
                  : 'text-purple-300 cursor-not-allowed'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Final Prep {!interviewCoachState.coreStories?.length && '🔒'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Auto-save indicator */}
      {saving && (
        <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Saving...
        </div>
      )}
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'questions' && (
          <QuestionSelection
            jobId={jobId}
            interviewCoachState={interviewCoachState}
            setInterviewCoachState={setInterviewCoachState}
          />
        )}
        
        {activeTab === 'practice' && (
          <AnswerPracticeWorkspace
            jobId={jobId}
            selectedQuestions={interviewCoachState.selectedQuestions || []}
            interviewCoachState={interviewCoachState}
            setInterviewCoachState={setInterviewCoachState}
          />
        )}
        
        {activeTab === 'talk-tracks' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Generated Talk Tracks
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              View all your STAR-formatted talk tracks. Once you have 3+, extract your core stories!
            </p>
            
            {/* Coming soon placeholder */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Talk Tracks Display Coming Soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You'll see all your polished STAR answers here.
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'core-stories' && (
          <CoreStoriesDisplay
            jobId={jobId}
            interviewCoachState={interviewCoachState}
            setInterviewCoachState={setInterviewCoachState}
            readyForExtraction={readyForCoreStories}
          />
        )}
        
        {activeTab === 'prep' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Final Prep
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Practice mode, cheat sheets, and memorization aids for your core stories.
            </p>
            
            {/* Coming soon placeholder */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Final Prep Tools Coming Soon
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Practice mode, cheat sheets, and full-screen practice simulator will be here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

