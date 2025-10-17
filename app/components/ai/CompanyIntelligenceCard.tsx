'use client';

import { Building2, Users, DollarSign, TrendingUp, Target, Heart, ExternalLink, AlertCircle, Search, Edit2, Save, X } from 'lucide-react';
import { useState } from 'react';
import PromptViewer from './PromptViewer';
import { LoadingShimmerCard } from '../LoadingShimmer';
import LoadingPulse from '../LoadingPulse';
import SourcesModal, { type Source } from './SourcesModal';
import AnalyzeButton from './AnalyzeButton';
import AnalysisExplanation from '../ui/AnalysisExplanation';

interface CompanyIntelligence {
  name: string;
  founded?: number;
  employees?: string;
  funding?: string;
  revenue?: string;
  description?: string;
  keyFacts?: string[];
  culture?: string[];
  leadership?: Array<{ name: string; role: string; background?: string }>;
  competitors?: string[];
}

interface CompanyIntelligenceCardProps {
  jobId: string;
  jobDescription: string;
  companyName: string;
  companyUrls?: string[];
  company: CompanyIntelligence | null;
  isAiPowered: boolean;
  onAnalyze?: () => Promise<void>;
  isAnalyzing?: boolean;
  metadata?: {
    cached: boolean;
    cacheAge: string;
    analyzedAt: number;
  };
}

