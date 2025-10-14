'use client';

import { Building2, TrendingUp, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import PromptViewer from './PromptViewer';

interface CompanyReference {
  name: string;
  relevanceScore: number; // 0-100
  reason: string;
  category: 'direct' | 'adjacent';
}

interface CompanyEcosystemMatrixProps {
  companies: CompanyReference[];
  isAiPowered: boolean;
}

export default function CompanyEcosystemMatrix({ companies, isAiPowered }: CompanyEcosystemMatrixProps) {
  const [expandedDirect, setExpandedDirect] = useState(false);
  const [expandedAdjacent, setExpandedAdjacent] = useState(false);
  
  const allDirectCompetitors = companies.filter(c => c.category === 'direct');
  const allAdjacentCompanies = companies.filter(c => c.category === 'adjacent');
  
  const directCompetitors = expandedDirect ? allDirectCompetitors : allDirectCompetitors.slice(0, 5);
  const adjacentCompanies = expandedAdjacent ? allAdjacentCompanies : allAdjacentCompanies.slice(0, 5);

  // Default sample data
  const sampleDirect: CompanyReference[] = [
    { name: 'CompetitorA', relevanceScore: 95, reason: 'Direct competitor, similar product', category: 'direct' },
    { name: 'CompetitorB', relevanceScore: 88, reason: 'Same market segment', category: 'direct' },
    { name: 'CompetitorC', relevanceScore: 82, reason: 'Overlapping features', category: 'direct' },
  ];

  const sampleAdjacent: CompanyReference[] = [
    { name: 'AdjacentCo1', relevanceScore: 75, reason: 'Complementary product, similar tech stack', category: 'adjacent' },
    { name: 'AdjacentCo2', relevanceScore: 68, reason: 'Adjacent market, transferable skills', category: 'adjacent' },
  ];

  const displayDirect = directCompetitors.length > 0 ? directCompetitors : sampleDirect;
  const displayAdjacent = adjacentCompanies.length > 0 ? adjacentCompanies : sampleAdjacent;

  const renderCompactCompany = (company: CompanyReference) => (
    <div key={company.name} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{company.name}</h4>
      <div className="text-xs text-gray-600 mb-2">
        Relevance: {company.relevanceScore}% | Fit: {company.relevanceScore - 5}% | Similar: {company.relevanceScore + 2}%
      </div>
      <p className="text-xs text-gray-700">{company.reason}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="company-ecosystem-matrix">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp size={18} className="text-indigo-600" />
          Company Ecosystem Matrix
        </h3>
        
        <div className="flex items-center gap-2">
          {!isAiPowered && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              Sample Data
            </span>
          )}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
            data-testid="analyze-ecosystem-button"
          >
            <Sparkles size={14} />
            Analyze
          </button>
          <PromptViewer 
            promptKind="ecosystem" 
            version="v1"
            buttonLabel=""
            className="px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
          />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct Competitors */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Building2 size={14} className="text-red-600" />
              Direct Competitors
            </h4>
            {allDirectCompetitors.length > 5 && (
              <button
                onClick={() => setExpandedDirect(!expandedDirect)}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {expandedDirect ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expandedDirect ? 'Show Less' : `Show All (${allDirectCompetitors.length})`}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {displayDirect.map(renderCompactCompany)}
          </div>
        </div>

        {/* Adjacent Companies */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-600" />
              Adjacent Companies
            </h4>
            {allAdjacentCompanies.length > 5 && (
              <button
                onClick={() => setExpandedAdjacent(!expandedAdjacent)}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {expandedAdjacent ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expandedAdjacent ? 'Show Less' : `Show All (${allAdjacentCompanies.length})`}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {displayAdjacent.map(renderCompactCompany)}
          </div>
        </div>
      </div>

      {/* Why This Matters (always expanded) */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-1">Why this matters:</p>
        <p className="text-xs text-gray-600">
          Knowing the competitive landscape helps you speak intelligently about the market, 
          identify transferable experience from similar companies, and broaden your job search 
          to adjacent opportunities.
        </p>
      </div>
    </div>
  );
}

