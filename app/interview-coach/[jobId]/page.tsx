'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import WelcomeSearch from '@/app/components/interview-coach/WelcomeSearch';
import SearchInsights from '@/app/components/interview-coach/SearchInsights';
import AnswerPracticeWorkspace from '@/app/components/interview-coach/AnswerPracticeWorkspace';
import { CoreStoriesDisplay } from '@/app/components/interview-coach/CoreStoriesDisplay';
import FinalCheatSheet from '@/app/components/interview-coach/FinalCheatSheet';
import { ConfidenceScoreCard } from '@/app/components/interview-coach/ConfidenceScoreCard';
import { SuccessPredictionCard } from '@/app/components/interview-coach/SuccessPredictionCard';
import { calculateSignalConfidence, calculateOverallConfidence } from '@/lib/interview/confidenceScoring';
import { predictInterviewSuccess } from '@/lib/interview/successPrediction';
import { generateWeaknessFramings } from '@/lib/interview/redFlagFraming';
import { analyzeCareerTrajectory, analyzeCompetitiveContext } from '@/lib/interview/signalExtraction';

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
  const [loading, setLoading] = useState(true);
  
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
      
      console.log('📊 Interview Coach - Loading analysis data...');
      
      // Load analysis data (for confidence scoring)
      const analysisRes = await fetch(`/api/jobs/${jobId}/analysis-data`);
      if (analysisRes.ok) {
        const analysis = await analysisRes.json();
        console.log('✅ Analysis data loaded:', {
          hasMatchScore: !!analysis.matchScoreData,
          hasSkillsMatch: !!analysis.matchScoreData?.skillsMatch,
          skillsMatchType: typeof analysis.matchScoreData?.skillsMatch,
          hasPeopleProfiles: !!analysis.peopleProfiles
        });
        setAnalysisData(analysis);
      } else {
        console.error('❌ Failed to load analysis data:', analysisRes.status);
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
          setCurrentStep('insights'); // Fixed: was 'select' which doesn't exist
        }
      }
    } catch (error) {
      console.error('❌ Failed to load Interview Coach data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Smart auto-advance logic
  const checkAndAdvanceStep = useCallback((newState: any) => {
    // Auto-advance from Search to Insights when questions are found
    if (currentStep === 'welcome' && newState.questionBank?.synthesizedQuestions?.length > 0) {
      console.log('🚀 Auto-advancing from Search to Insights');
      setTimeout(() => setCurrentStep('insights'), 2000); // Give user time to see completion
    }
    
    // Auto-advance from Insights to Practice when questions are selected
    if (currentStep === 'insights' && newState.selectedQuestions?.length > 0) {
      console.log('🚀 Auto-advancing from Insights to Practice');
      setTimeout(() => setCurrentStep('practice'), 1500);
    }
    
    // Auto-advance from Practice to Talk Tracks when answers are scored
    if (currentStep === 'practice' && newState.answers && Object.keys(newState.answers).length > 0) {
      const hasScoredAnswers = Object.values(newState.answers).some((answer: any) => 
        answer.scores && answer.scores.length > 0
      );
      if (hasScoredAnswers) {
        console.log('🚀 Auto-advancing from Practice to Talk Tracks');
        setTimeout(() => setCurrentStep('talk-tracks'), 2000);
      }
    }
    
    // Auto-advance from Talk Tracks to Core Stories when talk tracks are generated
    if (currentStep === 'talk-tracks' && newState.talkTracks) {
      console.log('🚀 Auto-advancing from Talk Tracks to Core Stories');
      setTimeout(() => setCurrentStep('core-stories'), 1500);
    }
    
    // Auto-advance from Core Stories to Cheat Sheet when stories are mapped
    if (currentStep === 'core-stories' && newState.coreStories) {
      console.log('🚀 Auto-advancing from Core Stories to Cheat Sheet');
      setTimeout(() => setCurrentStep('prep'), 1500);
    }
  }, [currentStep]);
  
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
        
        // Check for auto-advancement opportunities
        checkAndAdvanceStep(state);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setSaving(false);
      }
    }, 2000),
    [jobId, checkAndAdvanceStep]
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
    
    console.log('🎯 handleInsightsComplete Debug:', {
      synthesizedQuestions,
      synthesizedQuestionsLength: synthesizedQuestions.length,
      questionBank: interviewCoachState.questionBank ? 'exists' : 'missing',
      currentInterviewCoachState: interviewCoachState
    });
    
    const updated = {
      ...interviewCoachState,
      selectedQuestions: synthesizedQuestions,
      currentStep: 'practice',
      progress: {
        ...interviewCoachState.progress,
        questionsSelected: synthesizedQuestions.length
      }
    };
    
    console.log('🎯 Updated state:', {
      selectedQuestions: updated.selectedQuestions,
      selectedQuestionsLength: updated.selectedQuestions.length
    });
    
    setInterviewCoachState(updated);
    setCurrentStep('practice');
  };
  
  // Show loading state (AFTER all hooks)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading Interview Coach...</p>
        </div>
      </div>
    );
  }
  
  // Show error if no job data (AFTER all hooks)
  if (!jobData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-4">Failed to load job data</p>
          <Link href={`/jobs/${jobId}`}>
            <button className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold">
              Go Back
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Ensure we always have a valid step
  const validSteps = ['welcome', 'insights', 'practice', 'talk-tracks', 'core-stories', 'prep'];
  if (!validSteps.includes(currentStep)) {
    console.warn(`Invalid currentStep: ${currentStep}, defaulting to 'welcome'`);
    setCurrentStep('welcome');
  }
  
  // Enhanced breadcrumb with progress indicators
  const steps = [
    { 
      id: 'welcome', 
      label: 'Search', 
      icon: '🔍', 
      status: interviewCoachState.questionBank ? 'completed' : (currentStep === 'welcome' ? 'active' : 'pending'),
      description: 'Find interview questions'
    },
    { 
      id: 'insights', 
      label: 'Insights', 
      icon: '🤖', 
      count: interviewCoachState.questionBank?.synthesizedQuestions?.length,
      status: interviewCoachState.questionBank?.synthesizedQuestions?.length > 0 ? 'completed' : (currentStep === 'insights' ? 'active' : 'pending'),
      description: 'AI analysis & filtering'
    },
    { 
      id: 'practice', 
      label: 'Practice', 
      icon: '📝', 
      count: interviewCoachState.selectedQuestions?.length || 0,
      status: interviewCoachState.answers && Object.keys(interviewCoachState.answers).length > 0 ? 'completed' : (currentStep === 'practice' ? 'active' : 'pending'),
      description: 'Write & score answers'
    },
    { 
      id: 'talk-tracks', 
      label: 'Talk Tracks', 
      icon: '✨',
      status: interviewCoachState.talkTracks ? 'completed' : (currentStep === 'talk-tracks' ? 'active' : 'pending'),
      description: 'STAR format stories'
    },
    { 
      id: 'core-stories', 
      label: 'Core Stories', 
      icon: '🧠',
      status: interviewCoachState.coreStories ? 'completed' : (currentStep === 'core-stories' ? 'active' : 'pending'),
      description: 'Story mapping'
    },
    { 
      id: 'prep', 
      label: 'Cheat Sheet', 
      icon: '📄',
      status: interviewCoachState.cheatSheet ? 'completed' : (currentStep === 'prep' ? 'active' : 'pending'),
      description: 'Final prep guide'
    }
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
              const isCompleted = step.status === 'completed';
              const isAccessible = index <= currentStepIndex || isCompleted;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => isAccessible && setCurrentStep(step.id as InterviewStep)}
                    disabled={!isAccessible}
                    title={step.description}
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
        {/* Confidence Score Card (V2.0 - Shows signal quality) */}
        {analysisData && currentStep === 'welcome' && (
          <>
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
            
            {/* Success Prediction Card (V2.0 - Shows win probability) */}
            {(() => {
              // Calculate answer scores from interview coach state
              const answerScores: number[] = [];
              if (interviewCoachState.answers) {
                Object.values(interviewCoachState.answers).forEach((ans: any) => {
                  if (ans.scores && ans.scores.length > 0) {
                    const latestScore = ans.scores[ans.scores.length - 1];
                    answerScores.push(latestScore.overall || 0);
                  }
                });
              }
              
              // Get competitive advantages
              const skillsMatchArray = Array.isArray(analysisData.matchScoreData?.skillsMatch) 
                ? analysisData.matchScoreData.skillsMatch 
                : [];
              const competitiveAdvantages = skillsMatchArray
                .filter((s: any) => s.matchStrength === 'strong' && s.yearsExperience >= 5)
                .slice(0, 3);
              
              // Generate red flags
              const redFlags = analysisData.matchScoreData && analysisData.resumeVariant
                ? generateWeaknessFramings(
                    analysisData.resumeVariant.raw || '',
                    analysisData.matchScoreData,
                    analyzeCareerTrajectory(analysisData.resumeVariant.raw || ''),
                    interviewCoachState.questionBank?.webIntelligence?.warnings || []
                  )
                : [];
              
              const prediction = predictInterviewSuccess({
                matchScore: analysisData.matchScoreData?.matchScore || 0,
                answerScores,
                interviewerProfile: analysisData.peopleProfiles?.profiles?.[0] || null,
                redFlags,
                competitiveAdvantages
              });
              
              return <SuccessPredictionCard prediction={prediction} />;
            })()}
          </>
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
        
        {/* Fallback for any invalid step */}
        {!['welcome', 'insights', 'practice', 'talk-tracks', 'core-stories', 'prep'].includes(currentStep) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Step Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Current step: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{currentStep}</code>
            </p>
            <button 
              onClick={() => setCurrentStep('welcome')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go to Welcome
            </button>
          </div>
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

