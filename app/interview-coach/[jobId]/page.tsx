'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, History } from 'lucide-react';
import WelcomeSearch from '@/app/components/interview-coach/WelcomeSearch';
import SearchInsights from '@/app/components/interview-coach/SearchInsights';
import AnswerPracticeWorkspace from '@/app/components/interview-coach/AnswerPracticeWorkspace';
import TalkTracksPanel from '@/app/components/interview-coach/TalkTracksPanel';
import { CoreStoriesDisplay } from '@/app/components/interview-coach/CoreStoriesDisplay';
import FinalCheatSheet from '@/app/components/interview-coach/FinalCheatSheet';
import { ConfidenceScoreCard } from '@/app/components/interview-coach/ConfidenceScoreCard';
import { SuccessPredictionCard } from '@/app/components/interview-coach/SuccessPredictionCard';
import { calculateSignalConfidence, calculateOverallConfidence } from '@/lib/interview/confidenceScoring';
import { predictInterviewSuccess } from '@/lib/interview/successPrediction';
import { generateWeaknessFramings } from '@/lib/interview/redFlagFraming';
import { analyzeCareerTrajectory, analyzeCompetitiveContext } from '@/lib/interview/signalExtraction';
import { Persona, PERSONAS, PERSONA_LABELS, PERSONA_ICONS, PERSONA_DESCRIPTIONS } from '@/src/interview-coach/persona';
import YourWorkDrawer from '@/app/components/interview-coach/YourWorkDrawer';
import GuidedTutorial from '@/app/components/interview-coach/GuidedTutorial';

