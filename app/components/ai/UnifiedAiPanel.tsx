'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Loader2 } from 'lucide-react';
import FitTable from '../coach/tables/FitTable';
import HeatmapTable from '../coach/tables/HeatmapTable';
import ProfileTable from '../coach/tables/ProfileTable';
import ProviderBadge from '../coach/ProviderBadge';
import AiSources from '../coach/AiSources';
import MatchScoreGauge from './MatchScoreGauge';
import SkillsMatchChart from './SkillsMatchChart';

interface UnifiedAiPanelProps {
  jobId: string;
  job: any;
}

type Section = 'quick' | 'fit' | 'profiles' | 'keywords' | 'improve';

export default function UnifiedAiPanel({ jobId, job }: UnifiedAiPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<Section>>(
    new Set<Section>(['quick', 'fit', 'profiles', 'keywords'])
  );
  const [loading, setLoading] = useState<Record<Section, boolean>>({
    quick: false,
    fit: false,
    profiles: false,
    keywords: false,
    improve: false,
  });
  
  const [quickInsights, setQuickInsights] = useState<any>(null);
  const [fitAnalysis, setFitAnalysis] = useState<any>(null);
  const [profiles, setProfiles] = useState<any>(null);

  const toggleSection = (section: Section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const refreshQuickInsights = async () => {
    setLoading({ ...loading, quick: true });
    try {
      const settingsRes = await fetch('/api/ai/keyvault/status');
      const settings = await settingsRes.json();
      const useRemote = settings.networkEnabled && settings.hasApiKey;

      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          status: job.status,
          mode: useRemote ? 'remote' : 'dry-run',
        }),
      });

      const data = await response.json();
      if (data.ok && data.insights) {
        setQuickInsights(data);
      }
    } catch (error) {
      console.error('Error fetching quick insights:', error);
    } finally {
      setLoading({ ...loading, quick: false });
    }
  };

  const refreshFitAnalysis = async () => {
    setLoading({ ...loading, fit: true });
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          capability: 'compare',
          inputs: {
            jobTitle: job.title,
            company: job.company,
            jdText: job.notes || 'No JD available',
            resumeText: 'Resume content', // TODO: Extract from attachments
            notesText: job.notes || '',
          },
          dryRun: false,
          promptVersion: 'v1',
        }),
      });

      const data = await response.json();
      setFitAnalysis(data.result);
    } catch (error) {
      console.error('Error fetching fit analysis:', error);
    } finally {
      setLoading({ ...loading, fit: false });
    }
  };

  const renderAccordion = (
    section: Section,
    title: string,
    content: React.ReactNode,
    onRefresh?: () => void
  ) => {
    const isExpanded = expandedSections.has(section);
    const isLoading = loading[section];

    return (
      <div className="border border-gray-200 rounded-lg bg-white" data-testid={`ai-section-${section}`}>
        <button
          onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {quickInsights && section === 'quick' && (
              <ProviderBadge provider={quickInsights.mode === 'remote' ? 'remote' : 'local'} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
                }}
                className="p-1 hover:bg-gray-200 rounded"
                disabled={isLoading}
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 border-t border-gray-200">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              content
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4" data-testid="unified-ai-panel">
      {/* Quick Insights */}
      {renderAccordion(
        'quick',
        '⚡ Quick Insights',
        quickInsights?.insights ? (
          <div className="space-y-4">
            <div className="flex items-center gap-6">
              <MatchScoreGauge 
                score={quickInsights.insights.score || 0} 
                size={100}
              />
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-2">Overall Match Score</div>
                <div className="text-xl font-bold text-gray-900">
                  {Math.round((quickInsights.insights.score || 0) * 100)}%
                </div>
              </div>
            </div>

            {quickInsights.insights.highlights && quickInsights.insights.highlights.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-700 mb-2">✓ Highlights</h4>
                <ul className="space-y-1">
                  {quickInsights.insights.highlights.map((h: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700">• {h}</li>
                  ))}
                </ul>
              </div>
            )}

            {quickInsights.insights.gaps && quickInsights.insights.gaps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2">△ Gaps</h4>
                <ul className="space-y-1">
                  {quickInsights.insights.gaps.map((g: string, i: number) => (
                    <li key={i} className="text-sm text-gray-700">• {g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-3">No insights yet</p>
            <button
              onClick={refreshQuickInsights}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Generate Insights
            </button>
          </div>
        ),
        refreshQuickInsights
      )}

      {/* Fit Score Analysis */}
      {renderAccordion(
        'fit',
        '📊 Fit Score Analysis',
        fitAnalysis ? (
          <FitTable
            overall={fitAnalysis.fit?.overall || 0}
            threshold={fitAnalysis.fit?.threshold || 0.75}
            breakdown={fitAnalysis.fit?.breakdown || []}
            sources={fitAnalysis.sources || []}
            dryRun={fitAnalysis.meta?.dryRun !== false}
            rawJson={fitAnalysis}
            onRefresh={refreshFitAnalysis}
            refreshing={loading.fit}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-3">No fit analysis yet</p>
            <button
              onClick={refreshFitAnalysis}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Analyze Fit
            </button>
          </div>
        ),
        refreshFitAnalysis
      )}

      {/* Keyword Heatmap */}
      {renderAccordion(
        'keywords',
        '🔥 Keyword Heatmap',
        fitAnalysis?.keywords ? (
          <div className="space-y-6">
            <SkillsMatchChart 
              skills={fitAnalysis.keywords.map((k: any) => ({
                term: k.term,
                jdCount: k.jdCount || 0,
                resumeCount: k.resumeCount || 0,
              }))}
              maxSkills={10}
            />
            <div className="pt-4 border-t">
              <HeatmapTable keywords={fitAnalysis.keywords} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            Run Fit Analysis to see keyword breakdown
          </p>
        )
      )}

      {/* Profile Analysis */}
      {renderAccordion(
        'profiles',
        '👥 Company & People Profiles',
        profiles ? (
          <ProfileTable profiles={profiles} dryRun={true} />
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No profile analysis yet. Use Coach Mode for detailed profiles.
          </p>
        )
      )}

      {/* Improvement Suggestions */}
      {renderAccordion(
        'improve',
        '💡 Improvement Suggestions',
        <p className="text-sm text-gray-500 text-center py-8">
          Coming soon: AI-powered suggestions to improve your application
        </p>
      )}
    </div>
  );
}
