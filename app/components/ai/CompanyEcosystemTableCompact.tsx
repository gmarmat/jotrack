'use client';

import { ExternalLink, Maximize2, AlertCircle } from 'lucide-react';
import { type EcosystemCompany } from './CompanyEcosystemTable';
import PromptViewer from './PromptViewer';
import AnalyzeButton from './AnalyzeButton';
import AnalysisExplanation from '../ui/AnalysisExplanation';

interface CompanyEcosystemTableCompactProps {
  companies: EcosystemCompany[];
  isAiPowered: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  onViewFull?: () => void; // Opens full modal
  cacheMetadata?: {
    cached: boolean;
    cacheAge?: string;
    cacheExpiresIn?: string;
  };
}

export default function CompanyEcosystemTableCompact({ 
  companies, 
  isAiPowered,
  onRefresh,
  refreshing = false,
  onViewFull,
  cacheMetadata
}: CompanyEcosystemTableCompactProps) {
  
  // Sample data (MVP)
  const sampleCompanies: EcosystemCompany[] = [
    { 
      name: 'Notion', 
      category: 'direct',
      size: {
        employees: '1,000-5,000',
        sizeCategory: 'scaleup'
      },
      industry: {
        broad: 'Technology',
        specific: 'SaaS'
      },
      location: {
        headquarters: 'San Francisco, CA',
        region: 'North America',
        isRemote: true
      },
      leadership: {
        ceo: 'Ivan Zhao',
        ceoBackground: 'Ex-Inkling, Y Combinator'
      },
      careerMetrics: {
        growthScore: 5,
        stabilityScore: 4,
        retentionScore: 4,
        avgTenure: '3.2 years'
      },
      recentNews: {
        positive: 3,
        negative: 1,
        highlights: [
          '+ Series C funding ($275M)',
          '+ 10M users milestone',
          '+ Acquired Cron Calendar',
          '- Layoffs rumor (unverified)'
        ]
      },
      skillsIntel: {
        currentHotSkills: ['React', 'TypeScript', 'PostgreSQL'],
        futureSkills: ['AI/ML', 'Real-time Collaboration'],
        hiringTrend: 'growing',
        openRoles: 47
      },
      relevanceScore: 95,
      reason: 'Direct competitor in collaborative workspace market with similar product features',
      interviewPrepValue: 'very-likely',
      interviewRelevance: 'Main competitor - prepare product differentiation points',
      confidence: {
        score: 'high',
        percentage: 92
      },
      insights: 'Market leader in collaborative workspace sector with strong product-market fit and innovative design culture. Known for real-time collaboration tech similar to target company. Interview prep: Prepare to discuss product differentiation, technical architecture choices, and how you\'d approach scaling challenges they\'ve solved.',
      sources: [
        { name: 'LinkedIn', url: 'https://linkedin.com/company/notion', category: 'company', confidence: 'high' },
        { name: 'TechCrunch', url: 'https://techcrunch.com/notion', category: 'news', confidence: 'high' }
      ]
    },
  ];

  const displayCompanies = companies.length > 0 ? companies : sampleCompanies;

  const totalCompanies = displayCompanies.length;
  const avgConfidence = displayCompanies.length > 0
    ? displayCompanies.filter(c => c.confidence.score === 'high').length >= displayCompanies.length * 0.7
      ? 'HIGH' 
      : displayCompanies.filter(c => c.confidence.score === 'high').length >= displayCompanies.length * 0.4
      ? 'MEDIUM'
      : 'LOW'
    : 'MEDIUM';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'direct': return '🔴';
      case 'adjacent': return '🔵';
      case 'upstream': return '🟣';
      case 'downstream': return '🟢';
      case 'complementary': return '🟠';
      default: return '⚪';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'direct': return 'Direct';
      case 'adjacent': return 'Adjacent';
      case 'upstream': return 'Upstream';
      case 'downstream': return 'Downstream';
      case 'complementary': return 'Complem.';
      default: return category;
    }
  };

  const renderStars = (score: number) => {
    return '●'.repeat(score) + '○'.repeat(5 - score);
  };

  const getConfidenceBadge = (confidence: { score: string; percentage: number }) => {
    const colors = {
      high: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      low: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[confidence.score as keyof typeof colors] || colors.medium}`}>
        {confidence.score.toUpperCase()}
      </span>
    );
  };

  const getHiringTrendIcon = (trend: string) => {
    switch (trend) {
      case 'growing': return '↗';
      case 'declining': return '↘';
      case 'stable': return '→';
      default: return '?';
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Company Ecosystem</h3>
        
        <div className="flex items-center gap-2">
          {/* Analyzed badge - right before buttons */}
          {cacheMetadata?.cacheAge && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              Analyzed {cacheMetadata.cacheAge}
            </span>
          )}

          {/* Standard button order: Analyze -> Expand -> Prompt -> Sources */}

          {/* AI Analysis - Position 1 */}
          {onRefresh && (
            <AnalyzeButton
              onAnalyze={onRefresh}
              isAnalyzing={refreshing}
              label="Analyze Ecosystem"
              estimatedCost={0.05}
              estimatedSeconds={40}
            />
          )}

          {/* Expand - Position 2 */}
          {onViewFull && (
            <button
              onClick={onViewFull}
              className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="View Full Analysis (15+ columns)"
            >
              <Maximize2 size={14} />
            </button>
          )}

          {/* View Prompt - Position 3 */}
          <PromptViewer 
            promptKind="ecosystem" 
            version="v1"
            buttonLabel=""
            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          />

          {/* View Sources - Position 4 (opens expanded modal with Sources tab) */}
          {onViewFull && (
            <button
              onClick={onViewFull}
              className="flex items-center gap-1.5 px-2 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400"
              title="View Sources & Research"
            >
              <AlertCircle size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {totalCompanies} companies analyzed • Avg confidence: {avgConfidence}
        </p>
      </div>

      {/* Compact Table - Interview Prep Focused */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[15%]">Company</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[15%]">Size/Industry</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[10%]">
                <span 
                  className="cursor-help" 
                  title="Market similarity (0-100%). Higher = more similar product/market."
                >
                  Relevance
                </span>
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[25%]">Why Relevant</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[35%]">Quick Insights</th>
            </tr>
          </thead>
          <tbody>
            {displayCompanies.map((company, idx) => (
              <tr 
                key={`${company.name}-${idx}`}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                {/* Company */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(company.category)}</span>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {company.name}
                    </div>
                  </div>
                </td>
                
                {/* Size/Industry */}
                <td className="px-3 py-3">
                  <div className="text-xs">
                    <div className="text-gray-900 dark:text-gray-100">{company.size.employees}</div>
                    <div className="text-gray-500 dark:text-gray-400">{company.industry.specific}</div>
                  </div>
                </td>
                
                {/* Relevance */}
                <td className="px-3 py-3">
                  <span className={`text-lg font-bold ${
                    company.relevanceScore >= 85 ? 'text-green-600 dark:text-green-400' :
                    company.relevanceScore >= 70 ? 'text-blue-600 dark:text-blue-400' :
                    'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {company.relevanceScore}%
                  </span>
                </td>
                
                {/* Why Relevant */}
                <td className="px-3 py-3">
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                    {company.reason}
                  </p>
                </td>
                
                {/* Quick Insights */}
                <td className="px-3 py-3">
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3">
                    {company.insights}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Standard Analysis Explanation - 2nd Last Position */}
      <AnalysisExplanation>
        <p>
          We research the competitive landscape to help you understand the market, speak 
          intelligently about industry trends, and demonstrate market awareness in your interviews.
        </p>
        
        <div>
          <p className="font-semibold mb-2">Our Analysis Methodology:</p>
          <ul className="space-y-1 text-xs">
            <li>• 10 Companies: 5 direct competitors, 3 adjacent markets, 2 complementary products</li>
            <li>• 15+ Signals: Size, industry, market momentum, recent news, skills trends, culture</li>
            <li>• AI + Public Data: Company profiles, news, reviews, industry analysis</li>
            <li>• Cached: 7 days (click "Analyze Ecosystem" to refresh)</li>
          </ul>
        </div>
        
        <div>
          <p className="font-semibold mb-2">What Each Column Means:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Relevance</strong>: Market similarity (0-100%). Higher = more similar product/market.</li>
            <li>• <strong>Why Relevant</strong>: Specific reason this company matters for interview prep.</li>
            <li>• <strong>Quick Insights</strong>: Market position, culture, interview talking points (2-3 sentences).</li>
          </ul>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Note: This helps you prepare for interviews at target company, not find other jobs. 
          Full details in modal (click 🔍 in header).
        </p>
      </AnalysisExplanation>

      {/* Why This Matters - Last Position */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Why this matters for interview prep:</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Understanding competitor strengths, market trends, and industry dynamics helps you speak 
          intelligently about the competitive landscape and demonstrate market awareness. Use insights 
          to craft informed questions and thoughtful responses about the company's market position.
        </p>
      </div>
    </div>
  );
}

