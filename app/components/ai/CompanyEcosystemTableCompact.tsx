'use client';

import { ChevronDown, ChevronUp, Info, ExternalLink, Maximize2 } from 'lucide-react';
import { useState } from 'react';
import { type EcosystemCompany } from './CompanyEcosystemTable';
import PromptViewer from './PromptViewer';
import AnalyzeButton from './AnalyzeButton';

interface CompanyEcosystemTableCompactProps {
  companies: EcosystemCompany[];
  isAiPowered: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  onViewFull?: () => void; // Opens full modal
}

export default function CompanyEcosystemTableCompact({ 
  companies, 
  isAiPowered,
  onRefresh,
  refreshing = false,
  onViewFull
}: CompanyEcosystemTableCompactProps) {
  const [showExplain, setShowExplain] = useState(false);
  
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
      careerOpportunity: 'high',
      interviewRelevance: 'Very likely - main competitor comparison',
      confidence: {
        score: 'high',
        percentage: 92
      },
      insights: 'Strong growth company with excellent market position. High hiring activity and competitive compensation. Great career opportunity with proven product-market fit. Strong technical culture with emphasis on design.',
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
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
        </div>
      </div>

      {/* Explanation Section */}
      <div className="mb-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
        <button
          onClick={() => setShowExplain(!showExplain)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Info size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              How We Analyze the Ecosystem
            </span>
          </div>
          {showExplain ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {showExplain && (
          <div className="px-4 pb-4 text-sm text-gray-700 dark:text-gray-300 space-y-3">
            <p>
              We analyze companies across 15+ dimensions to help you understand the 
              competitive landscape, identify career opportunities, and prepare for interviews.
            </p>
            
            <div>
              <p className="font-medium mb-1">Our Analysis Methodology:</p>
              <ul className="space-y-1 text-xs">
                <li>• 10 Companies: 5 direct competitors, 3 adjacent markets, 2 complementary products</li>
                <li>• 8 Data Sources: Company profiles, news, hiring trends, reviews, forums</li>
                <li>• 15+ Signals: Size, growth, stability, culture, news, skills demand, hiring</li>
                <li>• Updated: Every 7 days (auto-refresh when job description changes)</li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium mb-1">What Each Column Means:</p>
              <ul className="space-y-1 text-xs">
                <li>• News Signals: Positive/negative events in last 60 days (3⬆ 1⬇ format)</li>
                <li>• Growth Score: Company expansion rate on 1-5 scale (●●●●● = rapid growth)</li>
                <li>• Hiring Trend: Open roles + direction (↗growing, ↘declining, →stable)</li>
                <li>• Confidence: Data quality based on source reliability (HIGH/MEDIUM/LOW)</li>
              </ul>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Note: Analysis based on public data. We show sources so you can verify our 
              research. Confidence scores reflect data quality and freshness.
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {totalCompanies} companies analyzed • Avg confidence: {avgConfidence} • Last updated: 2 hours ago
        </p>
      </div>

      {/* Compact Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[15%]">Company</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[10%]">Type</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[12%]">Size/Industry</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[8%]">Growth</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[10%]">News</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[8%]">Hiring</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[8%]">Confidence</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-[10%]">Actions</th>
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
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {company.name}
                  </div>
                </td>
                
                {/* Type */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-lg">{getCategoryIcon(company.category)}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {getCategoryLabel(company.category)}
                    </span>
                  </div>
                </td>
                
                {/* Size/Industry */}
                <td className="px-3 py-3">
                  <div className="text-xs">
                    <div className="text-gray-900 dark:text-gray-100">{company.size.employees}</div>
                    <div className="text-gray-500 dark:text-gray-400">{company.industry.specific}</div>
                  </div>
                </td>
                
                {/* Growth */}
                <td className="px-3 py-3">
                  <div className="text-xs">
                    <div className="text-orange-600 dark:text-orange-400">
                      {renderStars(company.careerMetrics.growthScore)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {company.careerMetrics.growthScore}/5
                    </div>
                  </div>
                </td>
                
                {/* News */}
                <td className="px-3 py-3">
                  <div 
                    className="text-xs font-medium cursor-help" 
                    title={`${company.recentNews.positive} positive, ${company.recentNews.negative} negative news items (60 days)`}
                  >
                    <span className="text-green-600 dark:text-green-400">{company.recentNews.positive}⬆</span>
                    {' '}
                    <span className="text-red-600 dark:text-red-400">{company.recentNews.negative}⬇</span>
                  </div>
                </td>
                
                {/* Hiring */}
                <td className="px-3 py-3">
                  <div className="text-xs">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {getHiringTrendIcon(company.skillsIntel?.hiringTrend || 'unknown')}{' '}
                      {company.skillsIntel?.openRoles || 0}
                    </div>
                  </div>
                </td>
                
                {/* Confidence */}
                <td className="px-3 py-3">
                  {getConfidenceBadge(company.confidence)}
                </td>
                
                {/* Actions */}
                <td className="px-3 py-3">
                  <button
                    onClick={onViewFull}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                    title="View full analysis in modal"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Full Analysis Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={onViewFull}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors"
        >
          <Maximize2 size={16} />
          View Full Analysis
        </button>
      </div>
    </div>
  );
}

