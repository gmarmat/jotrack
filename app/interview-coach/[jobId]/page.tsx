'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import WelcomeSearch from '@/app/components/interview-coach/WelcomeSearch';
import SearchInsights from '@/app/components/interview-coach/SearchInsights';
import AnswerPracticeWorkspace from '@/app/components/interview-coach/AnswerPracticeWorkspace';
import { CoreStoriesDisplay } from '@/app/components/interview-coach/CoreStoriesDisplay';
import FinalCheatSheet from '@/app/components/interview-coach/FinalCheatSheet';
import { ConfidenceScoreCard } from '@/app/components/interview-coach/ConfidenceScoreCard';
import { calculateSignalConfidence, calculateOverallConfidence } from '@/lib/interview/confidenceScoring';

type InterviewStep = 'welcome' | 'insights' | 'practice' | 'talk-tracks' | 'core-stories' | 'prep';

/**
 * Interview Coach Page - Redesigned with Step-Based Flow
 * 
 * Flow:
 * 1. Welcome + Search (triggers multi-source search)
 * 2. Insights (shows 31 raw → 4 synthesized, builds credibility)
 * 3. Practice & Score (4 auto-selected questions, 2-column workspace)
 * 4. Talk Tracks (generated when score ≥ 75)
 * 5. Core Stories (extracted from talk tracks, 2-3 stories)
 * 6. Final Cheat Sheet (printable summary with story mapping)
 */
