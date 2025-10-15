"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HorizontalTimeline from '@/app/components/timeline/HorizontalTimeline';
import StatusDetailPanel from '@/app/components/timeline/StatusDetailPanel';
import HeaderMeta from '@/app/components/timeline/HeaderMeta';
import JobHeader from '@/app/components/jobs/JobHeader';
import JobNotesCard from '@/app/components/jobs/JobNotesCard';
import AiShowcase from '@/app/components/jobs/AiShowcase';
import AttachmentsModal from '@/app/components/AttachmentsModal';
import AttachmentsSection from '@/app/components/attachments/AttachmentsSection';
import GlobalSettingsButton from '@/app/components/GlobalSettingsButton';
import { type JobStatus } from '@/lib/status';
import { calculateDelta } from '@/lib/timeDelta';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | null>(null);
  const [job, setJob] = useState<any>(null);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [jdAttachmentId, setJdAttachmentId] = useState<string | null>(null);
  const [currentStatusEnteredAt, setCurrentStatusEnteredAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  
  // v2.7: Staleness detection
  const [stalenessInfo, setStalenessInfo] = useState<{
    isStale: boolean;
    severity: 'fresh' | 'never_analyzed' | 'minor' | 'major';
    message: string;
    changedArtifacts?: string[];
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false);
  
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
        const attachments = attData.attachments?.filter((a: any) => !a.deletedAt) ?? [];
        setAttachmentCount(attachments.length);
        
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
  useEffect(() => {
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
    if (id) {
      checkStaleness();
    }
  }, [id, attachmentCount]); // Re-check when attachments change

  const handleStatusChange = (newStatus: JobStatus) => {
    setJob((prev: any) => ({ ...prev, status: newStatus }));
    // Optionally refetch to get updated data
    window.location.reload();
  };

  const handleRefreshAI = async (analysisType?: 'company' | 'people' | 'match' | 'skills' | 'ecosystem' | 'all') => {
    try {
      console.log('Refreshing AI insights...', analysisType || 'all');
      
      // For now, just refresh the page to show updated data
      // TODO: Implement specific API calls for each analysis type
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing AI insights:', error);
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
      <HorizontalTimeline 
        currentStatus={currentStatus} 
        onStatusClick={setSelectedStatus}
        currentStatusDelta={delta?.label}
      />

      {/* Header Meta - Delta chip, posting link, JD link */}
      <HeaderMeta
        postingUrl={job.posting_url || job.postingUrl}
        createdAt={job.created_at || job.createdAt}
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

        {/* v2.7: Staleness Detection Banner */}
        {!analyzeSuccess && stalenessInfo && stalenessInfo.isStale && (
          <div
            className={`p-4 rounded-lg border-l-4 ${
              stalenessInfo.severity === 'major'
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 dark:border-orange-600'
                : stalenessInfo.severity === 'never_analyzed'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-600'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {stalenessInfo.severity === 'major' ? '⚠️' : 
                     stalenessInfo.severity === 'never_analyzed' ? '🌟' : 'ℹ️'}
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {stalenessInfo.severity === 'major' ? 'Major Changes Detected' :
                     stalenessInfo.severity === 'never_analyzed' ? 'Ready to Analyze' :
                     'Updates Available'}
                  </p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {stalenessInfo.message}
                </p>
                {stalenessInfo.changedArtifacts && stalenessInfo.changedArtifacts.length > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Changed: {stalenessInfo.changedArtifacts.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={handleGlobalAnalyze}
                disabled={analyzing}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  analyzing
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
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
                  'Analyze Now'
                )}
              </button>
            </div>
            {analyzeError && (
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-sm text-red-800 dark:text-red-300">
                {analyzeError}
              </div>
            )}
          </div>
        )}

        {/* 1. Header: Title, Company, StatusChip, QuickActions */}
        <JobHeader 
          job={job} 
          currentStatus={currentStatus}
          onStatusChange={handleStatusChange}
          onJumpToStatus={setSelectedStatus}
        />

        {/* 2. Notes Card: Global notes + Attachments link */}
        <JobNotesCard
          jobId={job.id}
          initialNotes={job.notes || ''}
          attachmentCount={attachmentCount}
          onOpenAttachments={() => setShowAttachmentsModal(true)}
        />

        {/* 3. AI Showcase: Full-width grid */}
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

        {/* 4. Timeline Detail (conditional) */}
        {selectedStatus && (
          <div className="relative" data-testid="timeline-detail-wrapper">
            <button
              onClick={() => setSelectedStatus(null)}
              className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-lg z-10"
              aria-label="Close timeline detail"
            >
              ✕
            </button>
            <StatusDetailPanel jobId={job.id} status={selectedStatus} />
          </div>
        )}
      </div>

      {/* Attachments Modal with Full Drop Zones */}
      {showAttachmentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAttachmentsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attachments</h2>
              <button
                onClick={() => setShowAttachmentsModal(false)}
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
                }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
