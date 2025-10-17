'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, TrendingUp, Target, Lightbulb, Users, Zap, Building2, Clock, AlertCircle } from 'lucide-react';
import LoadingPulse from '../LoadingPulse';
import { calculatePreliminaryScore } from '@/lib/preliminaryScore';
import { checkAnalysisGuardrails, recordAnalysis, getCooldownRemaining, type AnalysisInputs } from '@/lib/coach/analysisGuardrails';
import MatchScoreGauge from '@/app/components/ai/MatchScoreGauge';
import SkillsMatchChart from '@/app/components/ai/SkillsMatchChart';
import CompanyIntelligenceCard from '@/app/components/ai/CompanyIntelligenceCard';
import CompanyEcosystemTableCompact from '@/app/components/ai/CompanyEcosystemTableCompact';
import FullEcosystemModal from '@/app/components/ai/FullEcosystemModal';
import PeopleProfilesCard from '@/app/components/ai/PeopleProfilesCard';
import FitTable from '@/app/components/coach/tables/FitTable';
import PromptViewer from '@/app/components/ai/PromptViewer';
import AnalyzeButton from '@/app/components/ai/AnalyzeButton';
import SourcesModal, { type Source } from '@/app/components/ai/SourcesModal';
import { getMatchScoreCategory } from '@/lib/matchScoreCategories';

interface AiShowcaseProps {
  jobId: string;
  jobDescription?: string;
  resume?: string;
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
    ecosystemMetadata?: any;
    recommendations?: string[];
    sources?: string[];
    provider?: 'local' | 'remote';
    timestamp?: number;
  };
  onRefresh?: (analysisType?: 'company' | 'people' | 'match' | 'skills' | 'ecosystem' | 'all') => void;
}

