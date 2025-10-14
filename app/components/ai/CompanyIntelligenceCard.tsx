'use client';

import { Building2, Users, DollarSign, TrendingUp, Target, Heart, Sparkles, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import PromptViewer from './PromptViewer';
import { LoadingShimmerCard } from '../LoadingShimmer';
import LoadingPulse from '../LoadingPulse';
import SourcesModal, { type Source } from './SourcesModal';

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
}

export default function CompanyIntelligenceCard({ 
  jobId,
  jobDescription,
  companyName,
  companyUrls = [],
  company, 
  isAiPowered, 
  onAnalyze,
  isAnalyzing: externalIsAnalyzing = false 
}: CompanyIntelligenceCardProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [internalIsAnalyzing, setInternalIsAnalyzing] = useState(false);
  const [localCompany, setLocalCompany] = useState<CompanyIntelligence | null>(company);
  const [error, setError] = useState<string | null>(null);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  
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
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="company-intelligence-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Building2 size={18} className="text-indigo-600" />
          Company Intelligence
        </h3>
        
        <div className="flex items-center gap-2">
          {!isAiPowered && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              Sample Data
            </span>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              data-testid="analyze-company-button"
            >
              <Sparkles size={14} className={isAnalyzing ? 'animate-pulse' : ''} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
            <PromptViewer 
              promptKind="company" 
              version="v1"
              buttonLabel=""
              className="px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
            />
            <button
              onClick={() => setShowSourcesModal(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
              title="View Sources"
              data-testid="sources-button"
            >
              <ExternalLink size={14} />
            </button>
          </div>
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
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
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h4 className="text-xl font-bold text-gray-900 mb-2">{displayCompany.name}</h4>
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
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
              <h5 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                <Target size={14} className="text-indigo-600" />
                What They Do
              </h5>
              <p className="text-sm text-gray-700">{displayCompany.description}</p>
            </div>
          )}

          {/* Key Facts */}
          {displayCompany.keyFacts && displayCompany.keyFacts.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <DollarSign size={14} className="text-green-600" />
                Key Facts
              </h5>
              <ul className="space-y-1">
                {displayCompany.keyFacts.map((fact, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
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
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" />
                Leadership
              </h5>
              <ul className="space-y-2">
                {displayCompany.leadership.map((leader, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    <span className="font-medium">{leader.name}</span> ({leader.role})
                    {leader.background && (
                      <span className="text-gray-600"> - {leader.background}</span>
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
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Heart size={14} className="text-pink-600" />
                Culture & Values
              </h5>
              <ul className="space-y-1">
                {displayCompany.culture.map((value, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-pink-500">•</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company Principles (New) */}
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Company Principles</h5>
            <p className="text-xs text-gray-500 italic">Not enough info available</p>
          </div>

          {/* Recent News (New) */}
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Recent News (Last 30 days)</h5>
            <p className="text-xs text-gray-500 italic">Not enough info available</p>
          </div>

          {/* Glassdoor/Culture Keywords (New) */}
          <div>
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Culture Keywords</h5>
            <p className="text-xs text-gray-500 italic">Not enough info available</p>
          </div>

          {/* Competitors */}
          {displayCompany.competitors && displayCompany.competitors.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-amber-600" />
                Key Competitors
              </h5>
              <div className="flex flex-wrap gap-2">
                {displayCompany.competitors.map((competitor, idx) => (
                  <span key={idx} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-md border border-amber-200">
                    {competitor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Why This Matters (always expanded) */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-1">Why this matters:</p>
        <p className="text-xs text-gray-600">
          Understanding the company&apos;s business, culture, and competitive landscape helps you tailor 
          your application, prepare better interview questions, and assess cultural fit.
        </p>
      </div>
      </>)}
    </div>
  );
}


