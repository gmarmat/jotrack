'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';
import AnalyzeButton from '../ai/AnalyzeButton';

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  rationale?: string;
  tips?: string[];
}

interface InterviewPrepTabProps {
  jobId: string;
  interviewStage: 'recruiter' | 'hiring-manager' | 'peer-panel';
  title: string;
  description: string;
}

export default function InterviewPrepTab({ jobId, interviewStage, title, description }: InterviewPrepTabProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [cached, setCached] = useState(false);

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/coach/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewStage }),
      });

      if (!res.ok) throw new Error('Question generation failed');

      const data = await res.json();
      setQuestions(data.questions);
      setCached(data.cached || false);
      
      console.log(`✅ Loaded ${data.questions.length} ${interviewStage} questions`);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      alert('Failed to generate interview questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          {questions.length === 0 && (
            <AnalyzeButton
              onAnalyze={handleGenerateQuestions}
              label="Generate Questions"
              estimatedCost={0.03}
              estimatedSeconds={15}
              isAnalyzing={isGenerating}
            />
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
        {cached && (
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            ✓ Using cached questions (refreshed within 90 days)
          </div>
        )}
      </div>

      {/* Questions List */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{questions.length} Questions to Prepare</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setExpandedQuestions(new Set(questions.map(q => q.id)))}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedQuestions(new Set())}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Collapse All
              </button>
            </div>
          </div>

          {questions.map((q, index) => {
            const isExpanded = expandedQuestions.has(q.id);
            
            return (
              <div
                key={q.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleQuestion(q.id)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      Q{index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                      {q.category}
                    </span>
                    <span className="font-medium">{q.question}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {q.rationale && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          💡 Why they ask this:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{q.rationale}</p>
                      </div>
                    )}

                    {q.tips && q.tips.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          🎯 Preparation Tips:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {q.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                      <button
                        className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate STAR Talk Track for this question
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {questions.length === 0 && !isGenerating && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Questions Generated Yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Click "Generate Questions" to get {interviewStage.replace('-', ' ')} interview questions
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            We'll search online (Glassdoor, Reddit, Blind) and use AI to create a comprehensive question bank
          </p>
        </div>
      )}
    </div>
  );
}