export default function CompanyIntelligenceCard({ 
  jobId,
  jobDescription,
  companyName,
  companyUrls = [],
  company, 
  isAiPowered, 
  onAnalyze,
  isAnalyzing: externalIsAnalyzing = false,
  metadata,
}: CompanyIntelligenceCardProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [internalIsAnalyzing, setInternalIsAnalyzing] = useState(false);
  const [localCompany, setLocalCompany] = useState<CompanyIntelligence | null>(company);
  const [error, setError] = useState<string | null>(null);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  
  // Smart search and manual edit states
  const [searchingFor, setSearchingFor] = useState<string | null>(null);
  const [showManualEditModal, setShowManualEditModal] = useState<string | null>(null);
  const [manualInputText, setManualInputText] = useState('');
  
  // Mock sources for now - in real implementation, this would come from analysis data
  const sources: Source[] = [
    {
      url: 'https://example.com/company-profile',
      title: `${companyName} Company Profile`,
      type: 'other',
      dateAccessed: new Date().toISOString(),
      relevance: 'Primary source for company information'
    }
  ];

  const isAnalyzing = externalIsAnalyzing || internalIsAnalyzing;

  const handleAnalyze = async () => {
    if (onAnalyze) {
      await onAnalyze();
      return;
    }

    // Validate required data
    if (!jobDescription || jobDescription.trim() === '') {
      setError('Job Description is required. Please add it in Coach Mode or upload a JD attachment.');
      return;
    }
    
    if (!companyName || companyName.trim() === '') {
      setError('Company name is required. Please add it to the job details.');
      return;
    }

    // Default analysis logic
    setInternalIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/company-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobDescription,
          companyName,
          companyUrls,
          dryRun: !isAiPowered
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setLocalCompany(data.company);
    } catch (err: any) {
      console.error('Company analysis error:', err);
      setError(err.message || 'Analysis failed');
    } finally {
      setInternalIsAnalyzing(false);
    }
  };

  // Smart search for missing data (UI only for now)
  const handleSmartSearch = async (searchType: 'principles' | 'news' | 'culture') => {
    setSearchingFor(searchType);
    // TODO: Implement API call to /api/jobs/[id]/company-search
    // For now, just show that it's searching
    setTimeout(() => setSearchingFor(null), 2000);
  };

  // Manual edit handler
  const handleManualEdit = (field: 'principles' | 'news' | 'culture') => {
    setShowManualEditModal(field);
    setManualInputText('');
  };

  const handleSaveManualEdit = () => {
    // Validate word count
    const wordCount = manualInputText.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount > 100) {
      alert(`Please limit your input to 100 words or less. Current: ${wordCount} words.`);
      return;
    }
    
    // TODO: Process with AI to summarize into standard format
    // For now, just close modal
    setShowManualEditModal(null);
    setManualInputText('');
  };

  const defaultCompany: CompanyIntelligence = {
    name: 'Company Name',
    founded: 2018,
    employees: '250+',
    funding: 'Series B',
    description: 'Enterprise SaaS platform for modern teams',
    keyFacts: [
      'Revenue: $50M ARR',
      'Funding: $75M total raised',
      'Growth: 3x YoY'
    ],
    culture: [
      'Innovation-first mindset',
      'Remote-friendly culture',
      'Fast-paced startup environment'
    ],
    leadership: [
      { name: 'Jane Doe', role: 'CEO', background: 'ex-Google PM' },
      { name: 'John Smith', role: 'CTO', background: 'Stanford PhD' }
    ],
    competitors: ['CompanyA', 'CompanyB', 'CompanyC']
  };

  const displayCompany = localCompany || company || defaultCompany;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 p-6" data-testid="company-intelligence-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Building2 size={18} className="text-indigo-600" />
          Company Intelligence
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Analyzed badge - right before buttons */}
          {metadata?.cached && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              Analyzed {metadata.cacheAge}
            </span>
          )}

          {/* Standard button order: Analyze -> Prompt -> Sources */}

          {/* AI Analysis - Position 1 */}
          <AnalyzeButton
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            label="Analyze Company Intelligence"
          />

          {/* View Prompt - Position 2 */}
          <PromptViewer 
            promptKind="company" 
            version="v1"
            buttonLabel=""
            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          />

          {/* View Sources - Position 3 */}
          <button
            onClick={() => setShowSourcesModal(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400"
            title="View Sources"
            data-testid="sources-button"
          >
            <AlertCircle size={14} />
          </button>
        </div>
      </div>
      
      {/* Sources Modal */}
      <SourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        title="Company Intelligence Sources"
        sources={sources}
      />

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-800 dark:text-red-400">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && !company && !localCompany && (
        <LoadingShimmerCard />
      )}

      {/* Content */}
      {(!isAnalyzing || company || localCompany) && (<>
      {/* Company Name & Quick Stats */}
      <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{displayCompany.name}</h4>
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
          {displayCompany.founded && (
            <span>Founded {displayCompany.founded}</span>
          )}
          {displayCompany.employees && (
            <span>• {displayCompany.employees} employees</span>
          )}
          {displayCompany.funding && (
            <span>• {displayCompany.funding}</span>
          )}
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN: TL;DR + Spend Analysis */}
        <div className="space-y-4">
          {/* What They Do */}
          {displayCompany.description && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-1.5">
                <Target size={14} className="text-indigo-600" />
                What They Do
              </h5>
              <p className="text-sm text-gray-700 dark:text-gray-300">{displayCompany.description}</p>
            </div>
          )}

          {/* Key Facts */}
          {displayCompany.keyFacts && displayCompany.keyFacts.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                <DollarSign size={14} className="text-green-600" />
                Key Facts
              </h5>
              <ul className="space-y-1">
                {displayCompany.keyFacts.map((fact, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Leadership */}
          {displayCompany.leadership && displayCompany.leadership.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" />
                Leadership
              </h5>
              <ul className="space-y-2">
                {displayCompany.leadership.map((leader, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{leader.name}</span> ({leader.role})
                    {leader.background && (
                      <span className="text-gray-600 dark:text-gray-400"> - {leader.background}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: New sections */}
        <div className="space-y-4">
          {/* Culture & Values */}
          {displayCompany.culture && displayCompany.culture.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                <Heart size={14} className="text-pink-600" />
                Culture & Values
              </h5>
              <ul className="space-y-1">
                {displayCompany.culture.map((value, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-pink-500">•</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company Principles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Company Principles</h5>
              {(!displayCompany.culture || displayCompany.culture.length === 0) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSmartSearch('principles')}
                    disabled={searchingFor === 'principles'}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400 disabled:opacity-50"
                    title="Search web for company principles"
                  >
                    <Search size={12} />
                    {searchingFor === 'principles' ? 'Searching...' : 'Find'}
                  </button>
                  <button
                    onClick={() => handleManualEdit('principles')}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    title="Manually add from your research"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                </div>
              )}
            </div>
            {(!displayCompany.culture || displayCompany.culture.length === 0) ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">Not enough info available</p>
            ) : (
              <ul className="space-y-1">
                {displayCompany.culture.map((principle, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent News */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent News (Last 30 days)</h5>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSmartSearch('news')}
                  disabled={searchingFor === 'news'}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400 disabled:opacity-50"
                  title="Search web for recent news"
                >
                  <Search size={12} />
                  {searchingFor === 'news' ? 'Searching...' : 'Find'}
                </button>
                <button
                  onClick={() => handleManualEdit('news')}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  title="Manually add from your research"
                >
                  <Edit2 size={12} />
                  Edit
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">Not enough info available</p>
          </div>

          {/* Culture Keywords */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Culture Keywords</h5>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSmartSearch('culture')}
                  disabled={searchingFor === 'culture'}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400 disabled:opacity-50"
                  title="Search web for culture keywords"
                >
                  <Search size={12} />
                  {searchingFor === 'culture' ? 'Searching...' : 'Find'}
                </button>
                <button
                  onClick={() => handleManualEdit('culture')}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  title="Manually add from your research"
                >
                  <Edit2 size={12} />
                  Edit
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">Not enough info available</p>
          </div>

          {/* Competitors */}
          {displayCompany.competitors && displayCompany.competitors.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-amber-600" />
                Key Competitors
              </h5>
              <div className="flex flex-wrap gap-2">
                {displayCompany.competitors.map((competitor, idx) => (
                  <span key={idx} className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded-md border border-amber-200 dark:border-amber-800">
                    {competitor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Standard Analysis Explanation - 2nd Last Position */}
      <AnalysisExplanation>
        <p>
          We research the target company to provide you with business context, culture insights, 
          and competitive intelligence. This helps you speak knowledgeably during interviews 
          and assess if the company aligns with your career goals.
        </p>
        
        <div>
          <p className="font-semibold mb-2">Our Analysis Methodology:</p>
          <ul className="space-y-1 text-xs">
            <li>• Company Profile: Founded, size, funding, revenue estimates from public sources</li>
            <li>• Key Facts: Notable milestones, recent news, product launches</li>
            <li>• Culture: Values, work environment, employee sentiment (reviews, social media)</li>
            <li>• Leadership: CEO/CTO backgrounds, career paths, communication styles</li>
            <li>• Competitors: Direct and adjacent competitors for market context</li>
          </ul>
        </div>
        
        <div>
          <p className="font-semibold mb-2">Data Sources:</p>
          <ul className="space-y-1 text-xs">
            <li>• Public company websites, press releases, news articles</li>
            <li>• Employee reviews (Glassdoor, Blind)</li>
            <li>• Funding databases (Crunchbase, PitchBook)</li>
            <li>• Industry reports and analyst coverage</li>
          </ul>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Note: AI-powered analysis may use web search to gather recent information.
        </p>
      </AnalysisExplanation>

      {/* Why This Matters - Last Position */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Why this matters:</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Understanding the company's business, culture, and competitive landscape helps you tailor 
          your application, prepare better interview questions, and assess cultural fit.
        </p>
      </div>
      </>)}

      {/* Manual Edit Modal */}
      {showManualEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowManualEditModal(null)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Add {showManualEditModal === 'principles' ? 'Company Principles' : showManualEditModal === 'news' ? 'Recent News' : 'Culture Keywords'}
              </h3>
              <button
                onClick={() => setShowManualEditModal(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Paste your research here (max 100 words). We'll use AI to summarize it into our standard format.
            </p>

            <textarea
              value={manualInputText}
              onChange={(e) => setManualInputText(e.target.value)}
              placeholder={`Example: ${showManualEditModal === 'principles' ? 'Fortive Business System: Continuous Improvement, Customer Focus, Accountability...' : showManualEditModal === 'news' ? 'New CEO announced, Q3 earnings beat expectations...' : 'Innovation-driven, collaborative, fast-paced...'}`}
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 text-sm"
              maxLength={600}
            />

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {manualInputText.trim().split(/\s+/).filter(w => w.length > 0).length} / 100 words
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowManualEditModal(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveManualEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save size={16} />
                  Save & Summarize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


