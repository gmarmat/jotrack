'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, SkipForward, Save, Sparkles } from 'lucide-react';
import AnalyzeButton from '../ai/AnalyzeButton';

interface DiscoveryQuestion {
  id: string;
  category: string;
  question: string;
  rationale: string;
  targetSkill: string;
  wordLimit: number;
}

interface DiscoveryWizardProps {
  jobId: string;
  questions: DiscoveryQuestion[];
  initialResponses?: Record<string, { answer: string; skipped: boolean }>;
  initialBatch?: number;
  onComplete: (responses: Array<{ questionId: string; answer: string; skipped: boolean }>) => void;
}

export default function DiscoveryWizard({ jobId, questions, initialResponses, initialBatch, onComplete }: DiscoveryWizardProps) {
  const [currentBatch, setCurrentBatch] = useState(initialBatch || 0);
  const [responses, setResponses] = useState<Record<string, { answer: string; skipped: boolean }>>(initialResponses || {});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const BATCH_SIZE = 4; // Show 4 questions at a time
  const totalBatches = Math.ceil(questions.length / BATCH_SIZE);
  const currentQuestions = questions.slice(currentBatch * BATCH_SIZE, (currentBatch + 1) * BATCH_SIZE);
  
  const progress = ((currentBatch + 1) / totalBatches) * 100;
  const answeredCount = Object.values(responses).filter(r => !r.skipped && r.answer.trim().length > 0).length;
  const skippedCount = Object.values(responses).filter(r => r.skipped).length;

  // ✅ AUTO-SAVE responses to database whenever they change
  useEffect(() => {
    const saveResponses = async () => {
      if (Object.keys(responses).length === 0) return; // Don't save empty state
      
      setIsSaving(true);
      try {
        await fetch(`/api/coach/${jobId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discoveryQuestions: questions,
            discoveryResponses: responses,
            currentBatch,
            progress: { answered: answeredCount, skipped: skippedCount },
          }),
        });
        setLastSaved(new Date());
        console.log('✅ Auto-saved discovery responses');
      } catch (error) {
        console.error('Failed to auto-save discovery responses:', error);
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce saves (wait 2 seconds after last change)
    const timeoutId = setTimeout(saveResponses, 2000);
    return () => clearTimeout(timeoutId);
  }, [responses, currentBatch, jobId, questions, answeredCount, skippedCount]);

  const handleAnswer = (questionId: string, answer: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { answer, skipped: false }
    }));
  };

  const handleSkip = (questionId: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { answer: '', skipped: true }
    }));
  };

  const handleNext = () => {
    if (currentBatch < totalBatches - 1) {
      setCurrentBatch(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentBatch > 0) {
      setCurrentBatch(prev => prev - 1);
    }
  };

  // Countdown timer for analysis
  useEffect(() => {
    if (isAnalyzing && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isAnalyzing, startTime]);

  const handleComplete = async () => {
    setIsAnalyzing(true);
    setStartTime(Date.now());
    setElapsedSeconds(0);
    
    try {
      const formattedResponses = questions.map(q => ({
        questionId: q.id,
        answer: responses[q.id]?.answer || '',
        skipped: responses[q.id]?.skipped || false,
      }));
      
      await onComplete(formattedResponses);
    } finally {
      setIsAnalyzing(false);
      setStartTime(null);
      setElapsedSeconds(0);
    }
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const canProceed = currentQuestions.every(q => 
    responses[q.id]?.skipped || (responses[q.id]?.answer && responses[q.id].answer.trim().length > 0)
  );

  const isLastBatch = currentBatch === totalBatches - 1;

  return (
    <div data-testid="discovery-wizard" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header with Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Discovery Questions
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Batch {currentBatch + 1} of {totalBatches}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            {answeredCount} answered, {skippedCount} skipped
          </span>
          <span>
            {questions.length} total questions
          </span>
        </div>
      </div>

      {/* Current Batch of Questions */}
      <div className="space-y-6 mb-6">
        {currentQuestions.map((q, idx) => {
          const globalIdx = currentBatch * BATCH_SIZE + idx + 1;
          const response = responses[q.id];
          const wordCount = getWordCount(response?.answer || '');
          const isOverLimit = wordCount > q.wordLimit;

          return (
            <div 
              key={q.id} 
              className={`p-4 rounded-lg border-2 transition-all ${
                response?.skipped 
                  ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-300 dark:border-gray-600' 
                  : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-purple-600 text-white rounded">
                      Q{globalIdx}
                    </span>
                    <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                      {q.category.charAt(0).toUpperCase() + q.category.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      → {q.targetSkill}
                    </span>
                  </div>
                  
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {q.question}
                  </p>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                    Why we're asking: {q.rationale}
                  </p>
                </div>
                
                {!response?.skipped && (
                  <button
                    onClick={() => handleSkip(q.id)}
                    className="ml-4 flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    title="Skip this question"
                  >
                    <SkipForward size={14} />
                    Skip
                  </button>
                )}
              </div>

              {/* Answer Area */}
              {response?.skipped ? (
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Question skipped. <button onClick={() => setResponses(prev => { const next = {...prev}; delete next[q.id]; return next; })} className="text-purple-600 hover:underline">Answer instead</button>
                  </p>
                </div>
              ) : (
                <div>
                  <textarea
                    value={response?.answer || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    placeholder="Share your experience in detail... Think about the situation, what you did, and the results you achieved."
                    className={`w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      isOverLimit 
                        ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    } text-gray-900 dark:text-gray-100`}
                  />
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${
                      isOverLimit 
                        ? 'text-red-600 dark:text-red-400 font-semibold' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {wordCount} / {q.wordLimit} words
                      {isOverLimit && ' (over limit - please shorten)'}
                    </p>
                    
                    {response?.answer && !isOverLimit && (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Save size={12} />
                        Auto-saved
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBack}
          disabled={currentBatch === 0}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {canProceed ? (
            <span className="text-green-600 dark:text-green-400 font-medium">✓ Ready to continue</span>
          ) : (
            <span>Answer or skip all questions to proceed</span>
          )}
        </div>

        {isLastBatch ? (
          <button
            onClick={handleComplete}
            disabled={!canProceed || isSaving || isAnalyzing}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Sparkles size={16} />
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Analyzing... {elapsedSeconds}s
              </span>
            ) : isSaving ? (
              'Saving...'
            ) : (
              'Complete Discovery'
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Next
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>💡 Tip:</strong> Be specific and include metrics when possible. 
          These responses help us build your extended profile to improve your match score.
          It's okay to skip questions that don't apply to you.
        </p>
      </div>
    </div>
  );
}

