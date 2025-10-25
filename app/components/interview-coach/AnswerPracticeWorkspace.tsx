'use client';

import { useState, useEffect } from 'react';
import { Wand2, TestTube, Check, Edit2, ArrowUp, ArrowDown, Minus, Send, Sparkles } from 'lucide-react';
import InterviewerProfileCard from './InterviewerProfileCard';

interface DiscoveryAnswer {
  question: string;
  answer: string;
  source: 'ai' | 'user' | null;
  impact: number | null;
  newScore: number | null;
  explanation: string | null;
  status: 'empty' | 'ai-filled' | 'user-filled' | 'tested' | 'done';
  placeholder: string;
}

interface Props {
  jobId: string;
  selectedQuestions: string[];
  interviewCoachState: any;
  setInterviewCoachState: (state: any) => void;
  persona?: 'recruiter' | 'hiring-manager' | 'peer';
  jobData?: any;
  analysisData?: any;
}

export default function AnswerPracticeWorkspace({
  jobId,
  selectedQuestions,
  interviewCoachState,
  setInterviewCoachState,
  persona = 'hiring-manager',
  jobData,
  analysisData
}: Props) {
  // Debug logging
  console.log('🎯 AnswerPracticeWorkspace Debug:', {
    selectedQuestions,
    selectedQuestionsLength: selectedQuestions?.length,
    interviewCoachState: interviewCoachState ? 'loaded' : 'not loaded',
    questionBankSynthesized: interviewCoachState?.questionBank?.synthesizedQuestions?.length || 0
  });

  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(() => {
    if (!selectedQuestions || selectedQuestions.length === 0) return null;
    const firstQuestion = selectedQuestions[0];
    return typeof firstQuestion === 'string' ? firstQuestion : firstQuestion?.question || null;
  });
  const [draftAnswer, setDraftAnswer] = useState('');
  const [scoring, setScoring] = useState<Record<string, boolean>>({});
  const [generatingAi, setGeneratingAi] = useState<Record<number, boolean>>({});
  const [testingImpact, setTestingImpact] = useState<Record<number, boolean>>({});
  const [suggestedAnswer, setSuggestedAnswer] = useState<string | null>(null);
  const [suggestingAnswer, setSuggestingAnswer] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Countdown timer for AI operations (countdown, not countup)
  const estimatedTime = 15; // Estimated time for AI Suggest in seconds
  const remainingSeconds = Math.max(0, estimatedTime - elapsedSeconds);
  
  useEffect(() => {
    if (suggestingAnswer && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    } else if (!suggestingAnswer) {
      setElapsedSeconds(0);
      setStartTime(null);
    }
  }, [suggestingAnswer, startTime]);

  // Auto-populate selectedQuestions if empty but synthesizedQuestions exist
  useEffect(() => {
    if ((!selectedQuestions || selectedQuestions.length === 0) && interviewCoachState?.questionBank?.synthesizedQuestions?.length > 0) {
      console.log('🔄 Auto-populating selectedQuestions from synthesizedQuestions');
      console.log('🔄 Available synthesizedQuestions:', interviewCoachState.questionBank.synthesizedQuestions);
      
      // Fix character array issue - convert to proper strings
      const fixedQuestions = interviewCoachState.questionBank.synthesizedQuestions.map((q: any) => {
        if (typeof q === 'object' && q !== null && !Array.isArray(q)) {
          // If it's an object with numeric keys, it's a character array - convert to string
          const keys = Object.keys(q).filter(k => /^\d+$/.test(k));
          if (keys.length > 0) {
            return keys.map(k => q[k]).join('');
          }
        }
        return typeof q === 'string' ? q : String(q);
      });
      
      const updated = {
        ...interviewCoachState,
        selectedQuestions: fixedQuestions
      };
      setInterviewCoachState(updated);
    }
  }, [selectedQuestions?.length, interviewCoachState?.questionBank?.synthesizedQuestions, interviewCoachState, setInterviewCoachState]);

  // Debug logging for question data
  useEffect(() => {
    console.log('🎯 Practice Workspace Debug:', {
      selectedQuestions: selectedQuestions?.length || 0,
      selectedQuestionsData: selectedQuestions,
      questionBank: interviewCoachState?.questionBank ? 'exists' : 'missing',
      synthesizedQuestions: interviewCoachState?.questionBank?.synthesizedQuestions?.length || 0,
      webQuestions: interviewCoachState?.questionBank?.webQuestions?.length || 0,
      aiQuestions: interviewCoachState?.questionBank?.aiQuestions ? Object.keys(interviewCoachState.questionBank.aiQuestions) : 'none'
    });
  }, [selectedQuestions, interviewCoachState]);

  const currentQuestionData = selectedQuestion 
    ? interviewCoachState.answers?.[selectedQuestion]
    : null;

  const latestScore = currentQuestionData?.scores?.[currentQuestionData.scores.length - 1];
  const previousScore = currentQuestionData?.scores?.[currentQuestionData.scores.length - 2];
  const scoreImprovement = latestScore && previousScore 
    ? latestScore.overall - previousScore.overall 
    : 0;

  // Load draft answer when question changes - V2: Check persona-specific answers first
  useEffect(() => {
    if (selectedQuestion) {
      // Check persona-specific answer first
      const personaAnswer = interviewCoachState.answersByPersona?.[persona]?.[selectedQuestion];
      if (personaAnswer) {
        setDraftAnswer(personaAnswer);
        return;
      }
      
      // Fall back to base answer
      const baseAnswer = interviewCoachState.answersBase?.[selectedQuestion];
      if (baseAnswer) {
        setDraftAnswer(baseAnswer);
        return;
      }
      
      // Fall back to legacy structure
      if (currentQuestionData) {
        setDraftAnswer(currentQuestionData.mainStory || '');
      } else {
        // Clear draft answer if no data for this question
        setDraftAnswer('');
      }
    }
  }, [selectedQuestion, currentQuestionData, persona, interviewCoachState.answersByPersona, interviewCoachState.answersBase]);

  // Auto-save when draft answer changes (debounced) - V2: Persona-specific saving
  useEffect(() => {
    if (!selectedQuestion || !draftAnswer.trim()) return;
    
    const timeoutId = setTimeout(() => {
      setInterviewCoachState((prev: any) => {
        const updated = { ...prev };
        
        // Initialize persona-specific data structure
        updated.answersBase = updated.answersBase || {};
        updated.answersByPersona = updated.answersByPersona || {};
        updated.answersByPersona[persona] = updated.answersByPersona[persona] || {};
        
        // Save to base answers (shared across all personas)
        updated.answersBase[selectedQuestion] = draftAnswer;
        
        // Save to persona-specific answers (allows personalization)
        updated.answersByPersona[persona][selectedQuestion] = draftAnswer;
        
        // Legacy: Keep existing structure for backward compatibility
        updated.answers = updated.answers || {};
        updated.answers[selectedQuestion] = updated.answers[selectedQuestion] || {};
        updated.answers[selectedQuestion].mainStory = draftAnswer;
        
        return updated;
      });
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [draftAnswer, selectedQuestion, persona, setInterviewCoachState]);

  const handleScoreAnswer = async () => {
    if (!selectedQuestion || !draftAnswer.trim()) {
      alert('Please write your answer first');
      return;
    }

    try {
      setScoring(prev => ({ ...prev, [selectedQuestion]: true }));
      
      const currentIteration = (currentQuestionData?.scores?.length || 0) + 1;
      
      // Build V2 payload
      const payload = {
        questionId: selectedQuestion,
        answer: draftAnswer,
        persona,
        jdCore: [], // TODO: Get from analysis data
        companyValues: [], // TODO: Get from analysis data
        userProfile: {}, // TODO: Get from analysis data
        matchMatrix: null,
        evidenceQuality: null,
        previous: currentQuestionData?.scores?.[0] ? {
          overall: currentQuestionData.scores[0].overall,
          subscores: currentQuestionData.scores[0].subscores
        } : null,
        iteration: currentIteration
      };

      const res = await fetch(`/api/interview-coach/${jobId}/score-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Scoring failed');

      const result = await res.json();

      // Check if using legacy scorer (when V2 flag is enabled but response lacks version:"v2")
      if (process.env.NEXT_PUBLIC_INTERVIEW_V2 === '1' && result.version !== 'v2') {
        console.warn('⚠️ Using legacy scorer - response lacks version:"v2"');
      }

      // Update state with new score and discovery questions
      setInterviewCoachState((prev: any) => {
        const updated = { ...prev };
        updated.answers = updated.answers || {};
        updated.answers[selectedQuestion] = updated.answers[selectedQuestion] || {};
        
        // Save main story
        updated.answers[selectedQuestion].mainStory = draftAnswer;
        
        // Append score (don't overwrite)
        updated.answers[selectedQuestion].scores = updated.answers[selectedQuestion].scores || [];
        updated.answers[selectedQuestion].scores.push(result.score);
        
        // Lock discovery questions (first time only!)
        if (!updated.answers[selectedQuestion].discoveryQuestions) {
          updated.answers[selectedQuestion].discoveryQuestions = result.score.followUpQuestions || [];
          
          // Initialize discovery answers with smart placeholders
          updated.answers[selectedQuestion].discoveryAnswers = {};
          result.score.followUpQuestions?.forEach((q: string, i: number) => {
            updated.answers[selectedQuestion].discoveryAnswers[i] = {
              question: q,
              answer: '',
              source: null,
              impact: null,
              newScore: null,
              explanation: null,
              status: 'empty',
              placeholder: generatePlaceholder(q)
            };
          });
        }
        
        return updated;
      });

      // Removed popup alert - score is shown in the UI
      
    } catch (error: any) {
      alert(`Scoring failed: ${error.message}`);
    } finally {
      setScoring(prev => ({ ...prev, [selectedQuestion]: false }));
    }
  };

  const handleSuggestAnswer = async () => {
    if (!selectedQuestion) return;
    
    // Validate that we have some content to work with
    if (!draftAnswer || draftAnswer.trim().length < 10) {
      alert('Please write at least a few sentences about your experience before using AI Suggest.');
      return;
    }
    
        setSuggestingAnswer(true);
        setStartTime(Date.now());
        try {
      // Get the actual question text from selectedQuestions array
      const questionObj = selectedQuestions.find(q => 
        (typeof q === 'string' ? q : q?.question) === selectedQuestion
      );
      const questionText = typeof questionObj === 'string' ? questionObj : questionObj?.question || selectedQuestion;
      
      // Extract rich context from passed props
      const matchMatrix = analysisData?.matchMatrix;
      
      // Get JD core requirements and company values from jobData
      const jdCore = jobData?.jdCore || jobData?.coreRequirements || jobData?.requirements || [];
      const companyValues = jobData?.companyValues || jobData?.values || jobData?.culture || [];
      
      // Get resume context from analysisData
      const resumeContext = analysisData?.resumeData?.summary || 
                           analysisData?.resumeData?.experience || 
                           analysisData?.resumeSummary || 
                           'No resume context available';
      
      // Get company and role info from jobData
      const companyName = jobData?.companyName || jobData?.company || 'Unknown Company';
      const roleTitle = jobData?.roleTitle || jobData?.title || 'Unknown Role';
      
      const requestBody = {
        question: questionText,
        answer: draftAnswer,
        persona,
        targetedDimensions: ['structure', 'specificity'], // Default dimensions
        jdCore,
        companyValues,
        userProfile: {
          resume: resumeContext,
          company: companyName,
          role: roleTitle
        },
        matchMatrix
      };
      
      console.log('🎯 Suggest Answer Request:', {
        question: questionText.substring(0, 50) + '...',
        answer: draftAnswer.substring(0, 50) + '...',
        persona,
        targetedDimensions: ['structure', 'specificity'],
        jdCore: jdCore.length,
        companyValues: companyValues.length,
        userProfile: {
          resume: resumeContext.substring(0, 50) + '...',
          company: companyName,
          role: roleTitle
        }
      });
      
      const response = await fetch(`/api/interview-coach/${jobId}/suggest-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`AI suggestion failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response:', { success: data.success, usedAi: data.usedAi, draftLength: data.draft?.length });
      
      // V2: Handle new response format
      if (data.success && data.draft) {
        setSuggestedAnswer(data.draft);
        
        // Show toast notification
        const message = data.usedAi 
          ? 'AI draft inserted' 
          : 'Scaffold draft inserted';
        setToastMessage(message);
        
        // Clear toast after 3 seconds
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('❌ Suggest Answer Error:', error);
      alert(`AI Suggest failed: ${error.message}`);
    } finally {
      setSuggestingAnswer(false);
    }
  };

  const handleAiSuggest = async (discoveryIndex: number, question: string) => {
    try {
      setGeneratingAi(prev => ({ ...prev, [discoveryIndex]: true }));
      
      const res = await fetch(`/api/interview-coach/${jobId}/suggest-follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion,
          followUpQuestion: question,
          followUpIndex: discoveryIndex,
          persona
        })
      });

      if (!res.ok) throw new Error('AI suggestion failed');

      const result = await res.json();

      // Update discovery answer with AI response + impact
      setInterviewCoachState((prev: any) => {
        const updated = { ...prev };
        updated.answers[selectedQuestion].discoveryAnswers[discoveryIndex] = {
          question,
          answer: result.answer,
          source: 'ai',
          impact: result.impact,
          newScore: result.newScore,
          explanation: result.explanation,
          status: 'ai-filled',
          placeholder: result.placeholder || generatePlaceholder(question)
        };
        return updated;
      });
      
    } catch (error: any) {
      alert(`AI suggestion failed: ${error.message}`);
    } finally {
      setGeneratingAi(prev => ({ ...prev, [discoveryIndex]: false }));
    }
  };

  const handleTestImpact = async (discoveryIndex: number, question: string, answer: string) => {
    if (!answer.trim()) return;
    
    try {
      setTestingImpact(prev => ({ ...prev, [discoveryIndex]: true }));
      
      // Build V2 payload for impact test using suggest-follow-up route
      const payload = {
        questionId: selectedQuestion,
        answer: draftAnswer,
        persona,
        jdCore: [], // TODO: Get from analysis data
        companyValues: [], // TODO: Get from analysis data
        userProfile: {}, // TODO: Get from analysis data
        matchMatrix: null,
        evidenceQuality: null,
        previous: latestScore ? {
          overall: latestScore.overall,
          subscores: latestScore.subscores || {}
        } : null
      };

      const res = await fetch(`/api/interview-coach/${jobId}/suggest-follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Impact test failed');

      const result = await res.json();

      // Update with impact result using V2 format
      setInterviewCoachState((prev: any) => {
        const updated = { ...prev };
        const currentAnswer = updated.answers[selectedQuestion].discoveryAnswers[discoveryIndex];
        
        // Extract delta information from V2 response
        const delta = result.delta;
        const impact = delta?.points || 0;
        const explanation = delta?.reason || 'Impact tested';
        const newScore = latestScore ? latestScore.overall + impact : impact;
        
        updated.answers[selectedQuestion].discoveryAnswers[discoveryIndex] = {
          ...currentAnswer,
          impact: impact,
          newScore: newScore,
          explanation: explanation,
          status: 'tested'
        };
        return updated;
      });
      
    } catch (error: any) {
      alert(`Impact test failed: ${error.message}`);
    } finally {
      setTestingImpact(prev => ({ ...prev, [discoveryIndex]: false }));
    }
  };

  const handleDiscoveryAnswerChange = (index: number, value: string) => {
    setInterviewCoachState((prev: any) => {
      const updated = { ...prev };
      const currentAnswer = updated.answers[selectedQuestion].discoveryAnswers[index];
      updated.answers[selectedQuestion].discoveryAnswers[index] = {
        ...currentAnswer,
        answer: value,
        source: value ? 'user' : null,
        status: value ? 'user-filled' : 'empty',
        // Clear AI impact when user edits
        impact: null,
        newScore: null,
        explanation: null
      };
      return updated;
    });
  };

  const handleSaveAndRescore = async () => {
    try {
      setScoring(prev => ({ ...prev, [selectedQuestion]: true }));
      
      // Combine main answer + all discovery answers
      const discoveryAnswers = currentQuestionData.discoveryAnswers || {};
      const combinedAnswerParts = [draftAnswer];
      
      Object.values(discoveryAnswers).forEach((da: any) => {
        if (da.answer) {
          combinedAnswerParts.push(`\n${da.question}\n${da.answer}`);
        }
      });
      
      const combinedAnswer = combinedAnswerParts.join('\n');
      const currentIteration = (currentQuestionData?.scores?.length || 0) + 1;
      
      // Build V2 payload for combined answer
      const payload = {
        questionId: selectedQuestion,
        answer: combinedAnswer,
        persona,
        jdCore: [], // TODO: Get from analysis data
        companyValues: [], // TODO: Get from analysis data
        userProfile: {}, // TODO: Get from analysis data
        matchMatrix: null,
        evidenceQuality: null,
        previous: currentQuestionData?.scores?.[0] ? {
          overall: currentQuestionData.scores[0].overall,
          subscores: currentQuestionData.scores[0].subscores
        } : null,
        iteration: currentIteration
      };

      const res = await fetch(`/api/interview-coach/${jobId}/score-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Re-scoring failed');

      const result = await res.json();

      // Update with new score
      setInterviewCoachState((prev: any) => {
        const updated = { ...prev };
        updated.answers[selectedQuestion].scores.push(result.score);
        return updated;
      });

      alert(`✅ Re-scored! New score: ${result.score.overall}/100`);
      
    } catch (error: any) {
      alert(`Re-scoring failed: ${error.message}`);
    } finally {
      setScoring(prev => ({ ...prev, [selectedQuestion]: false }));
    }
  };

  // V2: Save snapshot function
  const handleSaveSnapshot = async () => {
    if (!selectedQuestion || !draftAnswer.trim()) {
      alert('Please write your answer first');
      return;
    }

    setSavingSnapshot(true);
    try {
      // Get current score and confidence
      const currentScore = latestScore?.overall || 0;
      const currentConfidence = latestScore?.confidence || 0.5;
      const currentFlags = latestScore?.flags || [];

      const response = await fetch(`/api/coach/${jobId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          label: `Answer for: ${selectedQuestion.substring(0, 50)}...`,
          score: currentScore,
          confidence: currentConfidence,
          flags: currentFlags
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setToastMessage(`Snapshot saved: ${data.snapshot.id}`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert(`Failed to save snapshot: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save snapshot:', error);
      alert('Failed to save snapshot');
    } finally {
      setSavingSnapshot(false);
    }
  };

  if (!selectedQuestions || selectedQuestions.length === 0) {
    // Check if we have any questions in questionBank that we can use
    const availableQuestions = interviewCoachState?.questionBank?.synthesizedQuestions?.filter(q => q && (typeof q === 'string' || q.question)) || [];
    
    if (availableQuestions.length > 0) {
      console.log('🔄 Found available questions, auto-populating:', availableQuestions);
      // Auto-populate selectedQuestions from synthesizedQuestions
      setInterviewCoachState(prev => ({
        ...prev,
        selectedQuestions: availableQuestions
      }));
      return null; // Let the component re-render with the new data
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          No Questions Available
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please complete the search step first to generate interview questions.
        </p>
        <div className="text-sm text-gray-500 mb-4">
          Debug Info:<br/>
          • questionBank exists: {interviewCoachState?.questionBank ? 'Yes' : 'No'}<br/>
          • synthesizedQuestions: {interviewCoachState?.questionBank?.synthesizedQuestions?.length || 0}<br/>
          • webQuestions: {interviewCoachState?.questionBank?.webQuestions?.length || 0}<br/>
          • aiQuestions: {interviewCoachState?.questionBank?.aiQuestions ? Object.keys(interviewCoachState.questionBank.aiQuestions).join(', ') : 'None'}
        </div>
        <button 
          onClick={() => setInterviewCoachState({
            ...interviewCoachState,
            currentStep: 'welcome'
          })}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Go to Search
        </button>
      </div>
    );
  }

  if (!selectedQuestion) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a question from the left to begin
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <Check className="w-4 h-4" />
          {toastMessage}
        </div>
      )}
      
      {/* Two-Column Layout - Questions Left, Answer Right */}
      <div className="grid grid-cols-2 gap-6 h-full" style={{ height: '600px' }}>
        {/* Left Column: Question List (30%) */}
        <div className="flex flex-col border-2 border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
          <div className="bg-purple-100 dark:bg-purple-900/30 px-4 py-2 border-b border-purple-200 dark:border-purple-800">
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300">
              Interview Questions ({selectedQuestions?.length || 0})
            </h4>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              Select a question to practice your answer
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            <div className="space-y-3" data-testid="question-list">
              {selectedQuestions.map((questionObj, index) => {
                // Handle both object format {question, source, url, category} and string format
                const questionText = typeof questionObj === 'string' ? questionObj : questionObj?.question || `Question ${index + 1}`;
                const questionId = typeof questionObj === 'string' ? questionObj : questionObj?.question || `question-${index}`;
                
                const qData = interviewCoachState.answers?.[questionId];
                const qScore = qData?.scores?.[qData.scores.length - 1]?.overall || 0;
                const hasScore = qScore > 0;
                const isActive = questionId === selectedQuestion;
                
                return (
                  <button
                    key={questionId}
                    data-testid={`question-item-${index}`}
                    onClick={() => {
                      // Auto-save current answer before switching
                      if (selectedQuestion && draftAnswer.trim()) {
                        setInterviewCoachState((prev: any) => {
                          const updated = { ...prev };
                          updated.answers = updated.answers || {};
                          updated.answers[selectedQuestion] = updated.answers[selectedQuestion] || {};
                          updated.answers[selectedQuestion].mainStory = draftAnswer;
                          return updated;
                        });
                      }
                      setSelectedQuestion(questionId);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 ring-2 ring-purple-500'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {hasScore ? (qScore >= 75 ? '✅' : '🟡') : '⭕'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                          {questionText}
                        </p>
                        <div className="mt-1 space-y-1">
                          {hasScore && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Score: {qScore}/100
                            </p>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                              Theme: {getQuestionTheme(questionText)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            {getQuestionImportance(questionText)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Answer Workspace (70%) */}
        <div className="flex flex-col border-2 border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
          <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 border-b border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Your Answer
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Write your STAR story and get AI feedback
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-6">
        {/* Section 1: Main Story */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {(() => {
                // Find the question text from selectedQuestions array
                const questionObj = selectedQuestions.find(q => 
                  (typeof q === 'string' ? q : q?.question) === selectedQuestion
                );
                return typeof questionObj === 'string' ? questionObj : questionObj?.question || selectedQuestion;
              })()}
            </h3>
            {latestScore && (
              <div className="flex items-center gap-2" data-testid="score-display">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {latestScore.overall}/100
                </span>
                {scoreImprovement !== 0 && (
                  <span className={`flex items-center gap-1 text-sm font-semibold ${
                    scoreImprovement > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {scoreImprovement > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {Math.abs(scoreImprovement)}
                  </span>
                )}
              </div>
            )}
            
            {/* V2: Improvement Summary & CTAs */}
            {latestScore && (
              <ImprovementSummary 
                score={latestScore.overall}
                subscores={latestScore.subscores || {}}
                flags={latestScore.flags || []}
                persona={persona}
              />
            )}
          </div>

          <textarea
            data-testid="answer-textarea"
            value={draftAnswer}
            onChange={(e) => setDraftAnswer(e.target.value)}
            placeholder={`Write your STAR story here (200-300 words):

SITUATION: What was the context? (Company, team size, timeline)
e.g., "At TechCorp, our 5-person engineering team faced a critical production issue affecting 100K users..."

TASK: What was your goal/challenge?
e.g., "I was tasked with reducing deployment time from 2 hours to under 15 minutes while maintaining zero downtime..."

ACTION: What did YOU specifically do? (Be specific with technologies, decisions, leadership)
e.g., "I led the migration to Docker containers, set up CI/CD with GitHub Actions, and trained 3 junior engineers on the new process..."

RESULT: What was the measurable outcome? (Metrics, business impact, team improvements)
e.g., "Reduced deployment time by 90% (2hrs → 12min), cut bug rate by 40%, and saved $50K annually in DevOps costs."`}
            className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:text-xs
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />

          <div className="flex gap-3 mt-4">
            <button
              data-testid="analyze-button"
              onClick={handleScoreAnswer}
              disabled={scoring[selectedQuestion] || !draftAnswer.trim()}
              className="flex-1 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg
                       hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {scoring[selectedQuestion] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {latestScore ? 'Re-Analyze & Score' : 'Analyze & Score'}
                </>
              )}
            </button>
            
            <button
              onClick={handleSuggestAnswer}
              disabled={suggestingAnswer || !selectedQuestion}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              title={process.env.NEXT_PUBLIC_AI_ASSIST_ON !== '1' 
                ? "AI Assist disabled - will generate scaffold template instead" 
                : "AI will generate a contextual example answer to help you win"}
            >
              {suggestingAnswer ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-xs font-semibold tabular-nums">
                    {remainingSeconds > 0 ? `${remainingSeconds}s` : 'Starting...'}
                  </span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  {process.env.NEXT_PUBLIC_AI_ASSIST_ON === '1' ? 'AI Suggest' : 'Template Suggest'}
                </>
              )}
            </button>
          </div>

          {/* Suggested Answer Display */}
          {suggestedAnswer && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  💡 AI Suggested Answer
                </p>
                <button
                  onClick={() => {
                    setDraftAnswer(suggestedAnswer);
                    setSuggestedAnswer(null);
                  }}
                  className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline"
                >
                  Use This
                </button>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3 leading-relaxed">
                {suggestedAnswer}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                This is an inspirational example. Adapt it to your voice and experience - authenticity is key!
              </p>
            </div>
          )}

          {/* Score Breakdown */}
          {latestScore && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Score Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>⭐ STAR Structure: {latestScore.breakdown?.star || 0}/25</div>
                <div>📊 Specificity: {latestScore.breakdown?.specificity || 0}/25</div>
                <div>🎯 Relevance: {latestScore.breakdown?.relevance || 0}/20</div>
                <div>💬 Clarity: {latestScore.breakdown?.clarity || 0}/10</div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Discovery Questions (Grid) */}
        {latestScore && currentQuestionData.discoveryQuestions && (
          <div>
            <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
              💬 Discovery Questions ({Object.keys(currentQuestionData.discoveryAnswers || {}).length} remaining)
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Answer these additional questions to help improve your score on this answer.
            </p>

            {/* Discovery Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentQuestionData.discoveryQuestions.slice(0, 5).map((question: string, i: number) => {
                const discoveryAnswer = currentQuestionData.discoveryAnswers?.[i] || {
                  question,
                  answer: '',
                  status: 'empty',
                  placeholder: generatePlaceholder(question)
                };

                const borderColor = 
                  discoveryAnswer.status === 'ai-filled' ? 'border-blue-400 dark:border-blue-600' :
                  discoveryAnswer.status === 'user-filled' ? 'border-purple-400 dark:border-purple-600' :
                  discoveryAnswer.status === 'tested' || discoveryAnswer.status === 'done' ? 'border-green-400 dark:border-green-600' :
                  'border-gray-300 dark:border-gray-600';

                return (
                  <div key={i} className={`border-2 ${borderColor} rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50`} data-testid="discovery-question">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {i + 1}. {question}
                    </p>
                    
                    <textarea
                      value={discoveryAnswer.answer}
                      onChange={(e) => handleDiscoveryAnswerChange(i, e.target.value)}
                      placeholder={discoveryAnswer.placeholder}
                      disabled={discoveryAnswer.status === 'done'}
                      className="w-full h-24 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none
                               disabled:opacity-60 disabled:cursor-not-allowed"
                    />

                    {/* Impact Badge with Delta and Rationale */}
                    {(discoveryAnswer.impact !== null || discoveryAnswer.status === 'ai-filled') && (
                      <div className={`mt-2 p-2 rounded text-xs ${
                        discoveryAnswer.impact && discoveryAnswer.impact > 0
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : discoveryAnswer.impact && discoveryAnswer.impact < 0
                          ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      }`}>
                        {discoveryAnswer.impact !== null && (
                          <div className="flex items-center gap-1 font-semibold">
                            {discoveryAnswer.impact > 0 ? <ArrowUp className="w-3 h-3" /> : 
                             discoveryAnswer.impact < 0 ? <ArrowDown className="w-3 h-3" /> : 
                             <Minus className="w-3 h-3" />}
                            {discoveryAnswer.impact > 0 ? '+' : ''}{discoveryAnswer.impact} | {discoveryAnswer.newScore}/100
                          </div>
                        )}
                        {/* V2: Display delta with rationale inline */}
                        {discoveryAnswer.status === 'tested' && discoveryAnswer.explanation && (
                          <p className="mt-1 text-xs opacity-90">
                            {discoveryAnswer.explanation}
                          </p>
                        )}
                        {discoveryAnswer.status === 'ai-filled' && (
                          <p className="mt-1 text-xs opacity-90">AI generated answer</p>
                        )}
                      </div>
                    )}

                    {/* Compact Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      {discoveryAnswer.status === 'empty' && (
                        <button
                          onClick={() => handleAiSuggest(i, question)}
                          disabled={generatingAi[i]}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30
                                   text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 transition-colors"
                        >
                          {generatingAi[i] ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-3 h-3" />
                              AI Suggest
                            </>
                          )}
                        </button>
                      )}

                      {discoveryAnswer.status === 'ai-filled' && (
                        <>
                          <button
                            onClick={() => handleDiscoveryAnswerChange(i, '')}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30
                                     text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setInterviewCoachState((prev: any) => {
                                const updated = { ...prev };
                                updated.answers[selectedQuestion].discoveryAnswers[i].status = 'done';
                                return updated;
                              });
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30
                                     text-green-700 dark:text-green-300 rounded hover:bg-green-200 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Looks Good
                          </button>
                        </>
                      )}

                      {discoveryAnswer.status === 'user-filled' && (
                        <>
                          <button
                            onClick={() => handleTestImpact(i, question, discoveryAnswer.answer)}
                            disabled={testingImpact[i]}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30
                                     text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 transition-colors"
                          >
                            {testingImpact[i] ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-700"></div>
                                Testing...
                              </>
                            ) : (
                              <>
                                <TestTube className="w-3 h-3" />
                                Test Impact
                              </>
                            )}
                          </button>
                          <button
                            data-testid="ai-assist-button"
                            onClick={() => handleAiSuggest(i, question)}
                            disabled={generatingAi[i]}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30
                                     text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 transition-colors"
                          >
                            <Wand2 className="w-3 h-3" />
                            AI Suggest
                          </button>
                        </>
                      )}

                      {(discoveryAnswer.status === 'tested' || discoveryAnswer.status === 'done') && (
                        <button
                          disabled
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30
                                   text-green-700 dark:text-green-300 rounded"
                        >
                          <Check className="w-3 h-3" />
                          Done
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save All & Re-score Button */}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={handleSaveAndRescore}
                disabled={scoring[selectedQuestion]}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 
                         text-white rounded-lg hover:from-purple-700 hover:to-blue-700 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
              >
                {scoring[selectedQuestion] ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Re-scoring Full Answer...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Save All & Re-score Full Answer
                  </>
                )}
              </button>
              
              {/* V2: Snapshot Save Button */}
              <button
                data-testid="save-snapshot-button"
                onClick={handleSaveSnapshot}
                disabled={savingSnapshot || !draftAnswer.trim()}
                className="flex items-center gap-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 
                         text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all font-semibold text-sm"
              >
                {savingSnapshot ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Save Snapshot
                  </>
                )}
              </button>
            </div>
          </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// V2: Improvement Summary Component
function ImprovementSummary({ 
  score, 
  subscores, 
  flags, 
  persona 
}: { 
  score: number; 
  subscores: Record<string, number>; 
  flags: string[]; 
  persona: 'recruiter' | 'hiring-manager' | 'peer';
}) {
  // Import the summarizeImprovements function
  const { summarizeImprovements } = require('@/src/interview-coach/scoring/rules');
  
  // Get improvement suggestions
  const improvements = summarizeImprovements(subscores, flags, persona);
  
  // Only show if score is below 75 or there are specific issues
  if (score >= 75 && improvements.ctas.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg" data-testid="improvement-summary">
      <div className="space-y-3">
        {/* Summary */}
        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
          {improvements.summary}
        </p>
        
        {/* CTAs */}
        {improvements.ctas.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              Quick Actions:
            </p>
            <div className="flex flex-wrap gap-2">
              {improvements.ctas.map((cta, index) => (
                <span 
                  key={index}
                  data-testid="cta-button"
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-800/30 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                >
                  {cta}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper: Get question theme
function getQuestionTheme(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('tell me about yourself') || q.includes('walk me through')) {
    return 'Background';
  }
  if (q.includes('why') && (q.includes('company') || q.includes('role'))) {
    return 'Motivation';
  }
  if (q.includes('describe') || q.includes('challenging') || q.includes('conflict')) {
    return 'Behavioral';
  }
  if (q.includes('salary') || q.includes('expectations')) {
    return 'Compensation';
  }
  if (q.includes('leadership') || q.includes('manage')) {
    return 'Leadership';
  }
  
  return 'General';
}

// Helper: Get question importance explanation
function getQuestionImportance(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('tell me about yourself')) {
    return 'Sets the tone - shows career progression and key achievements';
  }
  if (q.includes('why') && q.includes('company')) {
    return 'Tests genuine interest and cultural fit alignment';
  }
  if (q.includes('describe') || q.includes('challenging')) {
    return 'Demonstrates problem-solving skills and STAR methodology';
  }
  if (q.includes('salary')) {
    return 'Logistics question - shows negotiation readiness';
  }
  if (q.includes('leadership')) {
    return 'Assesses management style and team dynamics';
  }
  
  return 'Core interview question - practice thoroughly';
}

// Helper: Generate smart placeholders based on question type
function generatePlaceholder(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes('metric') || q.includes('result') || q.includes('improve')) {
    return "e.g., 'Reduced deployment time by 60%, cut bug rate by 40%, increased velocity by 25%'";
  }
  
  if (q.includes('who') || q.includes('stakeholder') || q.includes('involve')) {
    return "e.g., 'Product Manager Sarah Chen, UX Designer Mike Park, and 3 platform engineers'";
  }
  
  if (q.includes('obstacle') || q.includes('challenge') || q.includes('difficult')) {
    return "e.g., 'Tight deadline (2 weeks), legacy codebase, team unfamiliar with microservices'";
  }
  
  if (q.includes('timeline') || q.includes('when') || q.includes('how long')) {
    return "e.g., 'Kicked off Q3 2024, MVP in 6 weeks, full rollout by Q4'";
  }
  
  if (q.includes('technical') || q.includes('technology') || q.includes('how did')) {
    return "e.g., 'Migrated to microservices using Docker, Kubernetes, deployed on AWS Lambda'";
  }
  
  return "e.g., 'Be specific with names, numbers, and concrete details (20-50 words)'";
}