export default function AiShowcase({ 
  jobId, 
  jobDescription = '',
  resume = '',
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
  const [preliminaryScore, setPreliminaryScore] = useState<number | null>(null);
  const [showPreliminary, setShowPreliminary] = useState(true);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [showCooldownWarning, setShowCooldownWarning] = useState(false);
  const [guardrailMessage, setGuardrailMessage] = useState<string | null>(null);
  const [showEcosystemModal, setShowEcosystemModal] = useState(false);
  const [showMatchScoreSourcesModal, setShowMatchScoreSourcesModal] = useState(false);
  const [showSkillMatchSourcesModal, setShowSkillMatchSourcesModal] = useState(false);
  
  // Use metadata from aiData if available, fallback to local state
  const ecosystemCacheMetadata = aiData?.ecosystemMetadata || null;

  // Calculate preliminary score on mount
  useEffect(() => {
    if (jobDescription && resume) {
      const result = calculatePreliminaryScore(jobDescription, resume);
      setPreliminaryScore(result.score);
      
      // Hide preliminary when AI score available
      if (aiData?.matchScore !== undefined) {
        setShowPreliminary(false);
      }
    }
  }, [jobDescription, resume, aiData?.matchScore]);

  // Check cooldown periodically
  useEffect(() => {
    const checkCooldown = () => {
      const remaining = getCooldownRemaining(jobId);
      setCooldownRemaining(remaining);
      
      if (remaining > 0) {
        setShowCooldownWarning(true);
      } else {
        setShowCooldownWarning(false);
      }
    };

    // Check immediately
    checkCooldown();

    // Check every second while in cooldown
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [jobId]);

  const formatCooldownTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }, []);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleRefresh = async (override: boolean = false, analysisType?: 'company' | 'people' | 'match' | 'skills' | 'ecosystem' | 'all') => {
    // Only check cooldown for global "Analyze with AI" button (when analysisType is undefined or 'all')
    const isGlobalAnalysis = !analysisType || analysisType === 'all';
    
    if (isGlobalAnalysis) {
      // Check guardrails before proceeding (only for global analysis)
      const inputs: AnalysisInputs = {
        jdText: jobDescription,
        resumeText: resume,
        peopleUrls: [...peerUrls, ...skipLevelUrls],
        companyUrls: companyUrls,
      };

      const guardrailCheck = checkAnalysisGuardrails(jobId, inputs, override);

      if (!guardrailCheck.canProceed && !override) {
        setGuardrailMessage(guardrailCheck.warningMessage || 'Cannot proceed with analysis');
        
        if (guardrailCheck.reason === 'cooldown') {
          setShowCooldownWarning(true);
        }
        
        return;
      }
    }

    setIsRefreshing(true);
    setGuardrailMessage(null);
    
    try {
      await onRefresh?.(analysisType);
      
      // Record successful analysis (only for global analysis to trigger cooldown)
      if (isGlobalAnalysis) {
        const inputs: AnalysisInputs = {
          jdText: jobDescription,
          resumeText: resume,
          peopleUrls: [...peerUrls, ...skipLevelUrls],
          companyUrls: companyUrls,
        };
        recordAnalysis(jobId, inputs);
      }
      
      setShowPreliminary(false); // Hide preliminary after AI refresh
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsRefreshing(false);
    }
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
  
  // Determine if ANY real AI analysis has been done (check for persisted data or cached data)
  const hasAnyAiAnalysis = !!(
    aiData?.companyEcosystem?.length > 0 || 
    aiData?.companyIntelligence || 
    aiData?.matchScoreMetadata ||
    aiData?.companyIntelMetadata ||
    aiData?.ecosystemMetadata
  );
  
  const provider = hasAnyAiAnalysis ? 'remote' : (aiData?.provider || 'local');
  const hasData = !!aiData;
  
  // Get category-specific recommendations
  const percentage = matchScore > 1 ? matchScore : matchScore * 100;
  const categoryInfo = getMatchScoreCategory(percentage);
  const recommendations = aiData?.recommendations || categoryInfo.recommendations;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm" data-testid="ai-showcase">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Analysis</h2>
          <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium ${
            provider === 'remote' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-700' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${provider === 'remote' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            {provider === 'remote' ? 'AI Powered' : 'Non-AI Powered'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleRefresh(false)}
              disabled={isRefreshing || cooldownRemaining > 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-sm font-bold transition-all shadow-sm"
              data-testid="analyze-with-ai-button"
              title={cooldownRemaining > 0 ? `Cooldown active: ${formatCooldownTime(cooldownRemaining)} remaining` : "Run AI analysis on your resume and job description"}
            >
              {isRefreshing ? (
                <LoadingPulse size={18} />
              ) : cooldownRemaining > 0 ? (
                <Clock size={18} />
              ) : (
                <Sparkles size={18} />
              )}
              {isRefreshing ? 'Analyzing...' : cooldownRemaining > 0 ? `Wait ${formatCooldownTime(cooldownRemaining)}` : 'Analyze with AI'}
            </button>

            {/* Cooldown Warning */}
            {showCooldownWarning && cooldownRemaining > 0 && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md text-sm">
                <Clock size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-orange-800 font-medium">Analysis cooldown active</p>
                  <p className="text-orange-700 text-xs mt-1">
                    Please wait {formatCooldownTime(cooldownRemaining)} before running another analysis. 
                    This prevents excessive API usage.
                  </p>
                </div>
                <button
                  onClick={() => handleRefresh(true)}
                  className="text-orange-700 hover:text-orange-900 text-xs font-medium whitespace-nowrap"
                >
                  Override
                </button>
              </div>
            )}

            {/* No Changes Warning */}
            {guardrailMessage && !showCooldownWarning && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <Zap size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-blue-800 text-xs">{guardrailMessage}</p>
                </div>
                <button
                  onClick={() => handleRefresh(true)}
                  className="text-blue-700 hover:text-blue-900 text-xs font-medium whitespace-nowrap"
                >
                  Run Anyway
                </button>
              </div>
            )}
          </div>

          <PromptViewer 
            promptKind="compare" 
            version="v1"
            buttonLabel=""
            className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
          />
        </div>
      </div>

      {/* Main Grid - Reorganized Layout */}
      <div className="p-6 space-y-6">
        {/* Row 1: Match Score + Skill Match */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Match Score Card - Reorganized Layout */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Target size={18} className="text-purple-600" />
                Match Score
              </h3>
              
              <div className="flex items-center gap-2">
                {/* Analyzed badge - right before buttons */}
                {aiData?.matchScoreMetadata?.cached && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    Analyzed {aiData.matchScoreMetadata.cacheAge}
                  </span>
                )}

                {/* Standard button order: Analyze -> Prompt -> Sources */}
                
                {/* AI Analysis - Position 1 */}
                <AnalyzeButton
                  onAnalyze={() => handleRefresh(false, 'match')}
                  isAnalyzing={isRefreshing}
                  label="Analyze Match Score"
                  estimatedCost={0.02}
                  estimatedSeconds={20}
                />

                {/* View Prompt - Position 2 */}
                <PromptViewer 
                  promptKind="matchScore" 
                  version="v1"
                  buttonLabel=""
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                />

                {/* View Sources - Position 3 */}
                <button
                  onClick={() => setShowMatchScoreSourcesModal(true)}
                  className="flex items-center gap-1.5 px-2 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                  title="View Sources"
                >
                  <AlertCircle size={14} />
                </button>
              </div>
            </div>
            
            {/* Sources Modal */}
            <SourcesModal
              isOpen={showMatchScoreSourcesModal}
              onClose={() => setShowMatchScoreSourcesModal(false)}
              sources={[]}
              sectionName="Match Score"
            />
            
            {/* Preliminary Score Badge */}
            {showPreliminary && preliminaryScore !== null && (
              <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-xs text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                <Zap size={14} />
                <span>
                  <strong>Preliminary Score:</strong> {preliminaryScore}% 
                  <span className="ml-1 text-yellow-600">(Local calculation - Click &quot;Analyze with AI&quot; for full analysis)</span>
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Left: Gauge */}
              <div className="flex items-center justify-center">
                <MatchScoreGauge score={showPreliminary && preliminaryScore !== null ? preliminaryScore : matchScore} size={140} showInsights={true} />
              </div>
              
              {/* Right: Category Insights */}
              <div className="flex flex-col justify-center space-y-2">
                <div className={`p-3 rounded-lg ${categoryInfo.bgColor} ${categoryInfo.textColor}`}>
                  <p className="font-semibold text-sm mb-1">{categoryInfo.emoji} {categoryInfo.label}</p>
                  <p className="text-xs italic">&quot;{categoryInfo.description}&quot;</p>
                </div>
                
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
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
            <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-purple-200 dark:border-purple-800">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">✓ Highlights</div>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500">●</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">△ Gaps</div>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
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
            <div className="pt-4 border-t border-purple-200 dark:border-purple-800">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">💡 Top Recommendations:</div>
              <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Skill Match Card */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-600" />
                Skill Match
              </h3>
              
              <div className="flex items-center gap-2">
                {/* Analyzed badge - right before buttons */}
                {aiData?.matchScoreMetadata?.cached && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    Analyzed {aiData.matchScoreMetadata.cacheAge}
                  </span>
                )}

                {/* Standard button order: Analyze -> Prompt -> Sources */}

                {/* AI Analysis - Position 1 */}
                <AnalyzeButton
                  onAnalyze={() => handleRefresh(false, 'skills')}
                  isAnalyzing={isRefreshing}
                  label="Analyze Skills Match"
                  estimatedCost={0.02}
                  estimatedSeconds={20}
                />

                {/* View Prompt - Position 2 */}
                <PromptViewer 
                  promptKind="matchScore" 
                  version="v1"
                  buttonLabel=""
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                />

                {/* View Sources - Position 3 */}
                <button
                  onClick={() => setShowSkillMatchSourcesModal(true)}
                  className="flex items-center gap-1.5 px-2 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                  title="View Sources"
                >
                  <AlertCircle size={14} />
                </button>
              </div>
            </div>
            
            {/* Sources Modal */}
            <SourcesModal
              isOpen={showSkillMatchSourcesModal}
              onClose={() => setShowSkillMatchSourcesModal(false)}
              sources={[]}
              sectionName="Skill Match"
            />
            
            <SkillsMatchChart skills={skills} maxSkills={6} />
            
            {/* Detailed skill proficiency now integrated into unified chart above */}
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
          metadata={aiData?.companyIntelMetadata}
          onAnalyze={async () => {
            await onRefresh?.('company');
          }}
          isAnalyzing={isRefreshing}
        />

        {/* Row 3: Company Ecosystem - Full Width */}
        <CompanyEcosystemTableCompact
          companies={aiData?.companyEcosystem || []}
          isAiPowered={provider === 'remote'}
          onRefresh={() => onRefresh?.('ecosystem')}
          refreshing={isRefreshing}
          onViewFull={() => setShowEcosystemModal(true)}
          cacheMetadata={ecosystemCacheMetadata}
        />

        {/* Full Ecosystem Modal */}
        <FullEcosystemModal
          isOpen={showEcosystemModal}
          onClose={() => setShowEcosystemModal(false)}
          companies={aiData?.companyEcosystem || []}
          cacheMetadata={ecosystemCacheMetadata}
        />

        {/* Row 4: Match Matrix - Full Width */}
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
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Sources:</span>
            <div className="flex gap-2">
              {aiData.sources.map((source, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        {provider === 'local' && (
          <div className="mt-4 text-center">
            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm">
              Local fixture (no sources)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

