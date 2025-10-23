'use client';

import { ChevronDown, ChevronUp, Plus, GripVertical } from 'lucide-react';
import { useState } from 'react';

interface Theme {
  theme: string;
  questionCount: number;
  representative: string;
  sampleQuestions: string[];
}

interface CustomQuestion {
  id: string;
  text: string;
  category: 'behavioral' | 'technical' | 'situational';
  source: 'custom';
}

interface Props {
  questionBank: any;
  synthesizedQuestions: string[];
  themes: Theme[];
  onContinue: (selectedQuestions: string[]) => void;
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
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustomQuestion, setNewCustomQuestion] = useState('');
  const [newCustomCategory, setNewCustomCategory] = useState<'behavioral' | 'technical' | 'situational'>('behavioral');
  
  const totalRawQuestions = 
    (questionBank.webQuestions?.length || 0) +
    Object.values(questionBank.aiQuestions || {}).reduce((acc: number, p: any) => 
      acc + (p?.questions?.length || 0), 0);

  // Helper functions for question management
  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const selectAllQuestions = () => {
    const allQuestionIds = [
      ...synthesizedQuestions.map((_, i) => `synthesized-${i}`),
      ...customQuestions.map(q => q.id)
    ];
    setSelectedQuestionIds(allQuestionIds);
  };

  const deselectAllQuestions = () => {
    setSelectedQuestionIds([]);
  };

  const addCustomQuestion = () => {
    if (newCustomQuestion.trim().length < 10) return;
    
    const customQ: CustomQuestion = {
      id: `custom-${Date.now()}`,
      text: newCustomQuestion.trim(),
      category: newCustomCategory,
      source: 'custom'
    };
    
    setCustomQuestions(prev => [...prev, customQ]);
    setNewCustomQuestion('');
    setShowAddCustom(false);
  };

  const removeCustomQuestion = (questionId: string) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== questionId));
    setSelectedQuestionIds(prev => prev.filter(id => id !== questionId));
  };

  const getSelectedQuestions = () => {
    const selected = [];
    
    // Add selected synthesized questions
    selectedQuestionIds.forEach(id => {
      if (id.startsWith('synthesized-')) {
        const index = parseInt(id.split('-')[1]);
        if (synthesizedQuestions[index]) {
          selected.push(synthesizedQuestions[index]);
        }
      }
    });
    
    // Add selected custom questions
    selectedQuestionIds.forEach(id => {
      const customQ = customQuestions.find(q => q.id === id);
      if (customQ) {
        selected.push(customQ.text);
      }
    });
    
    return selected;
  };

  const handleContinue = () => {
    const selectedQuestions = getSelectedQuestions();
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question to continue.');
      return;
    }
    onContinue(selectedQuestions);
  };
  
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
        
        {/* Compact breakdown */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>
            Found <strong>{questionBank.webQuestions?.length || 0} web questions</strong> from Glassdoor/Reddit/Blind, 
            generated <strong>{Object.values(questionBank.aiQuestions || {}).reduce((acc: number, p: any) => acc + (p?.questions?.length || 0), 0)} AI questions</strong>, 
            and synthesized into <strong>{synthesizedQuestions.length} final questions</strong> for practice.
          </p>
        </div>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            ✨ Your Questions
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllQuestions}
              className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAllQuestions}
              className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
        
        <p className="text-purple-100 mb-6">
          Select the questions you want to practice. You can choose from our AI-synthesized questions or add your own.
        </p>
        
        <div className="space-y-3 mb-6">
          {synthesizedQuestions.map((q, i) => {
            const questionId = `synthesized-${i}`;
            const isSelected = selectedQuestionIds.includes(questionId);
            
            return (
              <div key={i} className={`bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20 transition-all ${
                isSelected ? 'ring-2 ring-yellow-400' : ''
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleQuestionSelection(questionId)}
                    className="mt-1 w-4 h-4 text-yellow-400 bg-white/20 border-white/30 rounded focus:ring-yellow-400"
                    data-testid="question-checkbox"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white text-lg">{q}</p>
                    <p className="text-xs text-purple-200 mt-1">
                      Covers {themes[i]?.questionCount || 5}+ similar questions from our search
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Questions Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-white">Custom Questions</h4>
            <button
              onClick={() => setShowAddCustom(!showAddCustom)}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Custom Question
            </button>
          </div>

          {showAddCustom && (
            <div className="bg-white/10 rounded-lg p-4 mb-4 backdrop-blur-sm border border-white/20">
              <textarea
                value={newCustomQuestion}
                onChange={(e) => setNewCustomQuestion(e.target.value)}
                placeholder="Enter your custom question..."
                className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                rows={3}
              />
              <div className="flex items-center gap-3 mt-3">
                <select
                  value={newCustomCategory}
                  onChange={(e) => setNewCustomCategory(e.target.value as any)}
                  className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                >
                  <option value="behavioral">Behavioral</option>
                  <option value="technical">Technical</option>
                  <option value="situational">Situational</option>
                </select>
                <button
                  onClick={addCustomQuestion}
                  disabled={newCustomQuestion.trim().length < 10}
                  className="px-4 py-2 bg-yellow-400 text-purple-600 rounded-lg font-semibold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Question
                </button>
                <button
                  onClick={() => setShowAddCustom(false)}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {customQuestions.length > 0 && (
            <div className="space-y-2">
              {customQuestions.map((customQ) => {
                const isSelected = selectedQuestionIds.includes(customQ.id);
                
                return (
                  <div key={customQ.id} className={`bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20 transition-all ${
                    isSelected ? 'ring-2 ring-yellow-400' : ''
                  }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleQuestionSelection(customQ.id)}
                        className="mt-1 w-4 h-4 text-yellow-400 bg-white/20 border-white/30 rounded focus:ring-yellow-400"
                        data-testid="custom-question-checkbox"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-white text-lg">{customQ.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                            Custom
                          </span>
                          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                            {customQ.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCustomQuestion(customQ.id)}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selection Summary */}
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 mb-6">
          <p className="text-sm text-purple-100">
            <strong>📊 Selection Summary:</strong> {selectedQuestionIds.length} questions selected
            {selectedQuestionIds.length > 0 && (
              <span className="ml-2 text-yellow-200">
                ({synthesizedQuestions.filter((_, i) => selectedQuestionIds.includes(`synthesized-${i}`)).length} AI-synthesized, 
                {customQuestions.filter(q => selectedQuestionIds.includes(q.id)).length} custom)
              </span>
            )}
          </p>
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
            onClick={handleContinue}
            className="px-10 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg shadow-xl
                     hover:bg-purple-50 transition-all transform hover:scale-105"
          >
            Start Practicing {selectedQuestionIds.length} Selected Questions →
          </button>
        </div>
      </div>
    </div>
  );
}

