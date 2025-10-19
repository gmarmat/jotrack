"use client";

import { useState, useEffect } from 'react';
import { Search, Sparkles, AlertCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import AnalyzeButton from '@/app/components/ai/AnalyzeButton';
import PromptViewer from '@/app/components/ai/PromptViewer';
import SourcesModal from '@/app/components/ai/SourcesModal';

interface Question {
  question: string;
  category: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tip?: string;
  followUp?: string;
  starGuidance?: string;
  keyPoints?: string[];
  source?: string;
  url?: string;
}

interface InterviewQuestionsCardProps {
  jobId: string;
  companyName: string;
  roleTitle: string;
}

export default function InterviewQuestionsCard({
  jobId,
  companyName,
  roleTitle
}: InterviewQuestionsCardProps) {
  const [searchedQuestions, setSearchedQuestions] = useState<Question[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [searchedAt, setSearchedAt] = useState<number | null>(null);
  
  const [aiQuestions, setAiQuestions] = useState<any>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedPersona, setExpandedPersona] = useState<string | null>(null);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  
  // Format analyzed time
  const formatAnalyzedTime = (timestamp: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };
  
  // Load existing data on mount
  useEffect(() => {
    loadExistingQuestions();
  }, [jobId]);
  
  const loadExistingQuestions = async () => {
    // TODO: Load cached data from analysis-data endpoint
    console.log('📊 Loading existing interview questions...');
  };
  
  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/jobs/${jobId}/interview-questions/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, roleTitle })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Search failed');
      }
      
      const data = await res.json();
      setSearchedQuestions(data.questions);
      setSources(data.sources);
      setSearchedAt(data.searchedAt);
      
      console.log(`✅ Loaded ${data.questions.length} questions from web search`);
    } catch (err: any) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/jobs/${jobId}/interview-questions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }
      
      const data = await res.json();
      setAiQuestions(data);
      setGeneratedAt(data.generatedAt);
      
      const totalQuestions = 
        (data.recruiter?.questions?.length || 0) +
        (data.hiringManager?.questions?.length || 0) +
        (data.peer?.questions?.length || 0);
      
      console.log(`✅ Generated ${totalQuestions} AI questions`);
    } catch (err: any) {
      setError(err.message);
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
      data-testid="interview-questions-section"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
          Interview Questions
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Analyzed badge - right before buttons */}
          {(searchedAt || generatedAt) && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              {searchedAt && `Searched ${formatAnalyzedTime(searchedAt)}`}
              {searchedAt && generatedAt && ' • '}
              {generatedAt && `Generated ${formatAnalyzedTime(generatedAt)}`}
            </span>
          )}
          
          {/* Standard button order: Analyze -> Prompt -> Sources */}
          
          {/* Search Button - Position 1 */}
          <AnalyzeButton
            onAnalyze={handleSearch}
            isAnalyzing={isSearching}
            label="Search Web"
            estimatedCost={0.01}
            estimatedSeconds={10}
            icon={<Search size={14} />}
          />
          
          {/* Generate Button - Position 2 */}
          <AnalyzeButton
            onAnalyze={handleGenerate}
            isAnalyzing={isGenerating}
            label="Generate AI Questions"
            estimatedCost={0.05}
            estimatedSeconds={30}
            icon={<Sparkles size={14} />}
          />
          
          {/* View Sources - Position 3 */}
          {sources.length > 0 && (
            <button
              onClick={() => setShowSourcesModal(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400"
              title="View Sources"
              data-testid="view-sources-interview-questions"
            >
              <AlertCircle size={14} />
            </button>
          )}
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {/* Web Searched Questions */}
      {searchedQuestions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Search size={16} className="text-blue-600 dark:text-blue-400" />
            From Web Search ({searchedQuestions.length} questions)
          </h4>
          <div className="space-y-2">
            {searchedQuestions.slice(0, 10).map((q, idx) => (
              <QuestionCard key={idx} question={q} index={idx} persona="web" />
            ))}
          </div>
          {searchedQuestions.length > 10 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              + {searchedQuestions.length - 10} more questions (view all in sources)
            </p>
          )}
        </div>
      )}
      
      {/* AI Generated Questions by Persona */}
      {aiQuestions && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
            AI Generated (by interviewer type)
          </h4>
          
          {/* Recruiter */}
          <PersonaSection
            title="Recruiter Questions"
            icon="👔"
            color="cyan"
            questions={aiQuestions.recruiter?.questions || []}
            expanded={expandedPersona === 'recruiter'}
            onToggle={() => setExpandedPersona(expandedPersona === 'recruiter' ? null : 'recruiter')}
          />
          
          {/* Hiring Manager */}
          <PersonaSection
            title="Hiring Manager Questions"
            icon="👨‍💼"
            color="purple"
            questions={aiQuestions.hiringManager?.questions || []}
            expanded={expandedPersona === 'hiring_manager'}
            onToggle={() => setExpandedPersona(expandedPersona === 'hiring_manager' ? null : 'hiring_manager')}
          />
          
          {/* Peer/Panel */}
          <PersonaSection
            title="Peer/Panel Questions"
            icon="👥"
            color="indigo"
            questions={aiQuestions.peer?.questions || []}
            expanded={expandedPersona === 'peer'}
            onToggle={() => setExpandedPersona(expandedPersona === 'peer' ? null : 'peer')}
          />
        </div>
      )}
      
      {/* Empty State */}
      {searchedQuestions.length === 0 && !aiQuestions && !isSearching && !isGenerating && (
        <div className="text-center py-8">
          <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No interview questions yet. Search the web or generate with AI to start preparing.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            💡 Web search finds real questions from Glassdoor, Blind, etc.<br/>
            AI generates custom questions tailored to this role and company.
          </p>
        </div>
      )}
      
      {/* Sources Modal */}
      <SourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        sources={sources.map(url => ({ url, title: url }))}
        title="Interview Questions Sources"
      />
    </div>
  );
}

