'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Settings, TrendingUp, Target, Lightbulb, Users, Zap, Building2 } from 'lucide-react';
import Link from 'next/link';
import LoadingPulse from '../LoadingPulse';
import MatchScoreGauge from '@/app/components/ai/MatchScoreGauge';
import SkillsMatchChart from '@/app/components/ai/SkillsMatchChart';
import SkillThreeLevelChart from '@/app/components/ai/SkillThreeLevelChart';
import CompanyIntelligenceCard from '@/app/components/ai/CompanyIntelligenceCard';
import CompanyEcosystemMatrix from '@/app/components/ai/CompanyEcosystemMatrix';
import PeopleProfilesCard from '@/app/components/ai/PeopleProfilesCard';
import FitTable from '@/app/components/coach/tables/FitTable';
import PromptViewer from '@/app/components/ai/PromptViewer';
import { getMatchScoreCategory } from '@/lib/matchScoreCategories';

interface AiShowcaseProps {
  jobId: string;
  jobDescription?: string;
  companyName?: string;
  companyUrls?: string[];
  recruiterUrl?: string;
  peerUrls?: string[];
  skipLevelUrls?: string[];
  aiData?: {
    matchScore?: number;
    highlights?: string[];
    gaps?: string[];
    fitParams?: any[];
    skills?: any[];
    profiles?: any[];
    peopleProfiles?: any[];
    peopleInsights?: any;
    companyIntelligence?: any;
    companyEcosystem?: any[];
    recommendations?: string[];
    sources?: string[];
    provider?: 'local' | 'remote';
    timestamp?: number;
  };
  onRefresh?: () => void;
}

