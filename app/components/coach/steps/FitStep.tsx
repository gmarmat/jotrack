'use client';

import { useState, useEffect } from 'react';
import { Target, TrendingUp, Loader2, Eye } from 'lucide-react';
import FitTable from '../tables/FitTable';
import HeatmapTable from '../tables/HeatmapTable';

interface FitStepProps {
  jobId: string;
  data: any;
  onUpdate: (updates: any) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function FitStep({ jobId, data, onUpdate, onComplete, onBack }: FitStepProps) {
  const [loading, setLoading] = useState(false);
  const [fitAnalysis, setFitAnalysis] = useState<any>(data.fitAnalysis || null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!fitAnalysis && data.jobDescription && data.resume) {
      analyzeFit();
    }
  }, []);

  const analyzeFit = async () => {
    setLoading(true);

    try {
      // v1.2: Check network settings to determine if remote or dry-run
      const settingsResponse = await fetch('/api/ai/keyvault/status');
      const settings = await settingsResponse.json();
      const useDryRun = !settings.networkEnabled || !settings.hasApiKey;

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          capability: 'compare',
          inputs: {
            jobTitle: extractJobTitle(data.jobDescription),
            company: extractCompanyName(data.jobDescription),
            jdText: data.jobDescription,
            resumeText: data.resume,
            notesText: '',
          },
          dryRun: useDryRun,
          promptVersion: 'v1',
        }),
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setFitAnalysis({
        ...result.result,
        _meta: {
          provider: result.provider,
          usage: result.usage,
        },
      });
      onUpdate({ fitAnalysis: result.result });
    } catch (error) {
      console.error('Error analyzing fit:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to analyze fit';
      alert(`We couldn't complete the analysis. ${errorMsg}. Your data is saved; please try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="fit-loading">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analyzing fit...</p>
        </div>
      </div>
    );
  }

  if (!fitAnalysis) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600">No fit analysis available</p>
      </div>
    );
  }

  const extractCompanyName = (jd: string): string => {
    // Simple extraction - could be enhanced
    const lines = jd.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('company') || line.toLowerCase().includes('about us')) {
        return line.split(':')[1]?.trim() || 'Company';
      }
    }
    return 'Company';
  };

  const extractJobTitle = (jd: string): string => {
    // Simple extraction - look for job title patterns
    const patterns = [
      /(?:Position|Role|Job):\s*([A-Za-z\s]+)/i,
      /We're\s+hiring\s+a\s+([A-Za-z\s]+)/i,
      /Looking\s+for\s+a\s+([A-Za-z\s]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = jd.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Position';
  };

  const getScoreLevelColor = (level: string) => {
    switch (level) {
      case 'Great':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // v1.1: Check if we have the new structured response format
  const hasBreakdown = fitAnalysis?.fit?.breakdown;
  const hasKeywords = fitAnalysis?.keywords;

  return (
    <div className="space-y-6" data-testid="fit-step">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Fit Analysis</h2>
        <p className="text-gray-600">
          Evidence-based analysis across 25 parameters. All scores derived from actual JD and Resume content.
        </p>
      </div>

      {/* v1.3.1: Always render evidence tables */}
      <FitTable
        overall={fitAnalysis.fit?.overall || 0}
        threshold={fitAnalysis.fit?.threshold || 0.75}
        breakdown={fitAnalysis.fit?.breakdown || []}
        sources={fitAnalysis.sources || []}
        dryRun={fitAnalysis.meta?.dryRun !== false}
        rawJson={fitAnalysis} // v1.3: Pass full response for debugging
        onRefresh={analyzeFit}
        refreshing={loading}
        data-testid="fit-table"
      />

      <HeatmapTable 
        keywords={fitAnalysis.keywords || []} 
        data-testid="heatmap-table"
      />

      {/* Fallback UI for backwards compatibility */}
      {!hasBreakdown && (
        <>
          {/* Overall Score */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Overall Fit Score</h3>
                </div>
                <p className="text-4xl font-bold text-gray-900">{fitAnalysis.overallScore || 0}/100</p>
              </div>
              <div
                className={`px-4 py-2 rounded-lg border ${getScoreLevelColor(fitAnalysis.scoreLevel || 'Low')}`}
              >
                <p className="text-lg font-semibold">{fitAnalysis.scoreLevel || 'Low'}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-700">{fitAnalysis.summary || 'Analyzing...'}</p>
            </div>
          </div>

          {/* Old dimensions UI */}
          {fitAnalysis.dimensions && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Weighted Dimensions</h3>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              <div className="space-y-4">
                {fitAnalysis.dimensions?.map((dim: any, i: number) => (
                  <div key={i} className="border-l-4 border-blue-200 pl-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {dim.name}
                          <span className="text-sm text-gray-500 ml-2">
                            (weight: {(dim.weight * 100).toFixed(0)}%)
                          </span>
                        </h4>
                        <p className="text-2xl font-bold text-gray-900">{dim.score}/100</p>
                      </div>
                      <div className="w-32">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${dim.score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {showDetails && (
                      <p className="text-sm text-gray-700 mt-2">{dim.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Old keyword matches UI */}
          {fitAnalysis.keywordMatches && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Analysis</h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-2">✓ Found in Resume</h4>
                  <div className="flex flex-wrap gap-2">
                    {fitAnalysis.keywordMatches?.found?.map((keyword: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-2">✗ Missing from Resume</h4>
                  <div className="flex flex-wrap gap-2">
                    {fitAnalysis.keywordMatches?.missing?.map((keyword: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
          data-testid="fit-next-button"
        >
          {hasBreakdown 
            ? (fitAnalysis.fit.overall >= 0.75 ? 'Improve Further →' : 'Get Improvement Plan →')
            : (fitAnalysis.overallScore >= 75 ? 'Improve Further →' : 'Get Improvement Plan →')
          }
        </button>
      </div>
    </div>
  );
}

