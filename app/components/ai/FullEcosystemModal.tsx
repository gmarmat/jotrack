'use client';

import { X, Download, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { type EcosystemCompany } from './CompanyEcosystemTable';

interface FullEcosystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: EcosystemCompany[];
  cacheMetadata?: {
    cached: boolean;
    cacheAge?: string;
    cacheExpiresIn?: string;
  };
}

/**
 * Full-screen modal showing all 15+ company data columns
 * Tabs: Intelligence | Sources | Insights
 */
export default function FullEcosystemModal({ 
  isOpen, 
  onClose, 
  companies,
  cacheMetadata
}: FullEcosystemModalProps) {
  const [activeTab, setActiveTab] = useState<'intelligence' | 'sources' | 'insights'>('intelligence');
  const [selectedCompany, setSelectedCompany] = useState<EcosystemCompany | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const companiesPerPage = 10;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Sample data if no companies provided (consistent with compact table)
  const sampleCompanies: EcosystemCompany[] = companies.length > 0 ? companies : [
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

  const displayCompanies = sampleCompanies;

  // Pagination
  const totalPages = Math.ceil(displayCompanies.length / companiesPerPage);
  const startIdx = (currentPage - 1) * companiesPerPage;
  const endIdx = startIdx + companiesPerPage;
  const paginatedCompanies = displayCompanies.slice(startIdx, endIdx);

  const toggleCompany = (companyName: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyName)) {
      newExpanded.delete(companyName);
    } else {
      newExpanded.add(companyName);
    }
    setExpandedCompanies(newExpanded);
  };

  const renderStars = (score: number) => {
    return '●'.repeat(score) + '○'.repeat(5 - score);
  };

  const getInterviewPrepColor = (value: string) => {
    switch (value) {
      case 'very-likely': return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'likely': return 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
      case 'possible': return 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'unlikely': return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
      default: return 'text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 85) return 'text-green-700 dark:text-green-400 font-bold';
    if (score >= 70) return 'text-blue-700 dark:text-blue-400 font-semibold';
    if (score >= 60) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-gray-700 dark:text-gray-400';
  };

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

  const exportToCSV = () => {
    // Build CSV content
    const headers = [
      'Company', 'Category', 'Employees', 'Industry', 'Location', 'CEO', 
      'Growth', 'Stability', 'Retention', 'News +', 'News -', 
      'Skills Current', 'Skills Future', 'Hiring', 'Open Roles',
      'Relevance', 'Career Fit', 'Confidence', 'Insights'
    ];
    
    const rows = companies.map(c => [
      c.name,
      c.category,
      c.size.employees,
      `${c.industry.broad} - ${c.industry.specific}`,
      c.location.headquarters,
      c.leadership?.ceo || 'N/A',
      c.careerMetrics.growthScore,
      c.careerMetrics.stabilityScore,
      c.careerMetrics.retentionScore,
      c.recentNews.positive,
      c.recentNews.negative,
      c.skillsIntel?.currentHotSkills.join('; ') || 'N/A',
      c.skillsIntel?.futureSkills?.join('; ') || 'N/A',
      c.skillsIntel?.hiringTrend || 'unknown',
      c.skillsIntel?.openRoles || 0,
      c.relevanceScore,
      c.careerOpportunity,
      c.confidence.score,
      c.insights
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecosystem-analysis-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Modal Container - 90% viewport */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[95vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Company Ecosystem - Full Analysis
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {displayCompanies.length} companies • 15+ data points per company
              {cacheMetadata?.cached && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                  💰 Cached ({cacheMetadata.cacheAge} ago)
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
              title="Download as CSV"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'intelligence'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Intelligence
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sources'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Sources & Research
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'insights'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Insights
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Tab 1: Intelligence - Full Table */}
          {activeTab === 'intelligence' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">Company</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">Competes</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">Size</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">Industry</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">HQ / Region</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">CEO</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">Market Momentum</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">Stability</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">Retention</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">News (60d)</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">Hiring Trend</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">Relevance</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">Analysis Confidence</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 min-w-[400px]">Insights</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.map((company, idx) => (
                    <tr 
                      key={`${company.name}-${idx}`}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      onClick={() => setSelectedCompany(company)}
                    >
                      {/* Company */}
                      <td className="px-3 py-3 font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600">
                        {company.name}
                      </td>
                      
                      {/* Competes */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{getCategoryIcon(company.category)}</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">{company.category}</span>
                        </div>
                      </td>
                      
                      {/* Size */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <div className="text-xs">
                          <div className="text-gray-900 dark:text-gray-100">{company.size.employees}</div>
                          <div className="text-gray-500 dark:text-gray-400">{company.size.sizeCategory}</div>
                        </div>
                      </td>
                      
                      {/* Industry */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <div className="text-xs">
                          <div className="text-gray-900 dark:text-gray-100">{company.industry.broad}</div>
                          <div className="text-gray-500 dark:text-gray-400">{company.industry.specific}</div>
                        </div>
                      </td>
                      
                      {/* Location */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <div className="text-xs">
                          <div className="text-gray-900 dark:text-gray-100">{company.location.headquarters}</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {company.location.region}
                            {company.location.isRemote && (
                              <span className="ml-1 px-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">Remote OK</span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* CEO */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <div className="text-xs">
                          <div className="text-gray-900 dark:text-gray-100">{company.leadership?.ceo || 'N/A'}</div>
                          <div className="text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                            {company.leadership?.ceoBackground || ''}
                          </div>
                        </div>
                      </td>
                      
                      {/* Market Momentum */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <div className="text-xs">
                          <div className="text-orange-600 dark:text-orange-400 font-mono">
                            {renderStars(company.careerMetrics.growthScore)}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300">{company.careerMetrics.growthScore}/5</div>
                        </div>
                      </td>
                      
                      {/* Stability Score */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <div className="text-xs">
                          <div className="text-blue-600 dark:text-blue-400 font-mono">
                            {renderStars(company.careerMetrics.stabilityScore)}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">{company.careerMetrics.stabilityScore}/5</div>
                        </div>
                      </td>
                      
                      {/* Retention Score */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <div className="text-xs">
                          <div className="text-purple-600 dark:text-purple-400 font-mono">
                            {renderStars(company.careerMetrics.retentionScore)}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {company.careerMetrics.avgTenure || 'N/A'}
                          </div>
                        </div>
                      </td>
                      
                      {/* News (60d) */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <div className="text-xs">
                          <div className="font-medium">
                            <span className="text-green-600 dark:text-green-400">{company.recentNews.positive}⬆</span>
                            {' '}
                            <span className="text-red-600 dark:text-red-400">{company.recentNews.negative}⬇</span>
                          </div>
                          {company.recentNews.highlights.length > 0 && (
                            <div className="text-gray-600 dark:text-gray-400 mt-1">
                              {company.recentNews.highlights.slice(0, 2).map((h, i) => (
                                <div key={i} className={h.startsWith('+') ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                                  {h.substring(0, 40)}...
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* Hiring Trend */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <div className="text-xs">
                          <div className="text-gray-700 dark:text-gray-300 font-medium">
                            {company.skillsIntel?.hiringTrend === 'growing' ? '↗ Growing' : 
                             company.skillsIntel?.hiringTrend === 'declining' ? '↘ Declining' : 
                             company.skillsIntel?.hiringTrend === 'stable' ? '→ Stable' : '? Unknown'}
                          </div>
                          {company.skillsIntel?.openRoles && (
                            <div className="text-gray-500 dark:text-gray-400">{company.skillsIntel.openRoles} roles</div>
                          )}
                        </div>
                      </td>
                      
                      {/* Relevance */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <span className={`text-lg font-bold ${getRelevanceColor(company.relevanceScore)}`}>
                          {company.relevanceScore}%
                        </span>
                      </td>
                      
                      {/* Analysis Confidence */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          company.confidence.score === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          company.confidence.score === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                        }`}>
                          {company.confidence.score.toUpperCase()}
                        </span>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {company.confidence.percentage}%
                        </div>
                      </td>
                      
                      {/* Insights - Formatted with bullets */}
                      <td className="px-3 py-3 border border-gray-300 dark:border-gray-600 min-w-[400px]">
                        <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                          {company.insights.split('. ').filter(s => s.trim()).map((sentence, idx) => (
                            <div key={idx} className="flex gap-2">
                              <span className="text-gray-400">•</span>
                              <span>{sentence.trim()}{idx < company.insights.split('. ').length - 1 ? '.' : ''}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Sources - Collapsible per Company */}
          {activeTab === 'sources' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All sources used to gather company intelligence. Click to verify our research.
                </p>
                <button
                  onClick={() => {
                    if (expandedCompanies.size > 0) {
                      setExpandedCompanies(new Set());
                    } else {
                      setExpandedCompanies(new Set(paginatedCompanies.map(c => c.name)));
                    }
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {expandedCompanies.size > 0 ? 'Collapse All' : 'Expand All'}
                </button>
              </div>

              {paginatedCompanies.map((company, idx) => {
                const isExpanded = expandedCompanies.has(company.name);
                
                return (
                  <div key={`${company.name}-sources-${idx}`} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* Company Header - Clickable */}
                    <button
                      onClick={() => toggleCompany(company.name)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(company.category)}
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {company.name}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({company.sources.length} sources)
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {/* Sources List - Collapsible */}
                    {isExpanded && (
                      <div className="p-4 space-y-2">
                        {company.sources.map((source, sidx) => (
                          <div 
                            key={`${company.name}-source-${sidx}`}
                            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {source.name}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  source.confidence === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                  source.confidence === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                  'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                                }`}>
                                  {source.confidence}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {source.category}
                                </span>
                              </div>
                              <a 
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                              >
                                {source.url}
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination for Sources Tab */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Insights - Detailed Analysis */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              {paginatedCompanies.map((company, idx) => (
                <div key={`${company.name}-insights-${idx}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {getCategoryIcon(company.category)} {company.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {company.industry.specific} • {company.size.employees} employees • {company.location.region}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-xs font-medium ${getInterviewPrepColor(company.interviewPrepValue)}`}>
                      {company.interviewPrepValue.toUpperCase().replace('-', ' ')}
                    </span>
                  </div>

                  {/* Insights */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Summary:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{company.insights}</p>
                    </div>

                    {/* Recent News */}
                    {company.recentNews.highlights.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Recent News ({company.recentNews.positive}⬆ {company.recentNews.negative}⬇):
                        </p>
                        <ul className="space-y-1">
                          {company.recentNews.highlights.map((item, hidx) => (
                            <li key={`${company.name}-news-${hidx}`} className={`text-xs ${
                              item.startsWith('+') ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                            }`}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Skills */}
                    {company.skillsIntel && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Skills in Demand:</p>
                        <div className="flex gap-4 text-xs">
                          <div>
                            <span className="font-medium">Current:</span>{' '}
                            {company.skillsIntel.currentHotSkills.join(', ')}
                          </div>
                          {company.skillsIntel.futureSkills && company.skillsIntel.futureSkills.length > 0 && (
                            <div>
                              <span className="font-medium">Future:</span>{' '}
                              {company.skillsIntel.futureSkills.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interview Relevance */}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Interview Prep:</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">{company.interviewRelevance}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        <strong>Why relevant:</strong> {company.reason}
                      </p>
                    </div>

                    {/* Career Metrics */}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Career Metrics:</p>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Growth Opportunity</div>
                          <div className="text-orange-600 dark:text-orange-400 font-semibold">
                            {renderStars(company.careerMetrics.growthScore)} {company.careerMetrics.growthScore}/5
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Job Stability</div>
                          <div className="text-blue-600 dark:text-blue-400 font-semibold">
                            {renderStars(company.careerMetrics.stabilityScore)} {company.careerMetrics.stabilityScore}/5
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Retention</div>
                          <div className="text-purple-600 dark:text-purple-400 font-semibold">
                            {renderStars(company.careerMetrics.retentionScore)} {company.careerMetrics.retentionScore}/5
                            {company.careerMetrics.avgTenure && (
                              <span className="text-gray-500 dark:text-gray-400 ml-1">({company.careerMetrics.avgTenure})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination for Insights Tab */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