export default function AiShowcase({ 
  jobId, 
  jobDescription = '',
  companyName = '',
  companyUrls = [],
  recruiterUrl = '',
  peerUrls = [],
  skipLevelUrls = [],
  aiData, 
  onRefresh 
}: AiShowcaseProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['all']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setIsRefreshing(false);
  };

  const matchScore = aiData?.matchScore || 0.72;
  const highlights = aiData?.highlights || ['Strong React experience', 'AWS certified', 'Team leadership'];
  const gaps = aiData?.gaps || ['Kubernetes experience', 'CI/CD pipeline setup'];
  const skills = aiData?.skills || [
    { term: 'React', jdCount: 8, resumeCount: 12 },
    { term: 'AWS', jdCount: 5, resumeCount: 7 },
    { term: 'TypeScript', jdCount: 6, resumeCount: 4 },
    { term: 'Node.js', jdCount: 4, resumeCount: 6 },
  ];
  const provider = aiData?.provider || 'local';
  const hasData = !!aiData;
  
  // Get category-specific recommendations
  const percentage = matchScore > 1 ? matchScore : matchScore * 100;
  const categoryInfo = getMatchScoreCategory(percentage);
  const recommendations = aiData?.recommendations || categoryInfo.recommendations;

  return (
    <div className="bg-white rounded-xl border shadow-sm" data-testid="ai-showcase">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
          <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium ${
            provider === 'remote' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-gray-100 text-gray-700 border border-gray-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${provider === 'remote' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            {provider === 'remote' ? 'AI Powered' : 'Non-AI Powered'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-sm font-bold transition-all shadow-sm"
            data-testid="analyze-with-ai-button"
            title="Run AI analysis on your resume and job description"
          >
            <Sparkles size={18} className={isRefreshing ? 'animate-pulse' : ''} />
            {isRefreshing ? 'Analyzing...' : 'Analyze with AI'}
          </button>

          <PromptViewer 
            promptKind="compare" 
            version="v1"
            buttonLabel="View Prompt"
            className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          />
          
          <Link
            href={`/settings/ai?from=/jobs/${jobId}`}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
            data-testid="ai-settings-link"
          >
            <Settings size={16} />
          </Link>
        </div>
      </div>

      {/* Main Grid - Reorganized Layout */}
      <div className="p-6 space-y-6">
        {/* Row 1: Match Score + Skill Match */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Match Score Card - Reorganized Layout */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Target size={18} className="text-purple-600" />
              Match Score
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Left: Gauge */}
              <div className="flex items-center justify-center">
                <MatchScoreGauge score={matchScore} size={140} showInsights={true} />
              </div>
              
              {/* Right: Category Insights */}
              <div className="flex flex-col justify-center space-y-2">
                <div className={`p-3 rounded-lg ${categoryInfo.bgColor} ${categoryInfo.textColor}`}>
                  <p className="font-semibold text-sm mb-1">{categoryInfo.emoji} {categoryInfo.label}</p>
                  <p className="text-xs italic">&quot;{categoryInfo.description}&quot;</p>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1">
                  {categoryInfo.insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Highlights and Gaps - Two Columns */}
            <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-purple-200">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">✓ Highlights</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">△ Gaps</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {gaps.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Top Recommendations */}
            <div className="pt-4 border-t border-purple-200">
              <div className="text-sm font-medium text-gray-900 mb-2">💡 Top Recommendations:</div>
              <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Skill Match Card */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Lightbulb size={18} className="text-amber-600" />
              Skill Match
            </h3>
            
            <SkillsMatchChart skills={skills} maxSkills={6} />
            
            {/* 3-Level Skills Visualization */}
            {skills && skills.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Target size={16} className="text-purple-600" />
                  Detailed Skill Proficiency
                </h4>
                <SkillThreeLevelChart 
                  skills={skills.map((s: any) => ({
                    skill: s.skill || s.name || 'Unknown',
                    jdLevel: s.required ? 100 : 50,
                    resumeLevel: s.level || s.proficiency || 0,
                    fullProfileLevel: (s.level || s.proficiency || 0) + 10, // Placeholder: would come from full profile analysis
                  }))}
                  maxSkills={6}
                />
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Company Intelligence - Full Width */}
        <CompanyIntelligenceCard
          jobId={jobId}
          jobDescription={jobDescription}
          companyName={companyName}
          companyUrls={companyUrls}
          company={aiData?.companyIntelligence || null}
          isAiPowered={provider === 'remote'}
        />

        {/* Row 3: Company Ecosystem Matrix - Full Width */}
        <CompanyEcosystemMatrix
          companies={aiData?.companyEcosystem || []}
          isAiPowered={provider === 'remote'}
        />

        {/* Row 4: Match Matrix - Full Width */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              Match Matrix
            </h3>
            <button
              onClick={() => toggleSection('fit')}
              className="text-sm text-blue-600 hover:text-blue-700"
              data-testid="toggle-fit-section"
            >
              {expandedSections.has('fit') || expandedSections.has('all') ? 'Collapse' : 'Expand'}
            </button>
          </div>
          
          {(expandedSections.has('fit') || expandedSections.has('all')) && (
            <div>
              <FitTable 
                overall={matchScore}
                threshold={0.75}
                breakdown={aiData?.fitParams || [
                  { param: 'Technical Skills', jdEvidence: 'React, AWS, TypeScript', resumeEvidence: 'React (3y), AWS (2y)', weight: 0.9, score: 0.85, reasoning: 'Strong match' },
                  { param: 'Experience Level', jdEvidence: '5+ years', resumeEvidence: '6 years', weight: 0.8, score: 0.9, reasoning: 'Exceeds requirement' },
                  { param: 'Domain Knowledge', jdEvidence: 'Fintech', resumeEvidence: 'E-commerce', weight: 0.6, score: 0.5, reasoning: 'Partial match' },
                ]}
                sources={aiData?.sources || []}
                dryRun={provider === 'local'}
                onRefresh={onRefresh}
              />
            </div>
          )}
        </div>

        {/* Row 5: People Profiles - Full Width */}
        <PeopleProfilesCard
          jobId={jobId}
          jobDescription={jobDescription}
          recruiterUrl={recruiterUrl}
          peerUrls={peerUrls}
          skipLevelUrls={skipLevelUrls}
          profiles={aiData?.peopleProfiles || null}
          overallInsights={aiData?.peopleInsights}
          isAiPowered={provider === 'remote'}
        />

        {/* Sources */}
        {provider === 'remote' && aiData?.sources && aiData.sources.length > 0 && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Sources:</span>
            <div className="flex gap-2">
              {aiData.sources.map((source, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        {provider === 'local' && (
          <div className="mt-4 text-center">
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              Local fixture (no sources)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

