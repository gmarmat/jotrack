"use client";

import { useState, useEffect } from 'react';
import { Search, Sparkles, AlertCircle, ChevronDown, ChevronUp, MessageSquare, X } from 'lucide-react';
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
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  
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
  
  const handleGenerateForPersona = async (persona: string) => {
    console.log(`✨ Generating questions for ${persona}...`);
    setIsGenerating(true);
    setError(null);
    setShowPersonaSelector(false);
    
    try {
      const res = await fetch(`/api/jobs/${jobId}/interview-questions/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }) // Pass persona to backend!
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
      
      console.log(`✅ Generated ${totalQuestions} AI questions for ${persona}`);
      
      // Auto-expand the selected persona
      if (persona === 'recruiter') {
        setExpandedPersona('recruiter');
      } else if (persona === 'hiring-manager') {
        setExpandedPersona('hiringManager');
      } else if (persona === 'peer') {
        setExpandedPersona('peer');
      }
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
          
          {/* View Prompt - Position 3 (shows all 3 persona prompts) */}
          <PromptViewer 
            promptKind="interview-questions-recruiter" 
            version="v1"
            buttonLabel="View Prompts"
            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-xs"
          />
          
          {/* View Sources - Position 4 */}
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
      
      {/* Empty State - Interview Scheduled Flow */}
      {searchedQuestions.length === 0 && !aiQuestions && !isSearching && !isGenerating && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full mb-4">
            <MessageSquare size={32} className="text-purple-600 dark:text-purple-400" />
          </div>
          
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Prepare for Your Interview
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            When you have an interview scheduled, click below to generate tailored questions and prep material.
          </p>
          
          {/* Main CTA Button */}
          <button
            onClick={() => setShowPersonaSelector(true)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            📅 I Have an Interview Scheduled
          </button>
          
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
            We'll generate questions specific to your interview type (Recruiter, Hiring Manager, or Peer)
          </p>
        </div>
      )}
      
      {/* Persona Selector Modal */}
      {showPersonaSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Who's Interviewing You?
              </h3>
              <button
                onClick={() => setShowPersonaSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Select the interview type to generate targeted prep questions:
            </p>
            
            <div className="space-y-3">
              {/* Recruiter */}
              <button
                onClick={() => {
                  setSelectedPersona('recruiter');
                  setShowPersonaSelector(false);
                  handleGenerateForPersona('recruiter');
                }}
                className="w-full flex items-start gap-3 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-2 border-cyan-200 dark:border-cyan-800 rounded-xl hover:border-cyan-400 dark:hover:border-cyan-600 transition-colors text-left"
              >
                <span className="text-3xl">👔</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Recruiter / HR</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Culture fit, motivation, logistics (10 questions)</p>
                </div>
              </button>
              
              {/* Hiring Manager */}
              <button
                onClick={() => {
                  setSelectedPersona('hiring_manager');
                  setShowPersonaSelector(false);
                  handleGenerateForPersona('hiring_manager');
                }}
                className="w-full flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl hover:border-purple-400 dark:hover:border-purple-600 transition-colors text-left"
              >
                <span className="text-3xl">👨‍💼</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Hiring Manager</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Experience, leadership, STAR method (15 questions)</p>
                </div>
              </button>
              
              {/* Peer/Panel */}
              <button
                onClick={() => {
                  setSelectedPersona('peer');
                  setShowPersonaSelector(false);
                  handleGenerateForPersona('peer');
                }}
                className="w-full flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors text-left"
              >
                <span className="text-3xl">👥</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Peer / Panel</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Technical depth, system design (12 questions)</p>
                </div>
              </button>
              
              {/* Generate All */}
              <button
                onClick={() => {
                  setSelectedPersona('all');
                  setShowPersonaSelector(false);
                  handleGenerate(); // Generate all 3 personas
                }}
                className="w-full flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl hover:border-purple-400 dark:hover:border-purple-600 transition-colors text-left"
              >
                <span className="text-3xl">✨</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">All Interview Types</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Generate all 37 questions (recruiter + HM + peer)</p>
                </div>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">
              💡 You can always generate additional types later
            </p>
          </div>
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

