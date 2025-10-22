'use client';

import { useState, useEffect } from 'react';
import { Wand2, TestTube, Check, Edit2, ArrowUp, ArrowDown, Minus, Send, Sparkles } from 'lucide-react';
import StoryRehearsalMode from './StoryRehearsalMode';

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
}

export default function AnswerPracticeWorkspace({
  jobId,
  selectedQuestions,
  interviewCoachState,
  setInterviewCoachState
}: Props) {
  // Debug logging
  console.log('🎯 AnswerPracticeWorkspace Debug:', {
    selectedQuestions,
    selectedQuestionsLength: selectedQuestions?.length,
    interviewCoachState: interviewCoachState ? 'loaded' : 'not loaded',
    questionBankSynthesized: interviewCoachState?.questionBank?.synthesizedQuestions?.length || 0
  });

  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(() => {
    if (selectedQuestions.length === 0) return null;
    const firstQuestion = selectedQuestions[0];
    return typeof firstQuestion === 'string' ? firstQuestion : firstQuestion?.question || null;
  });
  const [draftAnswer, setDraftAnswer] = useState('');
  const [scoring, setScoring] = useState(false);
  const [generatingAi, setGeneratingAi] = useState<Record<number, boolean>>({});
  const [testingImpact, setTestingImpact] = useState<Record<number, boolean>>({});
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [showDiscoveryQuestions, setShowDiscoveryQuestions] = useState<Record<string, boolean>>({});
  const [realTimeFeedback, setRealTimeFeedback] = useState<string>('');
  const [wordCount, setWordCount] = useState(0);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const [showStoryRehearsal, setShowStoryRehearsal] = useState(false);

  // Auto-populate selectedQuestions if empty but synthesizedQuestions exist
  useEffect(() => {
    if (selectedQuestions.length === 0 && interviewCoachState?.questionBank?.synthesizedQuestions?.length > 0) {
      console.log('🔄 Auto-populating selectedQuestions from synthesizedQuestions');
      console.log('🔄 Available synthesizedQuestions:', interviewCoachState.questionBank.synthesizedQuestions);
      const updated = {
        ...interviewCoachState,
        selectedQuestions: interviewCoachState.questionBank.synthesizedQuestions
      };
      setInterviewCoachState(updated);
    }
  }, [selectedQuestions.length, interviewCoachState?.questionBank?.synthesizedQuestions, interviewCoachState, setInterviewCoachState]);

  // Enhanced error handling and fallback logic
  useEffect(() => {
    if (!interviewCoachState?.questionBank) {
      console.warn('⚠️ No questionBank found in interviewCoachState');
      return;
    }

    // Check for multiple question sources and prioritize
    const availableQuestions = 
      interviewCoachState.questionBank.synthesizedQuestions ||
      interviewCoachState.questionBank.webQuestions ||
      interviewCoachState.questionBank.aiQuestions?.recruiter?.questions ||
      [];

    if (availableQuestions.length > 0 && selectedQuestions.length === 0) {
      console.log('🔄 Found available questions, auto-populating:', availableQuestions);
      const updated = {
        ...interviewCoachState,
        selectedQuestions: availableQuestions
      };
      setInterviewCoachState(updated);
    }
  }, [interviewCoachState, selectedQuestions.length, setInterviewCoachState]);

  // Real-time feedback logic
  const generateRealTimeFeedback = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    setWordCount(wordCount);
    
    let feedback = '';
    
    if (wordCount === 0) {
      feedback = 'Start writing your answer...';
    } else if (wordCount < 50) {
      feedback = '💡 Add more detail - aim for 150-300 words for a strong answer';
    } else if (wordCount < 100) {
      feedback = '📈 Good start! Add specific examples and metrics';
    } else if (wordCount < 200) {
      feedback = '✅ Good length! Make sure to include STAR structure';
    } else if (wordCount < 300) {
      feedback = '🎯 Excellent length! Review for clarity and impact';
    } else {
      feedback = '⚠️ Consider condensing - aim for 200-300 words';
    }
    
    // Check for STAR structure
    const hasSituation = /\b(situation|context|background|challenge|problem)\b/i.test(text);
    const hasTask = /\b(task|goal|objective|responsibility|role)\b/i.test(text);
    const hasAction = /\b(action|did|implemented|created|led|managed|developed)\b/i.test(text);
    const hasResult = /\b(result|outcome|impact|improved|increased|reduced|achieved)\b/i.test(text);
    
    if (wordCount > 50) {
      if (hasSituation && hasTask && hasAction && hasResult) {
        feedback += ' | ✅ STAR structure detected!';
      } else {
        const missing = [];
        if (!hasSituation) missing.push('Situation');
        if (!hasTask) missing.push('Task');
        if (!hasAction) missing.push('Action');
        if (!hasResult) missing.push('Result');
        feedback += ` | ⚠️ Add: ${missing.join(', ')}`;
      }
    }
    
    setRealTimeFeedback(feedback);
  };

  // Handle text changes with debounced feedback
  const handleTextChange = (text: string) => {
    setDraftAnswer(text);
    
    // Clear existing timer
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
    
    // Set new timer for real-time feedback
    const timer = setTimeout(() => {
      generateRealTimeFeedback(text);
    }, 1000); // 1 second delay
    
    setTypingTimer(timer);
  };

  const currentQuestionData = selectedQuestion 
    ? interviewCoachState.answers?.[selectedQuestion]
    : null;

  const latestScore = currentQuestionData?.scores?.[currentQuestionData.scores.length - 1];
  const previousScore = currentQuestionData?.scores?.[currentQuestionData.scores.length - 2];
  const scoreImprovement = latestScore && previousScore 
    ? latestScore.overall - previousScore.overall 
    : 0;

  // Load draft answer when question changes
  useEffect(() => {
    if (selectedQuestion && currentQuestionData) {
      setDraftAnswer(currentQuestionData.mainStory || '');
    }
  }, [selectedQuestion]);

  const handleScoreAnswer = async () => {
    if (!selectedQuestion || !draftAnswer.trim()) {
      alert('Please write your answer first');
      return;
    }

    try {
      setScoring(true);
      
      const currentIteration = (currentQuestionData?.scores?.length || 0) + 1;
      
      const res = await fetch(`/api/interview-coach/${jobId}/score-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion,
          answerText: draftAnswer,
          iteration: currentIteration
        })
      });

      if (!res.ok) throw new Error('Scoring failed');

      const result = await res.json();

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

      alert(`✅ Scored! ${result.score.overall}/100`);
      
    } catch (error: any) {
      alert(`Scoring failed: ${error.message}`);
    } finally {
      setScoring(false);
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
          followUpIndex: discoveryIndex
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
      
      const res = await fetch(`/api/interview-coach/${jobId}/score-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion,
          answerText: draftAnswer,
          testOnly: true,
          followUpQA: { question, answer }
        })
      });

      if (!res.ok) throw new Error('Impact test failed');

      const result = await res.json();

      // Update with impact result
      setInterviewCoachState((prev: any) => {
        const updated = { ...prev };
        const currentAnswer = updated.answers[selectedQuestion].discoveryAnswers[discoveryIndex];
        updated.answers[selectedQuestion].discoveryAnswers[discoveryIndex] = {
          ...currentAnswer,
          impact: result.score.overall - latestScore.overall,
          newScore: result.score.overall,
          explanation: result.score.feedback?.[0] || 'Impact calculated',
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
      setScoring(true);
      
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
      
      const res = await fetch(`/api/interview-coach/${jobId}/score-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion,
          answerText: combinedAnswer,
          iteration: currentIteration
        })
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
      setScoring(false);
    }
  };

  if (!selectedQuestions || selectedQuestions.length === 0) {
    // Check if we have any questions in questionBank that we can use
    const availableQuestions = interviewCoachState?.questionBank?.synthesizedQuestions || 
                              interviewCoachState?.questionBank?.webQuestions || 
                              [];
    
    if (availableQuestions.length > 0) {
      console.log('🔄 Found available questions, auto-populating:', availableQuestions);
      const updated = {
        ...interviewCoachState,
        selectedQuestions: availableQuestions
      };
      setInterviewCoachState(updated);
      return null; // Let the component re-render with the new data
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">🤔</div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          No Questions Selected
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {interviewCoachState?.questionBank ? 
            'Questions are available but not loaded. Let\'s fix this!' : 
            'You need to complete the Insights step first to generate interview questions.'
          }
        </p>
        
        {interviewCoachState?.questionBank && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Auto-Recovery Available</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              We found questions in your data. Click below to auto-load them.
            </p>
            <button
              onClick={() => {
                const availableQuestions = 
                  interviewCoachState.questionBank.synthesizedQuestions ||
                  interviewCoachState.questionBank.webQuestions ||
                  [];
                if (availableQuestions.length > 0) {
                  const updated = {
                    ...interviewCoachState,
                    selectedQuestions: availableQuestions
                  };
                  setInterviewCoachState(updated);
                }
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              🔄 Auto-Load Questions
            </button>
          </div>
        )}
        
        <div className="text-sm text-gray-500 mb-4">
          <strong>Debug Info:</strong><br/>
          questionBank exists: {interviewCoachState?.questionBank ? 'Yes' : 'No'}<br/>
          synthesizedQuestions: {interviewCoachState?.questionBank?.synthesizedQuestions?.length || 0}<br/>
          webQuestions: {interviewCoachState?.questionBank?.webQuestions?.length || 0}
        </div>
        
        <div className="flex gap-3 justify-center">
          <button 
            onClick={() => setInterviewCoachState({
              ...interviewCoachState,
              currentStep: 'insights'
            })}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Insights
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
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
    <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-6 h-full">
      {/* Left Column: Question List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 overflow-y-auto">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
          Selected Questions ({selectedQuestions.length})
        </h3>
        <div className="space-y-3">
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
                onClick={() => setSelectedQuestion(questionId)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 ring-2 ring-purple-500'
                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">
                    {hasScore ? (qScore >= 75 ? '✅' : '🟡') : '⭕'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {questionText}
                    </p>
                    {hasScore && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Score: {qScore}/100
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Active Workspace */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 overflow-y-auto space-y-6">
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
              <div className="flex items-center gap-2">
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
          </div>

          <textarea
            value={draftAnswer}
            onChange={(e) => handleTextChange(e.target.value)}
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
          
          {/* Real-time feedback */}
          {realTimeFeedback && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {realTimeFeedback}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  {wordCount} words
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleScoreAnswer}
              disabled={scoring || !draftAnswer.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg
                       hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {scoring ? (
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
              onClick={() => setShowStoryRehearsal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                       hover:bg-blue-700 transition-colors font-medium"
            >
              🎭 Practice Mode
            </button>
          </div>

          {/* Score Breakdown - Progressive Disclosure */}
          {latestScore && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Score Breakdown
                </h4>
                <button
                  onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                >
                  {showAdvancedFeatures ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              {/* Basic Score Display */}
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {latestScore.overall}/100
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {latestScore.overall >= 80 ? 'Excellent!' : 
                   latestScore.overall >= 60 ? 'Good, room for improvement' : 
                   'Needs work'}
                </div>
              </div>
              
              {/* Detailed Breakdown - Progressive Disclosure */}
              {showAdvancedFeatures && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>⭐ STAR Structure: {latestScore.breakdown?.star || 0}/25</div>
                  <div>📊 Specificity: {latestScore.breakdown?.specificity || 0}/25</div>
                  <div>🎯 Relevance: {latestScore.breakdown?.relevance || 0}/20</div>
                  <div>💬 Clarity: {latestScore.breakdown?.clarity || 0}/10</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Discovery Questions (Grid) - Progressive Disclosure */}
        {latestScore && currentQuestionData.discoveryQuestions && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-bold text-gray-900 dark:text-white">
                💬 Discovery Questions ({Object.keys(currentQuestionData.discoveryAnswers || {}).length} remaining)
              </h4>
              <button
                onClick={() => setShowDiscoveryQuestions(prev => ({
                  ...prev,
                  [selectedQuestion]: !prev[selectedQuestion]
                }))}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                {showDiscoveryQuestions[selectedQuestion] ? 'Hide Questions' : 'Show Questions'}
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Answer these to improve your score. These questions stay the same - no regeneration!
            </p>
            
            {showDiscoveryQuestions[selectedQuestion] && (

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
                  <div key={i} className={`border-2 ${borderColor} rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50`}>
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

                    {/* Impact Badge */}
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
                        <p className="mt-1">{discoveryAnswer.explanation || 'AI generated answer'}</p>
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
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSaveAndRescore}
                disabled={scoring}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 
                         text-white rounded-lg hover:from-purple-700 hover:to-blue-700 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
              >
                {scoring ? (
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
            </div>
            )}
          </div>
        )}
      </div>
      
      {/* Story Rehearsal Mode Modal */}
      {showStoryRehearsal && (
        <StoryRehearsalMode
          stories={[
            {
              title: 'Current Answer',
              category: 'Interview Response',
              situation: draftAnswer.split('SITUATION:')[1]?.split('TASK:')[0]?.trim() || 'Your situation context',
              task: draftAnswer.split('TASK:')[1]?.split('ACTION:')[0]?.trim() || 'Your task description',
              action: draftAnswer.split('ACTION:')[1]?.split('RESULT:')[0]?.trim() || 'Your action steps',
              result: draftAnswer.split('RESULT:')[1]?.trim() || 'Your results and outcomes'
            }
          ]}
          onClose={() => setShowStoryRehearsal(false)}
        />
      )}
    </div>
  );
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
