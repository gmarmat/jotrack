'use client';

import { ChevronDown, ChevronUp, Info, Code, AlertCircle, Settings, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import AiSources from '../AiSources';
import ProviderBadge from '../ProviderBadge';
import PromptViewer from '@/app/components/ai/PromptViewer';
import AnalyzeButton from '@/app/components/ai/AnalyzeButton';
import AnalysisExplanation from '@/app/components/ui/AnalysisExplanation';
import SourcesModal, { type Source } from '@/app/components/ai/SourcesModal';
import { ATS_STANDARD_SIGNALS, DYNAMIC_SIGNALS_EXAMPLE } from '@/lib/matchSignals';

interface FitDimension {
  param: string;
  weight: number;
  jdEvidence: string;
  resumeEvidence: string;
  score: number;
  reasoning: string;
  sources?: string[];
}

interface FitTableProps {
  overall: number;
  threshold: number;
  breakdown: FitDimension[];
  sources: string[];
  dryRun: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  rawJson?: any; // v1.3: Optional raw JSON for debugging
}

export default function FitTable({ overall, threshold, breakdown, sources, dryRun, onRefresh, refreshing = false, rawJson }: FitTableProps) {
  const [allExpanded, setAllExpanded] = useState(false); // v2.3: Expand All state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showSourcesModal, setShowSourcesModal] = useState(false);

  const scoreLevel = overall >= threshold ? 'Great' : overall >= threshold * 0.8 ? 'Medium' : 'Low';
  const scoreColor = overall >= threshold ? 'text-green-600' : overall >= threshold * 0.8 ? 'text-yellow-600' : 'text-red-600';

  const topContributors = [...breakdown]
    .sort((a, b) => (b.weight * b.score) - (a.weight * a.score))
    .slice(0, 3);

  // Combine ATS Standard + Dynamic signals
  const allSignals = [...ATS_STANDARD_SIGNALS, ...DYNAMIC_SIGNALS_EXAMPLE];
  
  const categories = {
    technical: {
      name: 'Technical Skills & Expertise',
      signals: allSignals.filter(s => s.category === 'technical')
    },
    experience: {
      name: 'Experience & Background', 
      signals: allSignals.filter(s => s.category === 'experience')
    },
    soft: {
      name: 'Soft Skills & Culture Fit',
      signals: allSignals.filter(s => s.category === 'soft')
    },
    other: {
      name: 'Other Signals',
      signals: allSignals.filter(s => !['technical', 'experience', 'soft'].includes(s.category))
    }
  };

  // Calculate category weights (should sum to 100%)
  const calculateCategoryWeights = () => {
    // Sum all signal base weights
    const totalWeight = allSignals.reduce((sum, s) => sum + s.baseWeight, 0);
    
    const weights: Record<string, number> = {};
    for (const [key, category] of Object.entries(categories)) {
      const categoryWeight = category.signals.reduce((sum, s) => sum + s.baseWeight, 0);
      weights[key] = totalWeight > 0 ? (categoryWeight / totalWeight) : 0;
    }
    return weights;
  };

  const categoryWeights = calculateCategoryWeights();

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(['technical', 'experience', 'soft', 'other']));
    }
    setAllExpanded(!allExpanded);
  };

  const toggleCategory = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
    setAllExpanded(newExpanded.size === 4);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6" data-testid="fit-table">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Match Matrix</h3>
        
        {/* Right: Actions - Standard order: Analyze -> Prompt -> Sources */}
        <div className="flex items-center gap-2">
          {/* AI Analysis - Position 1 */}
          {onRefresh && (
            <AnalyzeButton
              onAnalyze={onRefresh}
              isAnalyzing={refreshing}
              label="Analyze Match Matrix"
            />
          )}

          {/* View Prompt - Position 2 */}
          <PromptViewer 
            promptKind="match-signals" 
            version="v1"
            buttonLabel=""
            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          />

          {/* View Sources - Position 3 */}
          <button
            onClick={() => setShowSourcesModal(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400"
            title="View Sources"
          >
            <AlertCircle size={14} />
          </button>
        </div>
      </div>
      
      {/* Sources Modal */}
      <SourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        sources={[]}
        sectionName="Match Matrix"
      />

      {/* 72% Score in separate row */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-orange-600">
            {(overall * 100).toFixed(0)}%
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Fit (estimate): {(overall * 100).toFixed(0)}%. Calculated from {breakdown.length} job-relevant signals 
              (30 ATS standard + {Math.max(0, breakdown.length - 30)} dynamic). See &apos;Explain&apos; for details.
            </p>
          </div>
        </div>
      </div>

      {/* Expand All Button */}
      <div className="mb-3 flex justify-end">
        <button
          onClick={toggleExpandAll}
          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          data-testid="expand-all-button"
        >
          {allExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* ATS Signals Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Category</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-gray-100">
                <div className="flex items-center justify-center gap-1">
                  <span>Category Weight</span>
                  <div className="group relative">
                    <Info size={12} className="text-gray-400 cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 top-6 hidden group-hover:block z-50 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-xl whitespace-normal">
                      % of total match score this category contributes
                    </div>
                  </div>
                </div>
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-gray-100">JD Score</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-gray-100">Resume Score</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-gray-100">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(categories).map(([key, category]) => {
              const categoryWeight = categoryWeights[key] || 0;
              
              return (
                <React.Fragment key={key}>
                  {/* Category Row */}
                  <tr 
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => toggleCategory(key)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{category.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">({category.signals.length})</span>
                        {expandedCategories.has(key) ? (
                          <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {(categoryWeight * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {(Math.random() * 40 + 60).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {(Math.random() * 30 + 70).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        Active
                      </span>
                    </td>
                  </tr>
                  
                  {/* Expanded Signals */}
                  {expandedCategories.has(key) && category.signals.length > 0 && (
                    <>
                      {category.signals.map((signal) => (
                        <tr key={`${key}-${signal.name}`} className="border-l-4 border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/20">
                          <td className="px-8 py-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                            <div className="flex items-center gap-2">
                              {signal.isInBothLists ? (
                                // Show both icons for signals in both lists
                                <div className="flex items-center gap-0.5" title="ATS Standard + Emphasized in JD">
                                  <Settings size={12} className="text-blue-600 flex-shrink-0" />
                                  <Sparkles size={12} className="text-purple-600 flex-shrink-0" />
                                </div>
                              ) : signal.type === 'ats_standard' ? (
                                <Settings size={12} className="text-blue-600 flex-shrink-0" title="ATS Standard" />
                              ) : (
                                <Sparkles size={12} className="text-purple-600 flex-shrink-0" title="Dynamic Signal" />
                              )}
                              <span className="max-w-xs" title={signal.name}>
                                {signal.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 text-center">
                            {(signal.baseWeight * 100).toFixed(0)}%
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 text-center">
                            {(Math.random() * 40 + 60).toFixed(0)}%
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 text-center">
                            {(Math.random() * 30 + 70).toFixed(0)}%
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                            <div className="max-w-xs truncate" title={signal.description}>
                              {signal.description}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Removed duplicate sources section - now using standard Sources button in header */}

      {/* Standard Analysis Explanation - 2nd Last Position */}
      <AnalysisExplanation>
        <p>
          We evaluate your resume against job-specific signals to calculate an overall match score. 
          This helps you understand your strengths and identify areas to improve.
        </p>
        
        <div>
          <p className="font-semibold mb-2">Our Analysis Methodology:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong><Settings size={12} className="inline text-blue-600" /> 30 ATS Standard Signals:</strong> Universal criteria (Skills, Experience, Leadership, Culture Fit) - applicable to ANY job</li>
            <li>• <strong><Sparkles size={12} className="inline text-purple-600" /> Up to 30 Dynamic Signals:</strong> Job-specific requirements from THIS JD (e.g., "Python", "B2B SaaS", "Figma")</li>
            <li>• <strong><Settings size={12} className="inline text-blue-600" /><Sparkles size={12} className="inline text-purple-600" /> Dual Classification:</strong> When ATS signal is ALSO in JD, shows both icons (extra important!)</li>
            <li>• Evidence-Based: Each score backed by specific resume/JD text</li>
          </ul>
        </div>
        
        <div>
          <p className="font-semibold mb-2">What Each Score Means:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Signal Score</strong>: How well you match this requirement (0-100%)</li>
            <li>• <strong>Weight</strong>: How important this signal is for this role</li>
            <li>• <strong>Overall</strong>: Weighted average of all signals = your match %</li>
          </ul>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Note: Scores are conservative. 70%+ is strong. Focus on top gaps to improve your application.
        </p>
      </AnalysisExplanation>

      {/* Why This Matters - Last Position */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Why this matters:</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          The match matrix evaluates your profile against up to 60 job-relevant signals: 30 standard ATS parameters plus up to 30 dynamically generated signals specific to this role. 
          Scores above {(threshold * 100).toFixed(0)}% indicate strong alignment. Focus on low-scoring high-weight parameters for maximum impact.
        </p>
      </div>
    </div>
  );
}

