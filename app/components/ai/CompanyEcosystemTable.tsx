'use client';

import { ChevronDown, ChevronUp, Building2, TrendingUp, ExternalLink, Target, Briefcase, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import PromptViewer from './PromptViewer';
import SourcesModal, { type Source } from './SourcesModal';
import AnalyzeButton from './AnalyzeButton';

// Enhanced data model for MVP
export interface EcosystemCompany {
  // Basic Info (Required)
  name: string;
  category: 'direct' | 'adjacent' | 'upstream' | 'downstream' | 'complementary';
  
  // Company Profile (MVP Fields)
  size: {
    employees: string; // "1,000-5,000", "500+"
    sizeCategory: 'startup' | 'scaleup' | 'enterprise' | 'unknown';
  };
  industry: {
    broad: string; // "Technology", "Finance"
    specific: string; // "SaaS", "Fintech"
  };
  location: {
    headquarters: string; // "San Francisco, CA, USA"
    region: string; // "North America"
    isRemote: boolean;
  };
  
  // Leadership (MVP)
  leadership?: {
    ceo: string | null;
    ceoBackground: string | null;
  };
  
  // Career Metrics (MVP - 1-5 scale)
  careerMetrics: {
    growthScore: number; // 1-5
    stabilityScore: number; // 1-5
    retentionScore: number; // 1-5
    avgTenure?: string; // "3.2 years"
  };
  
  // News Intelligence (MVP - 60 days)
  recentNews: {
    positive: number; // Count of positive items
    negative: number; // Count of negative items
    highlights: string[]; // Top 3-5 items with +/- prefix
  };
  
  // Skills & Hiring (MVP)
  skillsIntel?: {
    currentHotSkills: string[]; // ["React", "AWS"]
    futureSkills?: string[]; // ["AI/ML"]
    hiringTrend: 'growing' | 'stable' | 'declining' | 'unknown';
    openRoles: number | null;
  };
  
  // Match & Relevance (Existing)
  relevanceScore: number; // 0-100
  reason: string; // One sentence
  careerOpportunity: 'high' | 'medium' | 'low';
  interviewRelevance: string;
  
  // Confidence & Sources (MVP)
  confidence: {
    score: 'high' | 'medium' | 'low';
    percentage: number; // 0-100
  };
  
  // Insights Summary (MVP - powers compact view)
  insights: string; // 3-4 sentences summarizing everything
  
  // Data Sources (MVP)
  sources: {
    name: string; // "LinkedIn", "TechCrunch"
    url: string;
    category: 'company' | 'news' | 'hiring' | 'reviews' | 'other';
    confidence: 'high' | 'medium' | 'low';
  }[];
}

interface CompanyEcosystemTableProps {
  companies: EcosystemCompany[];
  isAiPowered: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  sources?: Source[];
}

export default function CompanyEcosystemTable({ 
  companies, 
  isAiPowered,
  onRefresh,
  refreshing = false,
  sources = []
}: CompanyEcosystemTableProps) {
  const [showDetailedTable, setShowDetailedTable] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  
  // Sample data if no companies provided
  const sampleCompanies: EcosystemCompany[] = [
    { 
      name: 'Notion', 
      category: 'direct', 
      relevanceScore: 95, 
      reason: 'Direct competitor in collaborative workspace market with similar product features',
      careerOpportunity: 'high',
      interviewRelevance: 'Very likely - main competitor comparison'
    },
    { 
      name: 'Asana', 
      category: 'direct', 
      relevanceScore: 88, 
      reason: 'Project management focus with overlapping features and target market',
      careerOpportunity: 'high',
      interviewRelevance: 'Likely - another major competitor'
    },
    { 
      name: 'Slack', 
      category: 'complementary', 
      relevanceScore: 72, 
      reason: 'Complementary communication tool, often used alongside collaboration platforms',
      careerOpportunity: 'medium',
      interviewRelevance: 'Possible - integration partner discussion'
    },
    { 
      name: 'AWS', 
      category: 'upstream', 
      relevanceScore: 65, 
      reason: 'Infrastructure provider - likely hosting platform for this SaaS product',
      careerOpportunity: 'medium',
      interviewRelevance: 'Possible - technical infrastructure discussion'
    },
    { 
      name: 'Figma', 
      category: 'adjacent', 
      relevanceScore: 68, 
      reason: 'Real-time collaboration technology in different product category (design vs docs)',
      careerOpportunity: 'high',
      interviewRelevance: 'Possible - similar tech stack discussion'
    },
  ];

  const displayCompanies = companies.length > 0 ? companies : sampleCompanies;

  // Group by category
  const categories = {
    direct: {
      name: 'Direct Competitors',
      icon: Building2,
      color: 'red',
      companies: displayCompanies.filter(c => c.category === 'direct')
    },
    adjacent: {
      name: 'Adjacent Markets',
      icon: TrendingUp,
      color: 'blue',
      companies: displayCompanies.filter(c => c.category === 'adjacent')
    },
    upstream: {
      name: 'Upstream Partners',
      icon: Target,
      color: 'purple',
      companies: displayCompanies.filter(c => c.category === 'upstream')
    },
    downstream: {
      name: 'Downstream Partners',
      icon: Briefcase,
      color: 'green',
      companies: displayCompanies.filter(c => c.category === 'downstream')
    },
    complementary: {
      name: 'Complementary Products',
      icon: MessageCircle,
      color: 'orange',
      companies: displayCompanies.filter(c => c.category === 'complementary')
    }
  };

  const totalCompanies = displayCompanies.length;
  const avgRelevance = displayCompanies.length > 0 
    ? (displayCompanies.reduce((sum, c) => sum + c.relevanceScore, 0) / displayCompanies.length).toFixed(0)
    : 0;

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleExpandAll = () => {
    if (expandedCategories.size > 0) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(['direct', 'adjacent', 'upstream', 'downstream', 'complementary']));
    }
  };

  const getCareerOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case 'high': return 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
      default: return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 85) return 'text-green-700 dark:text-green-400';
    if (score >= 70) return 'text-blue-700 dark:text-blue-400';
    if (score >= 60) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-gray-700 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6" data-testid="company-ecosystem-table">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Company Ecosystem</h3>
          {!isAiPowered && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              Sample Data
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {onRefresh && (
            <AnalyzeButton
              onAnalyze={onRefresh}
              isAnalyzing={refreshing}
              label="Analyze Ecosystem"
            />
          )}
          <PromptViewer 
            promptKind="ecosystem" 
            version="v1"
            buttonLabel=""
            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          />
          {sources.length > 0 && (
            <button
              onClick={() => setShowSourcesModal(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="View Sources"
            >
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Sources Modal */}
      <SourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        title="Company Ecosystem Sources"
        sources={sources}
      />

      {/* Summary Stats */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-cyan-600 dark:text-cyan-400">
            {totalCompanies}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Companies identified • Avg relevance: {avgRelevance}% • 
              {categories.direct.companies.length > 0 && ` ${categories.direct.companies.length} direct competitors`}
              {categories.adjacent.companies.length > 0 && ` • ${categories.adjacent.companies.length} adjacent markets`}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle Detailed View */}
      <button
        onClick={() => setShowDetailedTable(!showDetailedTable)}
        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
      >
        {showDetailedTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showDetailedTable ? 'Hide Detailed Table' : 'Show Detailed Table'}
      </button>

      {/* Detailed Table */}
      {showDetailedTable && (
        <div className="space-y-4">
          {/* Expand All / Collapse All */}
          <div className="flex justify-end">
            <button
              onClick={toggleExpandAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {expandedCategories.size > 0 ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          {/* Categories */}
          {Object.entries(categories).map(([key, category]) => {
            if (category.companies.length === 0) return null;
            
            const isExpanded = expandedCategories.has(key);
            const Icon = category.icon;

            return (
              <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(key)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={`text-${category.color}-600 dark:text-${category.color}-400`} />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {category.name} ({category.companies.length})
                    </h4>
                  </div>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Category Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Company</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Relevance</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Career Fit</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Why Relevant</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Interview Relevance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.companies.map((company, idx) => (
                          <tr 
                            key={`${company.name}-${idx}`}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                              {company.name}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${getRelevanceColor(company.relevanceScore)}`}>
                                {company.relevanceScore}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getCareerOpportunityColor(company.careerOpportunity)}`}>
                                {company.careerOpportunity.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {company.reason}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                              {company.interviewRelevance}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Why This Matters (always visible) */}
      {!showDetailedTable && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Why this matters:</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Understanding the competitive landscape helps you speak intelligently about the market, 
            identify transferable experience from similar companies, and broaden your job search 
            to adjacent opportunities. This research will be discussed in interviews.
          </p>
        </div>
      )}
    </div>
  );
}

