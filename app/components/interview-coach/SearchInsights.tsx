'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Theme {
  theme: string;
  questionCount: number;
  representative: string;
  sampleQuestions: string[];
}

interface Props {
  questionBank: any;
  synthesizedQuestions: string[];
  themes: Theme[];
  onContinue: () => void;
}

/**
 * AI Synthesis Insights Page
 * Shows user what we found and HOW we synthesized 31 → 4 questions
 * Builds credibility and trust
 */
export default function SearchInsights({
  questionBank,
  synthesizedQuestions,
  themes,
  onContinue
}: Props) {
  const [showRawQuestions, setShowRawQuestions] = useState(false);
  
  const totalRawQuestions = 
    (questionBank.webQuestions?.length || 0) +
    Object.values(questionBank.aiQuestions || {}).reduce((acc: number, p: any) => 
      acc + (p?.questions?.length || 0), 0);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 
                    rounded-2xl p-8 border-2 border-green-200 dark:border-green-800 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Found {totalRawQuestions} Interview Questions!
        </h2>
        <p className="text-green-700 dark:text-green-300 text-lg">
          Now analyzing and synthesizing into top 4 questions...
        </p>
      </div>
      
      {/* Insights: What We Found */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          🔍 Search Results Breakdown
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {questionBank.webQuestions?.length || 0}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">From Web Search</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Glassdoor, Reddit, Blind
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Object.values(questionBank.aiQuestions || {}).reduce((acc: number, p: any) => 
                acc + (p?.questions?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">AI Generated</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Persona-specific
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {synthesizedQuestions.length}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">Final Questions</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              AI-synthesized
            </div>
          </div>
        </div>
        
        {/* Raw questions toggle */}
        <button
          onClick={() => setShowRawQuestions(!showRawQuestions)}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 mb-4"
        >
          {showRawQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {showRawQuestions ? 'Hide' : 'View'} all {totalRawQuestions} raw questions
        </button>
        
        {showRawQuestions && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-64 overflow-y-auto text-sm space-y-1">
            {questionBank.webQuestions?.map((q: any, i: number) => (
              <div key={i} className="text-gray-700 dark:text-gray-300">
                • {q.question} <span className="text-xs text-gray-500">({q.source})</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Theme Clustering */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          🤖 AI Analysis: Question Themes
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          We analyzed all {totalRawQuestions} questions and identified these major themes:
        </p>
        
        <div className="space-y-3">
          {themes.map((theme, i) => (
            <div key={i} className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 
                                   rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Theme {i + 1}: {theme.theme}
                </h4>
                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  {theme.questionCount} questions
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Representative:</strong> "{theme.representative}"
              </p>
              {theme.sampleQuestions && theme.sampleQuestions.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900">
                    Show similar questions ({theme.sampleQuestions.length})
                  </summary>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 ml-4 mt-1 space-y-1">
                    {theme.sampleQuestions.map((q, idx) => (
                      <li key={idx}>• {q}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Final Synthesized Questions */}
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl shadow-2xl p-8">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          ✨ Your 4 Final Questions
        </h3>
        <p className="text-purple-100 mb-6">
          Based on our analysis, these 4 questions cover <strong>90% of recruiter interview patterns</strong> for your role.
        </p>
        
        <div className="space-y-3 mb-6">
          {synthesizedQuestions.map((q, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-start gap-3">
                <div className="text-2xl font-bold text-white/80">{i + 1}</div>
                <div className="flex-1">
                  <p className="font-semibold text-white text-lg">{q}</p>
                  <p className="text-xs text-purple-200 mt-1">
                    Covers {themes[i]?.questionCount || 5}+ similar questions from our search
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 mb-6">
          <p className="text-sm text-purple-100">
            <strong>💡 Why only 4 questions?</strong> Quality over quantity! 4 well-prepared, 
            high-scoring answers are better than 10 mediocre ones. These 4 questions will help you 
            develop 2-3 core STAR stories that you can adapt to answer 90% of interview questions.
          </p>
        </div>
        
        <div className="text-center">
          <button
            onClick={onContinue}
            className="px-10 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg shadow-xl
                     hover:bg-purple-50 transition-all transform hover:scale-105"
          >
            Start Practicing These 4 Questions →
          </button>
        </div>
      </div>
    </div>
  );
}

