'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Filter, Search, Sparkles } from 'lucide-react';

interface QuestionSelectionProps {
  jobId: string;
  interviewCoachState: any;
  setInterviewCoachState: (state: any) => void;
}

interface Question {
  id: string;
  question: string;
  category: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  persona: string;
  tip?: string;
}

/**
 * Question Selection Component
 * Loads questions from Interview Questions section
 * Allows user to select 8-10 questions for practice
 */
export function QuestionSelection({
  jobId,
  interviewCoachState,
  setInterviewCoachState
}: QuestionSelectionProps) {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPersona, setFilterPersona] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  
  const selectedQuestions = interviewCoachState.selectedQuestions || [];
  
  // Load questions from Interview Questions section
  useEffect(() => {
    loadQuestions();
  }, [jobId]);
  
  // Filter questions when filters change
  useEffect(() => {
    let filtered = [...allQuestions];
    
    if (filterPersona !== 'all') {
      filtered = filtered.filter(q => q.persona === filterPersona);
    }
    
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === filterDifficulty);
    }
    
    setFilteredQuestions(filtered);
  }, [allQuestions, filterPersona, filterDifficulty]);
  
  const loadQuestions = async () => {
    try {
      setLoading(true);
      
      // Load from analysis-data endpoint
      const res = await fetch(`/api/jobs/${jobId}/analysis-data`);
      if (!res.ok) throw new Error('Failed to load questions');
      
      const data = await res.json();
      
      console.log('📊 Analysis data received:', {
        hasInterviewQuestionsCache: !!data.interviewQuestionsCache,
        hasJobInterviewQuestions: !!data.jobInterviewQuestions,
        cacheKeys: data.interviewQuestionsCache ? Object.keys(data.interviewQuestionsCache) : [],
        jiqKeys: data.jobInterviewQuestions ? Object.keys(data.jobInterviewQuestions) : []
      });
      
      const questions: Question[] = [];
      
      // Load from searched questions
      if (data.interviewQuestionsCache?.searchedQuestions) {
        const searched = JSON.parse(data.interviewQuestionsCache.searchedQuestions);
        searched.forEach((q: any, index: number) => {
          questions.push({
            id: `searched_${index}`,
            question: q.question,
            category: q.category || 'General',
            difficulty: q.difficulty,
            persona: 'all',
            tip: q.tip
          });
        });
      }
      
      // Load from AI-generated questions
      if (data.jobInterviewQuestions) {
        const jiq = data.jobInterviewQuestions;
        
        if (jiq.recruiterQuestions) {
          const recruiter = JSON.parse(jiq.recruiterQuestions);
          recruiter.forEach((q: any, index: number) => {
            questions.push({
              id: `recruiter_${index}`,
              question: q.question,
              category: q.category || 'General',
              difficulty: q.difficulty,
              persona: 'recruiter',
              tip: q.tip
            });
          });
        }
        
        if (jiq.hiringManagerQuestions) {
          const hm = JSON.parse(jiq.hiringManagerQuestions);
          hm.forEach((q: any, index: number) => {
            questions.push({
              id: `hm_${index}`,
              question: q.question,
              category: q.category || 'Technical',
              difficulty: q.difficulty,
              persona: 'hiring-manager',
              tip: q.tip
            });
          });
        }
        
        if (jiq.peerQuestions) {
          const peer = JSON.parse(jiq.peerQuestions);
          peer.forEach((q: any, index: number) => {
            questions.push({
              id: `peer_${index}`,
              question: q.question,
              category: q.category || 'Technical',
              difficulty: q.difficulty,
              persona: 'peer',
              tip: q.tip
            });
          });
        }
      }
      
      setAllQuestions(questions);
      setFilteredQuestions(questions);
      
      console.log(`✅ Loaded ${questions.length} interview questions`);
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleQuestion = (questionId: string) => {
    const newSelected = selectedQuestions.includes(questionId)
      ? selectedQuestions.filter((id: string) => id !== questionId)
      : [...selectedQuestions, questionId];
    
    setInterviewCoachState((prev: any) => ({
      ...prev,
      selectedQuestions: newSelected,
      progress: {
        ...prev.progress,
        questionsSelected: newSelected.length
      }
    }));
  };
  
  const getQuestionData = (questionId: string) => {
    return allQuestions.find(q => q.id === questionId);
  };
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading interview questions...</p>
      </div>
    );
  }
  
  if (allQuestions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
        <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          No Questions Available Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Go back to the job detail page and generate interview questions first.
        </p>
        <a
          href={`/jobs/${jobId}`}
          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          ← Back to Job Details
        </a>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Select Interview Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose 8-10 questions to prepare. We'll help you iterate until each answer scores 75+.
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">
              {selectedQuestions?.length || 0}
            </div>
            <div className="text-sm text-gray-500">selected</div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Persona
            </label>
            <select
              value={filterPersona}
              onChange={(e) => setFilterPersona(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Personas</option>
              <option value="recruiter">Recruiter</option>
              <option value="hiring-manager">Hiring Manager</option>
              <option value="peer">Peer / Panel</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
        
        {(selectedQuestions?.length || 0) >= 3 && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              ✅ Great! You've selected {selectedQuestions?.length || 0} questions. 
              Click the <strong>"Practice & Score"</strong> tab to start practicing.
            </p>
          </div>
        )}
      </div>
      
      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.map((question) => {
          const isSelected = selectedQuestions.includes(question.id);
          
          return (
            <button
              key={question.id}
              onClick={() => toggleQuestion(question.id)}
              className={`w-full text-left p-6 rounded-xl transition-all ${
                isSelected
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 shadow-lg'
                  : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 shadow'
              }`}
              data-testid="question-item"
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  {isSelected ? (
                    <CheckCircle className="w-6 h-6 text-purple-600" data-testid="question-checkbox-checked" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" data-testid="question-checkbox" />
                  )}
                </div>
                
                {/* Question Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      question.persona === 'recruiter'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : question.persona === 'hiring-manager'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : question.persona === 'peer'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {question.persona === 'all' ? question.category : question.persona.replace('-', ' ')}
                    </span>
                    
                    {question.difficulty && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        question.difficulty === 'Easy'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : question.difficulty === 'Medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {question.difficulty}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-base font-medium text-gray-900 dark:text-white mb-2" data-testid="question-text">
                    {question.question}
                  </p>
                  
                  {question.tip && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      💡 {question.tip}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {filteredQuestions.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No questions match your filters. Try adjusting the filters above.
          </p>
        </div>
      )}
    </div>
  );
}