export default function InterviewCoachPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = params.jobId as string;
  const persona = (searchParams.get('type') || 'recruiter') as 'recruiter' | 'hiring-manager' | 'peer';
  
  // Current step in the flow
  const [currentStep, setCurrentStep] = useState<InterviewStep>('welcome');
  
  // Job data
  const [jobData, setJobData] = useState<any>(null);
  
  // Analysis data (for confidence scoring)
  const [analysisData, setAnalysisData] = useState<any>(null);
  
  // Interview Coach state from coach_state.interview_coach_json
  const [interviewCoachState, setInterviewCoachState] = useState<any>({
    persona,
    questionBank: null, // Stores search results
    selectedQuestions: [],
    answers: {},
    talkTracks: {},
    coreStories: [],
    storyMapping: {},
    currentStep: 'welcome',
    progress: {
      questionsFound: 0,
      questionsSelected: 0,
      answersDrafted: 0,
      answersScored75Plus: 0,
      talkTracksGenerated: 0,
      coreStoriesExtracted: false
    }
  });
  
  const [saving, setSaving] = useState(false);
  
  // Load job data and Interview Coach state
  useEffect(() => {
    loadData();
  }, [jobId]);
  
  const loadData = async () => {
    try {
      // Load job
      const jobRes = await fetch(`/api/jobs/${jobId}`);
      const job = await jobRes.json();
      setJobData(job);
      
      // Load analysis data (for confidence scoring)
      const analysisRes = await fetch(`/api/jobs/${jobId}/analysis-data`);
      if (analysisRes.ok) {
        const analysis = await analysisRes.json();
        setAnalysisData(analysis);
      }
      
      // Load Interview Coach state
      const coachRes = await fetch(`/api/coach/${jobId}/save`);
      const coachData = await coachRes.json();
      
      if (coachData.data?.interview_coach_json) {
        const savedState = JSON.parse(coachData.data.interview_coach_json);
        setInterviewCoachState(savedState);
        
        // Resume from saved step
        if (savedState.currentStep) {
          setCurrentStep(savedState.currentStep);
        } else if (savedState.questionBank) {
          setCurrentStep('select');
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };
  
  // Auto-save Interview Coach state
  const debouncedSave = useCallback(
    debounce(async (state: any) => {
      try {
        setSaving(true);
        await fetch(`/api/coach/${jobId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewCoachJson: JSON.stringify(state)
          })
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setSaving(false);
      }
    }, 2000),
    [jobId]
  );
  
  useEffect(() => {
    if (interviewCoachState.questionBank || interviewCoachState.selectedQuestions.length > 0) {
      debouncedSave(interviewCoachState);
    }
  }, [interviewCoachState]);
  
  // Step handlers
  const handleSearchComplete = (questionBank: any) => {
    const updated = {
      ...interviewCoachState,
      questionBank,
      currentStep: 'insights',
      progress: {
        ...interviewCoachState.progress,
        questionsFound: (questionBank.webQuestions?.length || 0) + 
                       Object.values(questionBank.aiQuestions || {}).reduce((acc: number, p: any) => 
                         acc + (p?.questions?.length || 0), 0)
      }
    };
    setInterviewCoachState(updated);
    setCurrentStep('insights');
  };
  
  const handleInsightsComplete = () => {
    // Auto-select the 4 synthesized questions (no user selection needed!)
    const synthesizedQuestions = interviewCoachState.questionBank?.synthesizedQuestions || [];
    
    const updated = {
      ...interviewCoachState,
      selectedQuestions: synthesizedQuestions,
      currentStep: 'practice',
      progress: {
        ...interviewCoachState.progress,
        questionsSelected: synthesizedQuestions.length
      }
    };
    setInterviewCoachState(updated);
    setCurrentStep('practice');
  };
  
  if (!jobData) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Breadcrumb
  const steps = [
    { id: 'welcome', label: 'Search', icon: '🔍' },
    { id: 'insights', label: 'Insights', icon: '🤖', count: interviewCoachState.questionBank?.synthesizedQuestions?.length },
    { id: 'practice', label: 'Practice', icon: '📝', count: interviewCoachState.selectedQuestions.length },
    { id: 'talk-tracks', label: 'Talk Tracks', icon: '✨' },
    { id: 'core-stories', label: 'Core Stories', icon: '🧠' },
    { id: 'prep', label: 'Cheat Sheet', icon: '📄' }
  ];
  
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/jobs/${jobId}`}>
                <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Interview Coach</h1>
                <p className="text-sm text-purple-100">
                  {jobData.title} at {jobData.company}
                </p>
              </div>
            </div>
            
            {saving && (
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">Saving...</span>
              </div>
            )}
          </div>
          
          {/* Breadcrumb */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const isAccessible = index <= currentStepIndex;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isAccessible && setCurrentStep(step.id as InterviewStep)}
                    disabled={!isAccessible}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-white text-purple-600 shadow-lg'
                        : isCompleted
                        ? 'bg-white/30 text-white hover:bg-white/40 cursor-pointer'
                        : 'bg-white/10 text-purple-200 cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <span>{step.icon}</span>}
                    <span>{step.label}</span>
                    {step.count !== undefined && step.count > 0 && (
                      <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {step.count}
                      </span>
                    )}
                  </button>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-0.5 bg-white/20 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Auto-save indicator (top-right) */}
      {saving && (
        <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Saving...
        </div>
      )}
      
      {/* Content based on current step */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Confidence Score Card (V2.0 - Shows before search) */}
        {analysisData && currentStep === 'welcome' && (
          <ConfidenceScoreCard 
            overall={calculateOverallConfidence(
              calculateSignalConfidence({
                peopleProfiles: analysisData.peopleProfiles,
                matchScore: analysisData.matchScoreData,
                companyIntelligence: analysisData.companyIntelligence,
                skillsMatch: analysisData.matchScoreData?.skillsMatch || [],
                webIntelligence: interviewCoachState.questionBank?.webIntelligence
              })
            )}
          />
        )}
        
        {currentStep === 'welcome' && (
          <WelcomeSearch
            jobId={jobId}
            persona={persona}
            companyName={jobData.company}
            roleTitle={jobData.title}
            onSearchComplete={handleSearchComplete}
            existingQuestionBank={interviewCoachState.questionBank}
          />
        )}
        
        {currentStep === 'insights' && (
          <SearchInsights
            questionBank={interviewCoachState.questionBank}
            synthesizedQuestions={interviewCoachState.questionBank?.synthesizedQuestions || []}
            themes={interviewCoachState.questionBank?.themes || []}
            onContinue={handleInsightsComplete}
          />
        )}
        
        {currentStep === 'practice' && (
          <AnswerPracticeWorkspace
            jobId={jobId}
            selectedQuestions={interviewCoachState.selectedQuestions || []}
            interviewCoachState={interviewCoachState}
            setInterviewCoachState={setInterviewCoachState}
          />
        )}
        
        {currentStep === 'talk-tracks' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Generated Talk Tracks
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              (Talk tracks display - keeping existing UI)
            </p>
          </div>
        )}
        
        {currentStep === 'core-stories' && (
          <CoreStoriesDisplay
            coreStories={interviewCoachState.coreStories || []}
            storyMapping={interviewCoachState.storyMapping || {}}
          />
        )}
        
        {currentStep === 'prep' && (
          <FinalCheatSheet
            coreStories={interviewCoachState.coreStories || []}
            talkTracks={Object.values(interviewCoachState.talkTracks || {})}
            storyMapping={interviewCoachState.storyMapping || {}}
            onBack={() => setCurrentStep('core-stories')}
          />
        )}
      </div>
    </div>
  );
}

// Simple debounce helper
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

