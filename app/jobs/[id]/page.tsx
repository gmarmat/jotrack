"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CollapsibleHorizontalTimeline from '@/app/components/timeline/CollapsibleHorizontalTimeline';
import JobHeader from '@/app/components/jobs/JobHeader';
import JobNotesCard from '@/app/components/jobs/JobNotesCard';
import StatusChipDropdown from '@/app/components/jobs/StatusChipDropdown';
import AiShowcase from '@/app/components/jobs/AiShowcase';
import CoachModeEntryCard from '@/app/components/coach/CoachModeEntryCard';
import AttachmentsModal from '@/app/components/AttachmentsModal';
import AttachmentsSection from '@/app/components/attachments/AttachmentsSection';
import AnalyzeButton from '@/app/components/ai/AnalyzeButton';
import GlobalSettingsButton from '@/app/components/GlobalSettingsButton';
import VariantViewerModal from '@/app/components/VariantViewerModal';
import { type JobStatus } from '@/lib/status';
import { calculateDelta } from '@/lib/timeDelta';
import { ChevronDown, ChevronUp, Eye, Paperclip, CheckCircle2, FileText, X } from 'lucide-react';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  // Standard button class for 3-column header (per UI_DESIGN_SYSTEM)
  const COLUMN_BUTTON_CLASS = "w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors";
  
  const [job, setJob] = useState<any>(null);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [jdAttachmentId, setJdAttachmentId] = useState<string | null>(null);
  
  // Progression hints state (dismissible, localStorage pattern)
  const [showProgressHints, setShowProgressHints] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('jotrack_progress_hints_dismissed') !== 'true';
  });
  
  const dismissHints = () => {
    localStorage.setItem('jotrack_progress_hints_dismissed', 'true');
    setShowProgressHints(false);
  };
  const [currentStatusEnteredAt, setCurrentStatusEnteredAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  
  // v2.7: Staleness detection
  const [stalenessInfo, setStalenessInfo] = useState<{
    isStale: boolean;
    severity: 'fresh' | 'never_analyzed' | 'minor' | 'major' | 'no_variants' | 'variants_fresh';
    message: string;
    changedArtifacts?: string[];
    hasVariants?: boolean;
    hasAnalysis?: boolean;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false);
  
  // v2.7: Refresh Data (new two-button system)
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [changelog, setChangelog] = useState<{
    kind: string;
    filename: string;
    similarity?: number;
    changes?: Array<{ type: string; category: string; value: string }>;
    significance?: 'none' | 'minor' | 'major';
  }[] | null>(null);
  
  // v2.7: Data Status Panel (always visible, collapsible)
  const [dataStatusExpanded, setDataStatusExpanded] = useState(true);
  const [variantViewerOpen, setVariantViewerOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    id: string;
    filename: string;
    kind: string;
  } | null>(null);
  const [attachmentsList, setAttachmentsList] = useState<any[]>([]);
  
  // ESC key handler for attachments modal
  useEffect(() => {
    if (!showAttachmentsModal) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAttachmentsModal(false);
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showAttachmentsModal]);
  const [aiData, setAiData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null); // v2.4: Data for AiShowcase
  const router = useRouter();
  const id = params.id;

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        setJob(data);
        
        // Fetch attachments
        const attRes = await fetch(`/api/jobs/${id}/attachments`);
        const attData = await attRes.json();
        const attachments = Array.isArray(attData) ? attData : (attData.attachments || []);
        setAttachmentCount(attachments.length);
        setAttachmentsList(attachments);
        
        // Find JD attachment
        const jdAttachment = attachments.find((a: any) => a.kind === 'jd');
        if (jdAttachment) {
          setJdAttachmentId(jdAttachment.id);
        }
        
        // Fetch status events for delta calculation
        try {
          const eventsRes = await fetch(`/api/jobs/${id}/status-events`);
          const eventsData = await eventsRes.json();
          const currentEvent = eventsData.events?.find((e: any) => !e.leftAt);
          if (currentEvent) {
            setCurrentStatusEnteredAt(currentEvent.enteredAt);
          }
        } catch (error) {
          console.error("Failed to fetch status events:", error);
        }
      } catch (error) {
        console.error('Failed to fetch job:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, router]);

  // v2.4: Fetch analysis data for AiShowcase
  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}/analysis-data`);
        if (res.ok) {
          const data = await res.json();
          setAnalysisData(data);
          
          // Initialize aiData with cached analysis results
          const hasAnalysisData = data.companyEcosystem || data.companyIntelligence || data.matchScoreData;
          
          if (hasAnalysisData) {
            // Map skills data structure: { skill: "X" } → { term: "X" }
            const rawSkills = data.matchScoreData?.skillsMatch?.technicalSkills || [];
            const mappedSkills = rawSkills.map((s: any) => ({
              term: s.skill || s.term, // Support both formats
              jdCount: s.jdCount || 0,
              resumeCount: s.resumeCount || 0,
              fullProfileCount: s.fullProfileCount || 0,
              category: s.category,
              matchStrength: s.matchStrength,
              yearsExperience: s.yearsExperience,
              importance: s.importance,
            }));
            
            setAiData((prev: any) => ({
              ...prev,
              companyEcosystem: data.companyEcosystem || prev?.companyEcosystem,
              ecosystemMetadata: data.ecosystemMetadata || prev?.ecosystemMetadata,
              companyIntelligence: data.companyIntelligence || prev?.companyIntelligence,
              companyIntelMetadata: data.companyIntelMetadata || prev?.companyIntelMetadata,
              // Match Score + Skills data (unified)
              matchScore: data.matchScoreData?.matchScore?.overallScore || prev?.matchScore,
              highlights: data.matchScoreData?.matchScore?.topStrengths || prev?.highlights,
              gaps: data.matchScoreData?.matchScore?.topGaps || prev?.gaps,
              skills: mappedSkills.length > 0 ? mappedSkills : prev?.skills,
              matchScoreMetadata: data.matchScoreMetadata || prev?.matchScoreMetadata,
              // People Profiles (from cache)
              peopleProfiles: data.peopleProfiles?.profiles || prev?.peopleProfiles,
              peopleInsights: data.peopleProfiles?.insights || prev?.peopleInsights,
              peopleProfilesMetadata: data.peopleProfilesMetadata || prev?.peopleProfilesMetadata,
              provider: (data.matchScoreData || data.companyEcosystem || data.companyIntelligence || data.peopleProfiles) ? 'remote' : (prev?.provider || 'local'),
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch analysis data:', error);
      }
    };
    if (id) {
      fetchAnalysisData();
    }
  }, [id]);

  // v2.7: Check staleness on mount and after changes
  const checkStaleness = async () => {
    try {
      const res = await fetch(`/api/jobs/${id}/check-staleness`);
      if (res.ok) {
        const data = await res.json();
        setStalenessInfo(data);
      }
    } catch (error) {
      console.error('Failed to check staleness:', error);
    }
  };
  
  useEffect(() => {
    if (id) {
      checkStaleness();
    }
  }, [id, attachmentCount]); // Re-check when attachments change
  
  // Also recheck when returning to the page (after toggling versions in modal)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && id) {
        checkStaleness();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [id]);

  const handleStatusChange = (newStatus: JobStatus) => {
    setJob((prev: any) => ({ ...prev, status: newStatus }));
    // Optionally refetch to get updated data
    window.location.reload();
  };

  const handleRefreshAI = async (analysisType?: 'company' | 'people' | 'match' | 'skills' | 'ecosystem' | 'all') => {
    try {
      console.log('🔄 Refreshing AI insights...', analysisType || 'all');
      
      // v2.7: Implement specific API calls for each analysis type
      
      // Company Ecosystem Analysis
      if (analysisType === 'ecosystem') {
        const res = await fetch(`/api/jobs/${id}/analyze-ecosystem`, {
          method: 'POST',
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Ecosystem analysis failed');
        }
        
        const data = await res.json();
        console.log('✅ Ecosystem analysis complete:', {
          companies: data.analysis?.companies?.length || 0,
          cost: data.metadata?.cost,
          cached: data.metadata?.cached,
        });
        
        setAiData((prev: any) => ({
          ...prev,
          companyEcosystem: data.analysis?.companies || [],
        }));
        
        return; // Success - UI updates automatically
      }
      
      // Company Intelligence
      if (analysisType === 'company' || analysisType === 'all') {
        const res = await fetch(`/api/jobs/${id}/analyze-company`, {
          method: 'POST',
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Company intelligence failed');
        }
        
        const data = await res.json();
        console.log('✅ Company intelligence complete:', {
          cost: data.metadata?.cost,
          webSearchUsed: data.metadata?.webSearchUsed,
          companyName: data.analysis?.company?.name,
        });
        
        // Extract the 'company' object from the analysis response
        setAiData((prev: any) => ({
          ...prev,
          companyIntelligence: data.analysis?.company || {},
        }));
        
        if (analysisType === 'company') {
          return; // Success - UI updates automatically
        }
        // Fall through to 'all' case
      }
      
      // Match Score + Skills Analysis (unified API call)
      // Both 'match' and 'skills' analysis types call the same endpoint
      if (analysisType === 'match' || analysisType === 'skills' || analysisType === 'all') {
        const res = await fetch(`/api/jobs/${id}/analyze-match-score`, {
          method: 'POST',
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Match score analysis failed');
        }
        
        const data = await res.json();
        console.log('✅ Match score + skills analysis complete:', {
          matchScore: data.analysis?.matchScore?.overallScore,
          skillsCount: data.analysis?.skillsMatch?.technicalSkills?.length || 0,
          cost: data.metadata?.cost,
        });
        
        // Update both Match Score and Skills Match sections
        setAiData((prev: any) => ({
          ...prev,
          matchScore: data.analysis?.matchScore?.overallScore || prev.matchScore,
          highlights: data.analysis?.matchScore?.topStrengths || prev.highlights,
          gaps: data.analysis?.matchScore?.topGaps || prev.gaps,
          skills: data.analysis?.skillsMatch?.technicalSkills || prev.skills,
          matchScoreMetadata: data.metadata,
          provider: 'remote', // Mark as AI-powered
        }));
        
        if (analysisType === 'match' || analysisType === 'skills') {
          return; // Success - UI updates automatically
        }
        // Fall through to 'all' case
      }
      
      // Match Matrix / Signal Evaluation (ATS signals)
      if (analysisType === 'all') {
        const res = await fetch(`/api/jobs/${id}/evaluate-signals`, {
          method: 'POST',
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Signal evaluation failed');
        }
        
        const data = await res.json();
        
        // Transform evaluations to FitDimension format for FitTable
        const fitParams = (data.evaluations || []).map((ev: any) => ({
          param: ev.signalName || 'Unknown Signal',
          weight: 0.8, // TODO: Get from ats_signals table
          jdEvidence: ev.jdEvidence || '',
          resumeEvidence: ev.resumeEvidence || '',
          score: ev.overallScore || 0,
          reasoning: ev.aiReasoning || '',
        }));
        
        // Calculate overall match score (weighted average)
        const totalWeight = fitParams.reduce((sum: number, p: any) => sum + p.weight, 0);
        const weightedScore = fitParams.reduce((sum: number, p: any) => sum + (p.weight * p.score), 0);
        const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
        
        console.log('✅ Match Matrix evaluation complete:', {
          signals: fitParams.length,
          overallScore: (overallScore * 100).toFixed(0) + '%',
          jdVersion: data.jdVersion,
          resumeVersion: data.resumeVersion,
        });
        
        setAiData((prev: any) => ({
          ...prev,
          fitParams,
          matchScore: overallScore,
        }));
        
        if (analysisType === 'match') {
          return; // Success - UI updates automatically
        }
        // Fall through to 'all' case
      }
      
      // People Profiles (user profile analysis)
      if (analysisType === 'people' || analysisType === 'all') {
        const res = await fetch(`/api/jobs/${id}/analyze-user-profile`, {
          method: 'POST',
        });
        
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Profile analysis failed');
        }
        
        const data = await res.json();
        console.log('✅ User profile analysis complete:', {
          cost: data.metadata?.cost,
        });
        
        setAiData((prev: any) => ({
          ...prev,
          peopleProfiles: data.analysis?.profiles || prev.peopleProfiles,
          peopleInsights: data.analysis?.insights || prev.peopleInsights,
        }));
        
        if (analysisType === 'people') {
          return; // Success - UI updates automatically
        }
        // Fall through to 'all' case
      }
      
      // If 'all', show success message
      if (analysisType === 'all') {
        console.log('✅ All analyses complete!');
        return;
      }
      
      // For other types, reload for now (will wire individually)
      console.log('ℹ️ Analysis type not yet wired, reloading page...');
      window.location.reload();
    } catch (error) {
      console.error('❌ Error refreshing AI insights:', error);
      alert('Analysis failed: ' + (error as Error).message);
    }
  };

  const handleViewJd = () => {
    setShowAttachmentsModal(true);
  };

  // v2.7: Handle global analyze all
  const handleGlobalAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeSuccess(false);

    try {
      const res = await fetch(`/api/jobs/${id}/analyze-all`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setAnalyzeError(data.message || 'Analysis failed');
        return;
      }

      // Success! Show success message for 3 seconds
      setAnalyzeSuccess(true);
      setTimeout(() => setAnalyzeSuccess(false), 3000);

      // Refresh staleness info
      const stalenessRes = await fetch(`/api/jobs/${id}/check-staleness`);
      if (stalenessRes.ok) {
        const stalenessData = await stalenessRes.json();
        setStalenessInfo(stalenessData);
      }

      // Optionally refresh the page to show updated analysis
      // window.location.reload();
    } catch (error) {
      console.error('Error running global analysis:', error);
      setAnalyzeError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // v2.7: Handle refresh variants (new two-button system)
  const handleRefreshVariants = async () => {
    setRefreshing(true);
    setRefreshError(null);
    setRefreshSuccess(false);
    setChangelog(null);

    try {
      const res = await fetch(`/api/jobs/${id}/refresh-variants`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setRefreshError(data.error || 'Refresh failed');
        return;
      }

      // Success! Show changelog
      setRefreshSuccess(true);
      setChangelog(data.processed || []);

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setRefreshSuccess(false);
        setChangelog(null);
      }, 5000);

      // Refresh staleness info
      const stalenessRes = await fetch(`/api/jobs/${id}/check-staleness`);
      if (stalenessRes.ok) {
        const stalenessData = await stalenessRes.json();
        setStalenessInfo(stalenessData);
      }
    } catch (error) {
      console.error('Error refreshing variants:', error);
      setRefreshError(error instanceof Error ? error.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center text-gray-600">Loading...</div>
        </div>
      </main>
    );
  }

  if (!job) return null;

  const currentStatus = (job.status as JobStatus) ?? 'ON_RADAR';
  const delta = currentStatusEnteredAt ? calculateDelta(currentStatusEnteredAt) : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Global Settings Button moved to HeaderMeta ribbon */}
      
      {/* Timeline - Full width above everything */}
      <CollapsibleHorizontalTimeline 
        currentStatus={currentStatus} 
        onStatusClick={() => {}}
        currentStatusDelta={delta?.label}
        postingUrl={job.posting_url || job.postingUrl}
        createdAt={job.created_at || job.createdAt}
        jobTitle={job.title}
        companyName={job.company}
        updatedAt={job.updated_at || job.updatedAt}
        currentStatusEnteredAt={currentStatusEnteredAt || undefined}
        jdAttachmentId={jdAttachmentId}
        onViewJd={handleViewJd}
      />

      <div className="max-w-6xl mx-auto px-4 space-y-6 mt-6 pb-8">
        {/* Back link */}
        <div className="text-sm">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to list
          </Link>
        </div>

        {/* v2.7: Success Message (shows for 3 seconds after analysis) */}
        {analyzeSuccess && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-600">
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <div>
                <p className="font-semibold text-green-900 dark:text-green-300">
                  Analysis Complete!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Extracted variants from your documents and created analysis fingerprint
                </p>
              </div>
            </div>
          </div>
        )}

        {/* v2.7: Refresh Success Message + Changelog */}
        {refreshSuccess && changelog && (
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 dark:border-purple-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <div>
                <p className="font-semibold text-purple-900 dark:text-purple-300">
                  Data Refreshed!
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  AI-optimized variants created from your documents
                </p>
              </div>
            </div>
            
            {/* Changelog */}
            {changelog.length > 0 && (
              <div className="mt-3 space-y-2">
                {changelog.map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {item.filename}
                      </span>
                      {item.similarity !== undefined && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {Math.round(item.similarity * 100)}% similar
                        </span>
                      )}
                    </div>
                    {item.changes && item.changes.length > 0 && (
                      <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                        {item.changes.slice(0, 3).map((change, cidx) => (
                          <li key={cidx}>
                            {change.type === 'added' && '➕ '}
                            {change.type === 'removed' && '➖ '}
                            {change.type === 'updated' && '🔄 '}
                            {change.value}
                          </li>
                        ))}
                        {item.changes.length > 3 && (
                          <li className="text-gray-500 dark:text-gray-500">
                            ...and {item.changes.length - 3} more changes
                          </li>
                        )}
                      </ul>
                    )}
                    {item.significance && (
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                        item.significance === 'major' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                        item.significance === 'minor' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {item.significance === 'major' ? 'Major changes' :
                         item.significance === 'minor' ? 'Minor changes' :
                         'No significant changes'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* v2.7: OLD Data Status Panel - MOVED to 3-column header above, keeping for reference */}
        {false && stalenessInfo && (
          <div
            className={`p-4 rounded-lg border-l-4 ${
              stalenessInfo.severity === 'no_variants'
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 dark:border-purple-600'
                : stalenessInfo.severity === 'variants_fresh'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600'
                : stalenessInfo.severity === 'major'
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 dark:border-orange-600'
                : stalenessInfo.severity === 'never_analyzed'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600'
                : stalenessInfo.severity === 'fresh'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-600'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDataStatusExpanded(!dataStatusExpanded)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title={dataStatusExpanded ? 'Collapse' : 'Expand'}
                  >
                    {dataStatusExpanded ? (
                      <ChevronUp size={20} className="text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                  <span className="text-lg">
                    {stalenessInfo.severity === 'no_variants' ? '📄' :
                     stalenessInfo.severity === 'variants_fresh' ? '🌟' :
                     stalenessInfo.severity === 'major' ? '⚠️' : 
                     stalenessInfo.severity === 'never_analyzed' ? '🌟' : 
                     stalenessInfo.severity === 'fresh' ? '✅' : 'ℹ️'}
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {stalenessInfo.severity === 'no_variants' ? 'Documents Ready' :
                     stalenessInfo.severity === 'variants_fresh' ? 'Data Extracted - Start Analysis' :
                     stalenessInfo.severity === 'major' ? 'Documents Changed' :
                     stalenessInfo.severity === 'never_analyzed' ? 'Upload Documents' :
                     stalenessInfo.severity === 'fresh' ? 'Analysis Complete' :
                     'Updates Available'}
                  </p>
                  <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                    {stalenessInfo.severity === 'no_variants' ? '· Click "Refresh Data" to create AI-ready variants from your uploads (~$0.02)' :
                     stalenessInfo.severity === 'variants_fresh' ? '· AI variants ready · Scroll to sections below and trigger analysis for each (~$0.05-0.10 per section)' :
                     stalenessInfo.severity === 'major' ? '· Documents updated · Click "Refresh Data" to refresh AI variants before analyzing' :
                     stalenessInfo.severity === 'never_analyzed' ? '· Upload Resume + JD to begin · System will auto-detect when ready' :
                     stalenessInfo.severity === 'fresh' ? '· All data and analysis current · System will alert when significant changes detected' :
                     '· Minor updates detected · Consider extracting fresh data'}
                  </span>
                </div>
                {stalenessInfo.changedArtifacts && stalenessInfo.changedArtifacts.length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Changed: {stalenessInfo.changedArtifacts.join(', ')}
                  </p>
                )}
              </div>
              
              {/* v2.7: Smart two-button system based on state */}
              <div className="flex gap-2">
                {/* State 1 (NO_VARIANTS): Show ONLY Refresh Data */}
                {(stalenessInfo.severity === 'no_variants') && (
                  <button
                    onClick={handleRefreshVariants}
                    disabled={refreshing}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                      refreshing
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                    }`}
                  >
                    {refreshing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Extracting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        Refresh Data
                        <span className="text-xs opacity-75">~$0.02</span>
                      </span>
                    )}
                  </button>
                )}

                {/* State 2 (VARIANTS_FRESH): Show ONLY Analyze All */}
                {stalenessInfo.severity === 'variants_fresh' && (
                  <button
                    onClick={handleGlobalAnalyze}
                    disabled={analyzing}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                      analyzing
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                    }`}
                  >
                    {analyzing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        Analyze All
                        <span className="text-xs opacity-75">~$0.20</span>
                      </span>
                    )}
                  </button>
                )}

                {/* State 3 (STALE/MAJOR): Show BOTH, highlight Refresh */}
                {(stalenessInfo.severity === 'major' || stalenessInfo.severity === 'minor' || stalenessInfo.severity === 'never_analyzed') && (
                  <>
                    <button
                      onClick={handleRefreshVariants}
                      disabled={refreshing}
                      className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                        refreshing
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                      }`}
                    >
                      {refreshing ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Extracting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          Refresh Data
                          <span className="text-xs opacity-75">~$0.02</span>
                        </span>
                      )}
                    </button>

                    <button
                      onClick={handleGlobalAnalyze}
                      disabled={analyzing}
                      className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                        analyzing
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white opacity-75 hover:opacity-100'
                      }`}
                    >
                      {analyzing ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          Analyze All
                          <span className="text-xs opacity-75">~$0.20</span>
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Collapsible Content */}
            {dataStatusExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                
                {/* Input Documents Section */}
                {attachmentsList.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      📎 Input Documents ({attachmentsList.length})
                    </p>
                <div className="space-y-2">
                  {attachmentsList.map((att: any) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {att.kind === 'resume' ? '📄' :
                           att.kind === 'jd' ? '💼' :
                           att.kind === 'cover_letter' ? '✉️' : '📎'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {att.filename}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {att.kind} • v{att.version}
                            {att.isActive && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                Active
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAttachment({
                            id: att.id,
                            filename: att.filename,
                            kind: att.kind,
                          });
                          setVariantViewerOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        <Eye size={16} />
                        View Variants
                      </button>
                    </div>
                  ))}
                </div>
                  </div>
                )}
                
                {/* Data Ready Badges - Single Line */}
                {stalenessInfo.hasVariants && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Ready:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {/* Match Analysis Badge */}
                      <button
                        onClick={() => {
                          document.getElementById('ai-showcase')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-800/40 dark:hover:to-blue-800/40 border border-purple-300 dark:border-purple-700 rounded-full text-xs font-medium text-purple-900 dark:text-purple-200 transition-all hover:shadow-md"
                        title="Scroll to Match Analysis section"
                      >
                        <span className="text-sm">🎯</span>
                        <span>Match</span>
                      </button>
                      
                      {/* Company Intelligence Badge */}
                      <button
                        onClick={() => {
                          document.getElementById('ai-showcase')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 hover:from-green-200 hover:to-teal-200 dark:hover:from-green-800/40 dark:hover:to-teal-800/40 border border-green-300 dark:border-green-700 rounded-full text-xs font-medium text-green-900 dark:text-green-200 transition-all hover:shadow-md"
                        title="Scroll to Company Intelligence section"
                      >
                        <span className="text-sm">🏢</span>
                        <span>Company</span>
                      </button>
                      
                      {/* Ecosystem Matrix Badge */}
                      <button
                        onClick={() => {
                          document.getElementById('ai-showcase')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 hover:from-cyan-200 hover:to-blue-200 dark:hover:from-cyan-800/40 dark:hover:to-blue-800/40 border border-cyan-300 dark:border-cyan-700 rounded-full text-xs font-medium text-cyan-900 dark:text-cyan-200 transition-all hover:shadow-md"
                        title="Scroll to Company Ecosystem section"
                      >
                        <span className="text-sm">🌐</span>
                        <span>Ecosystem</span>
                      </button>
                      
                      {/* User Profile Badge */}
                      <button
                        onClick={() => {
                          // Scroll to profile section or navigate to /profile page
                          document.getElementById('ai-showcase')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 hover:from-orange-200 hover:to-yellow-200 dark:hover:from-orange-800/40 dark:hover:to-yellow-800/40 border border-orange-300 dark:border-orange-700 rounded-full text-xs font-medium text-orange-900 dark:text-orange-200 transition-all hover:shadow-md"
                        title="Scroll to User Profile section"
                      >
                        <span className="text-sm">👤</span>
                        <span>Profile</span>
                      </button>
                    </div>
                  </div>
                )}
                
              </div>
            )}
            
            {/* Error messages */}
            {refreshError && (
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-sm text-red-800 dark:text-red-300">
                Refresh Error: {refreshError}
              </div>
            )}
            {analyzeError && (
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-sm text-red-800 dark:text-red-300">
                Analysis Error: {analyzeError}
              </div>
            )}
          </div>
        )}

        {/* Combined Header with 3-Column Layout */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 overflow-hidden">
          {/* 3-Column Grid with Fixed Heights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-[280px]">
            {/* Column 1: Simple Layout - Job Title, Company, Status, 3 Doc Rows, Attachments Button */}
            <div className="p-6 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              {/* Job Title */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1" data-testid="job-title">
                {job.title}
              </h1>
              
              {/* Company and Status */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-base text-gray-600 dark:text-gray-400 flex-1" data-testid="job-company">
                  {job.company}
                </p>
                <StatusChipDropdown 
                  jobId={job.id} 
                  currentStatus={currentStatus}
                  onStatusChange={handleStatusChange}
                />
              </div>
              
              {/* Progression Hint #1: Upload (per UI_DESIGN_SYSTEM dismissible pattern) */}
              {showProgressHints && attachmentCount === 0 && (
                <div className="mb-4 flex items-center gap-2 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-xs border border-purple-200 dark:border-purple-700">
                  <span className="w-4 h-4 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold text-[10px]">1</span>
                  <span className="flex-1 text-gray-700 dark:text-gray-300">Upload Resume + JD</span>
                  <button 
                    onClick={dismissHints} 
                    className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full w-4 h-4 flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold"
                    title="Dismiss all hints"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* Document Rows with Shortened Filenames */}
              <div className="flex-1 space-y-1">
                {/* Resume */}
                <div className="flex items-center gap-2 text-xs">
                  {(() => {
                    const resumeAttachment = attachmentsList.find(a => a.kind === 'resume');
                    return resumeAttachment ? (
                      <button
                        onClick={() => setViewingAttachment({
                          id: resumeAttachment.id,
                          filename: resumeAttachment.filename,
                          textContent: resumeAttachment.text_content || 'No content available',
                          kind: 'resume'
                        })}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Preview Resume"
                      >
                        <Eye size={12} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    ) : (
                      <div className="w-6 h-6"></div>
                    );
                  })()}
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Resume:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {(() => {
                      const resumeAttachment = attachmentsList.find(a => a.kind === 'resume');
                      if (!resumeAttachment) return 'Not uploaded';
                      
                      const timestamp = resumeAttachment.created_at || resumeAttachment.createdAt;
                      const date = timestamp ? new Date(timestamp).toLocaleDateString('en-US', { 
                        month: 'numeric', 
                        day: 'numeric', 
                        year: '2-digit' 
                      }) : '';
                      
                      // Shorten filename if too long
                      const filename = resumeAttachment.filename;
                      const shortenedFilename = filename.length > 20 
                        ? `${filename.substring(0, 8)}...${filename.substring(filename.lastIndexOf('.'))}`
                        : filename;
                      
                      return `${shortenedFilename} • ${date}`;
                    })()}
                  </span>
                </div>
                
                {/* JD */}
                <div className="flex items-center gap-2 text-xs">
                  {(() => {
                    const jdAttachment = attachmentsList.find(a => a.kind === 'jd');
                    return jdAttachment ? (
                      <button
                        onClick={() => setViewingAttachment({
                          id: jdAttachment.id,
                          filename: jdAttachment.filename,
                          textContent: jdAttachment.text_content || 'No content available',
                          kind: 'jd'
                        })}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Preview Job Description"
                      >
                        <Eye size={12} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    ) : (
                      <div className="w-6 h-6"></div>
                    );
                  })()}
                  <span className="text-gray-700 dark:text-gray-300 font-medium">JD:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {(() => {
                      const jdAttachment = attachmentsList.find(a => a.kind === 'jd');
                      if (!jdAttachment) return 'Not uploaded';
                      
                      const timestamp = jdAttachment.created_at || jdAttachment.createdAt;
                      const date = timestamp ? new Date(timestamp).toLocaleDateString('en-US', { 
                        month: 'numeric', 
                        day: 'numeric', 
                        year: '2-digit' 
                      }) : '';
                      
                      // Shorten filename if too long
                      const filename = jdAttachment.filename;
                      const shortenedFilename = filename.length > 20 
                        ? `${filename.substring(0, 8)}...${filename.substring(filename.lastIndexOf('.'))}`
                        : filename;
                      
                      return `${shortenedFilename} • ${date}`;
                    })()}
                  </span>
                </div>
                
                {/* Cover Letter */}
                <div className="flex items-center gap-2 text-xs">
                  {(() => {
                    const clAttachment = attachmentsList.find(a => a.kind === 'cover_letter');
                    return clAttachment ? (
                      <button
                        onClick={() => setViewingAttachment({
                          id: clAttachment.id,
                          filename: clAttachment.filename,
                          textContent: clAttachment.text_content || 'No content available',
                          kind: 'cover_letter'
                        })}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Preview Cover Letter"
                      >
                        <Eye size={12} className="text-gray-600 dark:text-gray-400" />
                      </button>
                    ) : (
                      <div className="w-6 h-6"></div>
                    );
                  })()}
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Cover Letter:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {(() => {
                      const clAttachment = attachmentsList.find(a => a.kind === 'cover_letter');
                      if (!clAttachment) return 'Not created';
                      
                      const timestamp = clAttachment.created_at || clAttachment.createdAt;
                      const date = timestamp ? new Date(timestamp).toLocaleDateString('en-US', { 
                        month: 'numeric', 
                        day: 'numeric', 
                        year: '2-digit' 
                      }) : '';
                      
                      // Shorten filename if too long
                      const filename = clAttachment.filename;
                      const shortenedFilename = filename.length > 20 
                        ? `${filename.substring(0, 8)}...${filename.substring(filename.lastIndexOf('.'))}`
                        : filename;
                      
                      return `${shortenedFilename} • ${date}`;
                    })()}
                  </span>
                </div>
              </div>
              
              {/* Attachments Button at Bottom */}
              <div className="mt-4">
                <button
                  onClick={() => setShowAttachmentsModal(true)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-xs"
                  data-testid="attachments-button-header"
                >
                  <Paperclip size={14} />
                  <span>Attachments</span>
                  {attachmentCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                      {attachmentCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Column 2: Data Pipeline with AI Button */}
            <div className="p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col">
              {/* Header with Standard AI Button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  Data Pipeline
                </h3>
                
                {/* Standard AI Button (like Match Score) */}
                <div className="flex items-center gap-2">
                  {/* Analyzed badge */}
                  {stalenessInfo?.variantsAnalyzedAt && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      Analyzed {(() => {
                        const ageMs = Date.now() - (stalenessInfo.variantsAnalyzedAt * 1000);
                        const minutes = Math.floor(ageMs / 60000);
                        const hours = Math.floor(ageMs / 3600000);
                        const days = Math.floor(ageMs / 86400000);
                        
                        if (minutes < 60) return `${minutes}m ago`;
                        if (hours < 24) return `${hours}h ago`;
                        return `${days}d ago`;
                      })()}
                    </span>
                  )}
                  
                  {/* AI Analysis Button */}
                  <AnalyzeButton
                    onAnalyze={stalenessInfo?.severity === 'no_variants' ? handleRefreshVariants : handleGlobalAnalyze}
                    isAnalyzing={refreshing || analyzing}
                    label={stalenessInfo?.severity === 'no_variants' ? "Extract Variants" : "Analyze All"}
                    estimatedCost={stalenessInfo?.severity === 'no_variants' ? 0.02 : 0.05}
                    estimatedSeconds={stalenessInfo?.severity === 'no_variants' ? 15 : 25}
                  />
                </div>
              </div>
              
              {/* Simple Description */}
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                AI converts documents into 3 variants (Raw, Short, Long) for analysis. Click "Analyze All" to process all sections.
              </p>

              {/* Variant Access Icons (Compact) */}
              {stalenessInfo?.hasVariants && attachmentsList.length > 0 && (
                <div className="space-y-2">
                  {/* Resume Variants */}
                  {(() => {
                    const resumeAttachment = attachmentsList.find(a => a.kind === 'resume');
                    return resumeAttachment ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-14">Resume:</span>
                        <button
                          onClick={async () => {
                            const variants = await fetch(`/api/attachments/${resumeAttachment.id}/variants`).then(r => r.json());
                            setViewingAttachment({
                              id: resumeAttachment.id,
                              filename: `${resumeAttachment.filename} (UI - Raw)`,
                              textContent: variants.ui || 'No UI variant found',
                              kind: 'resume'
                            });
                            setShowViewer(true);
                          }}
                          className="p-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded transition-colors"
                          title="View UI (Raw)"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            const variants = await fetch(`/api/attachments/${resumeAttachment.id}/variants`).then(r => r.json());
                            setViewingAttachment({
                              id: resumeAttachment.id,
                              filename: `${resumeAttachment.filename} (AI Optimized)`,
                              textContent: variants.ai_optimized || 'No AI Short variant found',
                              kind: 'resume'
                            });
                            setShowViewer(true);
                          }}
                          className="p-1 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded transition-colors"
                          title="View AI Optimized"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            const variants = await fetch(`/api/attachments/${resumeAttachment.id}/variants`).then(r => r.json());
                            setViewingAttachment({
                              id: resumeAttachment.id,
                              filename: `${resumeAttachment.filename} (Detailed)`,
                              textContent: variants.detailed || 'No AI Long variant found',
                              kind: 'resume'
                            });
                            setShowViewer(true);
                          }}
                          className="p-1 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-green-700 dark:text-green-300 rounded transition-colors"
                          title="View Detailed"
                        >
                          <Eye size={12} />
                        </button>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1">UI / AI-S / AI-L</span>
                      </div>
                    ) : null;
                  })()}
                  
                  {/* JD Variants */}
                  {(() => {
                    const jdAttachment = attachmentsList.find(a => a.kind === 'jd');
                    return jdAttachment ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-14">JD:</span>
                        <button
                          onClick={async () => {
                            const variants = await fetch(`/api/attachments/${jdAttachment.id}/variants`).then(r => r.json());
                            setViewingAttachment({
                              id: jdAttachment.id,
                              filename: `${jdAttachment.filename} (UI - Raw)`,
                              textContent: variants.ui || 'No UI variant found',
                              kind: 'jd'
                            });
                            setShowViewer(true);
                          }}
                          className="p-1 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded transition-colors"
                          title="View UI (Raw)"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            const variants = await fetch(`/api/attachments/${jdAttachment.id}/variants`).then(r => r.json());
                            setViewingAttachment({
                              id: jdAttachment.id,
                              filename: `${jdAttachment.filename} (AI Optimized)`,
                              textContent: variants.ai_optimized || 'No AI Short variant found',
                              kind: 'jd'
                            });
                            setShowViewer(true);
                          }}
                          className="p-1 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 text-purple-700 dark:text-purple-300 rounded transition-colors"
                          title="View AI Optimized"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            const variants = await fetch(`/api/attachments/${jdAttachment.id}/variants`).then(r => r.json());
                            setViewingAttachment({
                              id: jdAttachment.id,
                              filename: `${jdAttachment.filename} (Detailed)`,
                              textContent: variants.detailed || 'No AI Long variant found',
                              kind: 'jd'
                            });
                            setShowViewer(true);
                          }}
                          className="p-1 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-green-700 dark:text-green-300 rounded transition-colors"
                          title="View Detailed"
                        >
                          <Eye size={12} />
                        </button>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1">UI / AI-S / AI-L</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
              
              {/* Intermediate Status Messages */}
              {(refreshing || analyzing) && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                    {refreshing && 'Creating AI-optimized variants...'}
                    {analyzing && 'Running AI analysis on all sections...'}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {refreshing && 'This may take 30-60 seconds'}
                    {analyzing && 'This may take 2-3 minutes'}
                  </p>
                </div>
              )}
            </div>

            {/* Column 3: Notes with Scrolling */}
            <div className="p-6 flex flex-col h-full">
              <JobNotesCard
                jobId={job.id}
                initialNotes={job.notes || ''}
              />
            </div>
          </div>
        </div>

        {/* 2.5. Resume Coach Entry Card */}
        <CoachModeEntryCard
          jobId={job.id}
          matchScore={aiData?.matchScore || 0}
          coachStatus={job.coachStatus || 'not_started'}
          hasBasicAnalysis={
            (aiData?.matchScore || 0) > 0 || 
            !!job.companyIntelligenceData
          }
        />

        {/* 3. AI Showcase: Full-width grid */}
        <div id="ai-showcase">
        <AiShowcase
          jobId={job.id}
          jobDescription={analysisData?.jobDescription || ''}
          resume={analysisData?.resume || ''}
          companyName={analysisData?.companyName || job.company}
          companyUrls={analysisData?.companyUrls || []}
          recruiterUrl={analysisData?.recruiterUrl || ''}
          peerUrls={analysisData?.peerUrls || []}
          skipLevelUrls={analysisData?.skipLevelUrls || []}
          aiData={aiData}
          onRefresh={handleRefreshAI}
        />
        </div>

        {/* 3.5. Interview Coach Entry Point (Always Visible!) */}
        <div className={`mt-6 rounded-2xl p-8 shadow-2xl ${
          currentStatus === 'ON_RADAR' 
            ? 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-700 dark:to-gray-600 opacity-75'
            : 'bg-gradient-to-r from-purple-600 to-blue-600'
        } text-white`}>
          {currentStatus === 'ON_RADAR' && (
            <div className="absolute top-4 right-4 bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
              🔒 Complete Resume Coach First
            </div>
          )}
          <div className={currentStatus === 'ON_RADAR' ? 'relative' : ''}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  🎯 Interview Scheduled?
                </h3>
                <p className="text-purple-100 mb-2">
                  Let's help you ace it! Interview Coach will:
                </p>
                <ul className="text-sm text-purple-100 space-y-1 ml-4 list-disc">
                  <li>Search Glassdoor, Reddit, Blind for real interview questions</li>
                  <li>Help you draft & score answers (0-100 with AI feedback)</li>
                  <li>Generate professional STAR talk tracks</li>
                  <li>Extract 2-3 core stories that cover 90% of questions</li>
                </ul>
              </div>
              <div className="hidden md:block bg-white/20 rounded-xl p-4 backdrop-blur-sm text-center">
                <div className="text-3xl font-bold">2-3</div>
                <div className="text-xs text-purple-100">Core Stories</div>
                <div className="text-xs text-purple-200 mt-1">cover 90%</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentStatus === 'ON_RADAR' ? (
                <>
                  <button 
                    disabled
                    className="w-full bg-white/50 text-gray-500 dark:text-gray-400 px-6 py-4 rounded-xl font-semibold
                               shadow-lg flex flex-col items-center gap-2 cursor-not-allowed">
                    <span className="text-3xl grayscale opacity-50">📞</span>
                    <span className="text-lg">Recruiter Screen</span>
                    <span className="text-xs text-gray-400">🔒 Locked</span>
                  </button>
                  <button 
                    disabled
                    className="w-full bg-white/50 text-gray-500 dark:text-gray-400 px-6 py-4 rounded-xl font-semibold
                               shadow-lg flex flex-col items-center gap-2 cursor-not-allowed">
                    <span className="text-3xl grayscale opacity-50">👨‍💼</span>
                    <span className="text-lg">Hiring Manager</span>
                    <span className="text-xs text-gray-400">🔒 Locked</span>
                  </button>
                  <button 
                    disabled
                    className="w-full bg-white/50 text-gray-500 dark:text-gray-400 px-6 py-4 rounded-xl font-semibold
                               shadow-lg flex flex-col items-center gap-2 cursor-not-allowed">
                    <span className="text-3xl grayscale opacity-50">👥</span>
                    <span className="text-lg">Peer / Panel</span>
                    <span className="text-xs text-gray-400">🔒 Locked</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href={`/interview-coach/${job.id}?type=recruiter`}>
                    <button className="w-full bg-white text-purple-600 px-6 py-4 rounded-xl font-semibold
                                     hover:bg-purple-50 transition-all shadow-lg flex flex-col items-center gap-2 group">
                      <span className="text-3xl">📞</span>
                      <span className="text-lg">Recruiter Screen</span>
                      <span className="text-xs text-purple-500 group-hover:text-purple-600">
                        Culture fit • Motivation • Basics
                      </span>
                    </button>
                  </Link>
                  
                  <Link href={`/interview-coach/${job.id}?type=hiring-manager`}>
                    <button className="w-full bg-white text-purple-600 px-6 py-4 rounded-xl font-semibold
                                     hover:bg-purple-50 transition-all shadow-lg flex flex-col items-center gap-2 group">
                      <span className="text-3xl">👨‍💼</span>
                      <span className="text-lg">Hiring Manager</span>
                      <span className="text-xs text-purple-500 group-hover:text-purple-600">
                        STAR stories • Leadership • Projects
                      </span>
                    </button>
                  </Link>
                  
                  <Link href={`/interview-coach/${job.id}?type=peer`}>
                    <button className="w-full bg-white text-purple-600 px-6 py-4 rounded-xl font-semibold
                                     hover:bg-purple-50 transition-all shadow-lg flex flex-col items-center gap-2 group">
                      <span className="text-3xl">👥</span>
                      <span className="text-lg">Peer / Panel</span>
                      <span className="text-xs text-purple-500 group-hover:text-purple-600">
                        Collaboration • Domain depth
                      </span>
                    </button>
                  </Link>
                </>
              )}
            </div>
            
            <div className="mt-6 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
              <p className="text-sm text-purple-50 font-medium mb-2">
                💡 What happens when you click:
              </p>
              <ol className="text-xs text-purple-100 space-y-1 ml-4 list-decimal">
                <li>We search interview questions (Glassdoor, Reddit, Blind) - 30 seconds</li>
                <li>You select 5-8 questions to prepare</li>
                <li>Draft answers, get AI scores (0-100), improve with follow-ups</li>
                <li>Generate STAR talk tracks when ready</li>
                <li>Extract 2-3 core stories to memorize</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 4. Timeline Detail - Removed (deprecated) */}
      </div>

      {/* Attachments Modal with Full Drop Zones */}
      {showAttachmentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => {
          setShowAttachmentsModal(false);
          // Re-check staleness when modal closes (in case versions were toggled)
          setTimeout(() => checkStaleness(), 100);
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attachments</h2>
              <button
                onClick={() => {
                  setShowAttachmentsModal(false);
                  setTimeout(() => checkStaleness(), 100);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AttachmentsSection 
                jobId={job.id} 
                onAttachmentChange={async () => {
                  // Refresh job data to update attachment count
                  const res = await fetch(`/api/jobs/${job.id}`);
                  const data = await res.json();
                  setJob(data);
                  // Also recheck staleness
                  await checkStaleness();
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* v2.7: Variant Viewer Modal */}
      {selectedAttachment && (
        <VariantViewerModal
          isOpen={variantViewerOpen}
          onClose={() => {
            setVariantViewerOpen(false);
            setSelectedAttachment(null);
          }}
          attachmentId={selectedAttachment.id}
          filename={selectedAttachment.filename}
          kind={selectedAttachment.kind}
        />
      )}
    </main>
  );
}
