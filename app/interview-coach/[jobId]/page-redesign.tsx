'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import WelcomeSearch from '@/app/components/interview-coach/WelcomeSearch';
import AnswerPracticeWorkspace from '@/app/components/interview-coach/AnswerPracticeWorkspace';
import { CoreStoriesDisplay } from '@/app/components/interview-coach/CoreStoriesDisplay';

type InterviewStep = 'welcome' | 'select' | 'practice' | 'talk-tracks' | 'core-stories' | 'prep';

/**
 * Interview Coach Page - Redesigned with Step-Based Flow
 * 
 * Flow:
 * 1. Welcome + Search (replaces old Interview Questions section!)
 * 2. Select Questions (checkboxes, 5-8 required)
 * 3. Practice & Score (2-column workspace)
 * 4. Talk Tracks (generated when score ≥ 75)
 * 5. Core Stories (extracted from 5+ talk tracks)
 * 6. Final Prep (practice mode, cheat sheets)
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
      currentStep: 'select',
      progress: {
        ...interviewCoachState.progress,
        questionsFound: (questionBank.webQuestions?.length || 0) + 
                       Object.values(questionBank.aiQuestions || {}).reduce((acc: number, p: any) => 
                         acc + (p?.questions?.length || 0), 0)
      }
    };
    setInterviewCoachState(updated);
    setCurrentStep('select');
  };
  
  const handleQuestionsSelected = (questions: string[]) => {
    const updated = {
      ...interviewCoachState,
      selectedQuestions: questions,
      currentStep: 'practice',
      progress: {
        ...interviewCoachState.progress,
        questionsSelected: questions.length
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
    { id: 'welcome', label: 'Find Questions', icon: '🔍' },
    { id: 'select', label: 'Select', icon: '✓', count: interviewCoachState.selectedQuestions.length },
    { id: 'practice', label: 'Practice', icon: '📝' },
    { id: 'talk-tracks', label: 'Talk Tracks', icon: '✨' },
    { id: 'core-stories', label: 'Core Stories', icon: '🧠' },
    { id: 'prep', label: 'Final Prep', icon: '🚀' }
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
        
        {currentStep === 'select' && (
          <QuestionSelectionStep
            questionBank={interviewCoachState.questionBank}
            selectedQuestions={interviewCoachState.selectedQuestions}
            onContinue={handleQuestionsSelected}
            onBack={() => setCurrentStep('welcome')}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Final Prep
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              (Practice mode, cheat sheets - keeping existing UI)
            </p>
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

/**
 * Question Selection Step Component
 * Shows question bank with checkboxes, requires 5-8 selections
 */
function QuestionSelectionStep({
  questionBank,
  selectedQuestions,
  onContinue,
  onBack
}: {
  questionBank: any;
  selectedQuestions: string[];
  onContinue: (questions: string[]) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(selectedQuestions);
  
  if (!questionBank) {
    return <div>No questions found. Please search first.</div>;
  }
  
  // Combine all questions
  const allQuestions: any[] = [
    ...(questionBank.webQuestions || []).map((q: any, i: number) => ({
      id: `web-${i}`,
      question: q.question,
      category: q.category || 'General',
      difficulty: q.difficulty,
      persona: 'web',
      source: 'Web Search'
    })),
    ...(questionBank.aiQuestions?.recruiter?.questions || []).map((q: any, i: number) => ({
      id: `recruiter-${i}`,
      question: q.question || q,
      category: q.category || 'Recruiter',
      difficulty: q.difficulty,
      persona: 'recruiter',
      source: 'AI Generated'
    })),
    ...(questionBank.aiQuestions?.hiringManager?.questions || []).map((q: any, i: number) => ({
      id: `hm-${i}`,
      question: q.question || q,
      category: q.category || 'Hiring Manager',
      difficulty: q.difficulty,
      persona: 'hiring-manager',
      source: 'AI Generated'
    })),
    ...(questionBank.aiQuestions?.peer?.questions || []).map((q: any, i: number) => ({
      id: `peer-${i}`,
      question: q.question || q,
      category: q.category || 'Peer',
      difficulty: q.difficulty,
      persona: 'peer',
      source: 'AI Generated'
    }))
  ];
  
  const toggleQuestion = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(q => q !== id));
    } else if (selected.length < 10) {  // Max 10 questions
      setSelected([...selected, id]);
    }
  };
  
  const canContinue = selected.length >= 5 && selected.length <= 10;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Select Questions to Prepare
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose 5-10 questions. Focus on STAR questions (behavioral) for best results.
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {selected.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {selected.length < 5 ? `${5 - selected.length} more needed` : 
               selected.length > 10 ? 'Max 10' : 
               'Ready to continue!'}
            </div>
          </div>
        </div>
        
        {/* Question list with checkboxes */}
        <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
          {allQuestions.map((q) => {
            const isSelected = selected.includes(q.id);
            const isDisabled = !isSelected && selected.length >= 10;
            
            return (
              <button
                key={q.id}
                onClick={() => !isDisabled && toggleQuestion(q.id)}
                disabled={isDisabled}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {isSelected ? (
                      <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {q.question}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {q.source}
                      </span>
                      {q.difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          q.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                          q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {q.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
                     transition-colors"
          >
            ← Back to Search
          </button>
          
          <button
            onClick={() => onContinue(selected)}
            disabled={!canContinue}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg
                     hover:from-purple-700 hover:to-blue-700 transition-all font-semibold shadow-lg
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Practicing ({selected.length} questions) →
          </button>
        </div>
      </div>
    </div>
  );
}