type InterviewStep = 'welcome' | 'practice' | 'talk-tracks';

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
  
  // Persona state management
  const [selectedPersona, setSelectedPersona] = useState<Persona>('hiring-manager');
  
  // Current step in the flow
  const [currentStep, setCurrentStep] = useState<InterviewStep>('welcome');
  
  // Talk tracks panel state
  const [showTalkTracks, setShowTalkTracks] = useState(false);
  
  // Your Work drawer state
  const [showYourWork, setShowYourWork] = useState(false);
  
  // Guided tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  
  // Job data
  const [jobData, setJobData] = useState<any>(null);
  
  // Analysis data (for confidence scoring)
  const [analysisData, setAnalysisData] = useState<any>(null);
  
  // Interview Coach state from coach_state.interview_coach_json
  const [interviewCoachState, setInterviewCoachState] = useState<any>({
    persona: selectedPersona,
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
  
  // Sticky header scroll state
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  
  // Load job data and Interview Coach state
  useEffect(() => {
    loadData();
  }, [jobId]);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderCompact(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
          setCurrentStep('practice'); // Skip insights, go directly to practice
        }
        
        // Check if tutorial was completed
        if (savedState.tutorialCompleted) {
          setTutorialCompleted(true);
        }
      } else {
        // New user - show tutorial
        setShowTutorial(true);
      }
    } catch (error) {
      console.error('❌ Failed to load Interview Coach data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Removed auto-advance logic - let users control their own flow
  
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
        
        // Auto-advance removed - users control their own flow
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setSaving(false);
      }
    }, 2000),
    [jobId]
  );
  
  useEffect(() => {
    if (interviewCoachState.questionBank || (interviewCoachState.selectedQuestions?.length || 0) > 0) {
      debouncedSave(interviewCoachState);
    }
  }, [interviewCoachState]);
  
  // Step handlers
  const handleSearchComplete = (questionBank: any) => {
    // Auto-select all synthesized questions for practice
    const selectedQuestions = questionBank.synthesizedQuestions || [];
    
    const updated = {
      ...interviewCoachState,
      questionBank,
      selectedQuestions,
      currentStep: 'practice',
      progress: {
        ...interviewCoachState.progress,
        questionsFound: (questionBank.webQuestions?.length || 0) + 
                       Object.values(questionBank.aiQuestions || {}).reduce((acc: number, p: any) => 
                         acc + (p?.questions?.length || 0), 0),
        questionsSelected: selectedQuestions?.length || 0
      }
    };
    setInterviewCoachState(updated);
    setCurrentStep('practice');
  };
  

  const handleRestartInterviewCoach = async () => {
    if (!confirm('Are you sure you want to restart the Interview Coach analysis? This will clear all current progress and start fresh.')) {
      return;
    }
    
    try {
      // Clear the interview coach state
      const resetState = {
        persona: selectedPersona,
        currentStep: 'welcome',
        progress: {
          questionsFound: 0,
          questionsSelected: 0,
          answersScored: 0,
          storiesExtracted: 0
        },
        questionBank: null,
        selectedQuestions: [],
        answers: {},
        talkTracks: null,
        coreStories: null,
        cheatSheet: null
      };
      
      setInterviewCoachState(resetState);
      setCurrentStep('welcome');
      
      // Save the reset state to database
      await fetch(`/api/coach/${jobId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewCoachState: resetState })
      });
      
      console.log('🔄 Interview Coach restarted successfully');
    } catch (error) {
      console.error('❌ Failed to restart Interview Coach:', error);
      alert('Failed to restart Interview Coach. Please try again.');
    }
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
  const validSteps = ['welcome', 'practice', 'talk-tracks'];
  if (!validSteps.includes(currentStep)) {
    console.warn(`Invalid currentStep: ${currentStep}, defaulting to 'welcome'`);
    setCurrentStep('welcome');
  }
  
  // Enhanced breadcrumb with progress indicators
  const steps = [
    { 
      id: 'welcome', 
      label: 'Search & Discover', 
      icon: '🔍', 
      status: interviewCoachState.questionBank ? 'completed' : (currentStep === 'welcome' ? 'active' : 'pending'),
      description: 'Find interview questions'
    },
    { 
      id: 'practice', 
      label: 'Practice & Score', 
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
    }
  ];
  
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sticky Compact Header (appears on scroll) */}
      <div
        className={`fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transition-all duration-300 z-40 ${
          isHeaderCompact ? 'py-2' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-semibold truncate">Interview Coach</h2>
            <div className="hidden sm:flex items-center gap-2 text-xs text-purple-100 truncate">
              <span>{jobData?.title}</span>
              <span>@</span>
              <span>{jobData?.company}</span>
            </div>
          </div>
          
          {/* Compact step indicator */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id as InterviewStep)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    isActive ? 'bg-white text-purple-600 font-medium' : 'text-purple-100 hover:text-white'
                  }`}
                >
                  {step.icon}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Main Header */}
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
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  Interview Coach
                  {process.env.NEXT_PUBLIC_INTERVIEW_V2 === '1' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      V2
                    </span>
                  )}
                </h1>
                <p className="text-sm text-purple-100">
                  {jobData?.title} at {jobData?.company}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!tutorialCompleted && (
                <button
                  onClick={() => setShowTutorial(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium text-white"
                  title="Start guided tutorial"
                >
                  <span>🎯</span>
                  <span>Start Tutorial</span>
                </button>
              )}
              
              <button
                data-testid="your-work-button"
                onClick={() => setShowYourWork(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                title="View your work history and snapshots"
              >
                <History className="w-4 h-4" />
                <span>Your Work</span>
              </button>
              
              <button
                onClick={handleRestartInterviewCoach}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                title="Restart Interview Coach analysis"
              >
                <span>🔄</span>
                <span>Restart</span>
              </button>
              
              {saving && (
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm">Saving...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Breadcrumb - Compact version */}
          <div className="mt-6 flex items-center gap-1 overflow-x-auto pb-2">
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
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-white text-purple-600 shadow-lg'
                        : isCompleted
                        ? 'bg-white/30 text-white hover:bg-white/40 cursor-pointer'
                        : 'bg-white/10 text-purple-200 cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : <span className="text-xs">{step.icon}</span>}
                    <span>{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="w-4 h-0.5 bg-white/20 mx-0.5" />
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
      
      {/* Persona Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" data-testid="persona-selector">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Interviewer Perspective
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {PERSONA_DESCRIPTIONS[selectedPersona]}
            </div>
          </div>
          
          <div className="flex gap-3">
            {PERSONAS.map((persona) => {
              const isSelected = persona === selectedPersona;
              const progress = Math.floor(Math.random() * 100); // Stub progress numbers
              
              return (
                <button
                  key={persona}
                  data-testid="persona-pill"
                  onClick={() => {
                    setSelectedPersona(persona);
                    setInterviewCoachState((prev: any) => ({
                      ...prev,
                      persona
                    }));
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{PERSONA_ICONS[persona]}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {PERSONA_LABELS[persona]}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {progress}% complete
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress ring */}
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-gray-200 dark:text-gray-600"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 14}`}
                        strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
                        className={isSelected ? 'text-purple-500' : 'text-gray-400'}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {progress}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content based on current step */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Confidence Score Card (V2.0 - Shows signal quality) */}
        {analysisData && currentStep === 'welcome' && (
          <>
            <ConfidenceScoreCard 
              overall={useMemo(() => calculateOverallConfidence(
                calculateSignalConfidence({
                  peopleProfiles: analysisData.peopleProfiles,
                  matchScore: analysisData.matchScoreData,
                  companyIntelligence: analysisData.companyIntelligence,
                  skillsMatch: analysisData.matchScoreData?.skillsMatch || [],
                  webIntelligence: interviewCoachState.questionBank?.webIntelligence
                })
              ), [analysisData, interviewCoachState.questionBank])}
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
              const skillsMatch = analysisData.matchScoreData?.skillsMatch || [];
              const competitiveAdvantages = Array.isArray(skillsMatch)
                ? skillsMatch
                    .filter((s: any) => s.matchStrength === 'strong' && s.yearsExperience >= 5)
                    .slice(0, 3)
                : [];
              
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
            persona={selectedPersona}
            companyName={jobData.company}
            roleTitle={jobData.title}
            onSearchComplete={handleSearchComplete}
            existingQuestionBank={interviewCoachState.questionBank}
            analysisData={analysisData}
          />
        )}
        
        
        {currentStep === 'practice' && (
          <div className="space-y-6">
            {/* Practice Header with Talk Tracks Button */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Practice & Score</h1>
                <div className="flex items-center gap-3">
                  {/* Low confidence banner */}
                  {(() => {
                    const lastConfidence = interviewCoachState.answers && 
                      Object.values(interviewCoachState.answers).length > 0 ? 
                      Object.values(interviewCoachState.answers)[0]?.scores?.[0]?.confidence || 1 : 1;
                    const lowConfidence = lastConfidence < 0.5;
                    
                    return lowConfidence && (
                      <span className="text-xs text-amber-700 bg-amber-100 rounded px-2 py-1">
                        Tip: adding a KPI may boost story quality (+8–12 pts)
                      </span>
                    );
                  })()}
                  
                  {/* Talk Tracks Button */}
                  {process.env.NEXT_PUBLIC_INTERVIEW_V2 === '1' && (
                    <button
                      onClick={() => setShowTalkTracks(true)}
                      className="rounded-md bg-indigo-600 text-white px-3 py-2 hover:bg-indigo-700 transition-colors"
                    >
                      Generate Core Stories
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Practice Workspace */}
            <AnswerPracticeWorkspace
              jobId={jobId}
              selectedQuestions={interviewCoachState.selectedQuestions || []}
              interviewCoachState={interviewCoachState}
              setInterviewCoachState={setInterviewCoachState}
              persona={selectedPersona}
            />
            
            {/* Talk Tracks Panel */}
            {showTalkTracks && (
              <TalkTracksPanel 
                jobId={jobId} 
                interviewCoachState={interviewCoachState}
                persona={selectedPersona}
              />
            )}
          </div>
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
        
        {/* Fallback for any invalid step */}
        {!['welcome', 'practice', 'talk-tracks'].includes(currentStep) && (
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
      
      {/* Your Work Drawer */}
      <YourWorkDrawer
        jobId={jobId}
        isOpen={showYourWork}
        onClose={() => setShowYourWork(false)}
        onSelectSnapshot={(snapshot) => {
          console.log('Selected snapshot:', snapshot);
          // TODO: Implement snapshot selection logic
        }}
      />
      
      {/* Guided Tutorial */}
      <GuidedTutorial
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          setTutorialCompleted(true);
          setShowTutorial(false);
          // Save tutorial completion to state
          setInterviewCoachState((prev: any) => ({
            ...prev,
            tutorialCompleted: true
          }));
        }}
        currentStep={currentStep}
        onStepChange={(step) => {
          if (step === 'persona') {
            // Tutorial will guide them to select persona
          } else if (step === 'practice') {
            setCurrentStep('practice');
          } else if (step === 'talk-tracks') {
            setCurrentStep('talk-tracks');
          }
        }}
      />
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