/**
 * Individual Question Card Component
 */
function QuestionCard({ 
  question, 
  index, 
  persona 
}: { 
  question: Question; 
  index: number;
  persona: string;
}) {
  const difficultyColors = {
    'Easy': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'Medium': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'Hard': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  };
  
  const bgColor = persona === 'web' 
    ? 'bg-blue-50 dark:bg-blue-900/10' 
    : persona === 'recruiter'
    ? 'bg-cyan-50 dark:bg-cyan-900/10'
    : persona === 'hiring_manager'
    ? 'bg-purple-50 dark:bg-purple-900/10'
    : 'bg-indigo-50 dark:bg-indigo-900/10';
  
  return (
    <div 
      className={`p-3 ${bgColor} rounded-lg`}
      data-testid={`question-${persona}-${index}`}
    >
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {question.question}
      </p>
      
      {/* Metadata badges */}
      {(question.category || question.difficulty) && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {question.category && (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
              {question.category}
            </span>
          )}
          {question.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded ${difficultyColors[question.difficulty]}`}>
              {question.difficulty}
            </span>
          )}
        </div>
      )}
      
      {/* Tip */}
      {question.tip && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          💡 <strong>Tip:</strong> {question.tip}
        </p>
      )}
      
      {/* STAR Guidance */}
      {question.starGuidance && (
        <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
          ⭐ <strong>STAR Method:</strong> {question.starGuidance}
        </p>
      )}
      
      {/* Key Points */}
      {question.keyPoints && question.keyPoints.length > 0 && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          <strong>Key points to discuss:</strong>
          <ul className="list-disc list-inside mt-1 ml-2 space-y-0.5">
            {question.keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Follow-up */}
      {question.followUp && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          🔄 <strong>Likely follow-up:</strong> {question.followUp}
        </p>
      )}
    </div>
  );
}

/**
 * Persona Section (Expandable)
 */
function PersonaSection({
  title,
  icon,
  color,
  questions,
  expanded,
  onToggle
}: {
  title: string;
  icon: string;
  color: 'cyan' | 'purple' | 'indigo';
  questions: Question[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const colorClasses = {
    cyan: {
      border: 'border-cyan-200 dark:border-cyan-800',
      bg: 'bg-cyan-50 dark:bg-cyan-900/10',
      hover: 'hover:bg-cyan-50 dark:hover:bg-cyan-900/10',
      badge: 'bg-cyan-600'
    },
    purple: {
      border: 'border-purple-200 dark:border-purple-800',
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/10',
      badge: 'bg-purple-600'
    },
    indigo: {
      border: 'border-indigo-200 dark:border-indigo-800',
      bg: 'bg-indigo-50 dark:bg-indigo-900/10',
      hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/10',
      badge: 'bg-indigo-600'
    }
  };
  
  const colors = colorClasses[color];
  const personaId = title.toLowerCase().replace(/\s/g, '-');
  
  return (
    <div 
      className={`border ${colors.border} rounded-lg`}
      data-testid={`${personaId}-section`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 ${colors.hover} transition-colors`}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{title}</span>
          <span className={`text-xs ${colors.badge} text-white px-2 py-0.5 rounded`}>
            {questions.length} questions
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="p-4 pt-0 space-y-3">
          {questions.map((q, idx) => (
            <QuestionCard 
              key={idx} 
              question={q} 
              index={idx} 
              persona={personaId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

