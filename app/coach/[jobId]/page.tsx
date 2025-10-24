'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import DiscoveryWizard from '@/app/components/coach/DiscoveryWizard';
import ScoreImprovementCard from '@/app/components/coach/ScoreImprovementCard';
import ResumeEditor from '@/app/components/coach/ResumeEditor';
import CoverLetterGenerator from '@/app/components/coach/CoverLetterGenerator';
import InterviewPrepTab from '@/app/components/coach/InterviewPrepTab';

interface CoachPageProps {
  params: Promise<{ jobId: string }> | { jobId: string };
}

type Phase = 'pre-app' | 'post-app';
type PreAppTab = 'discovery' | 'score' | 'resume' | 'cover-letter' | 'ready';
type PostAppTab = 'recruiter' | 'hiring-manager' | 'peer-panel';

export default function CoachModePage({ params }: CoachPageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const jobId = resolvedParams.jobId;
  const router = useRouter();

  // Phase & Tab State
  const [phase, setPhase] = useState<Phase>('pre-app');
  const [preAppTab, setPreAppTab] = useState<PreAppTab>('discovery');
  const [postAppTab, setPostAppTab] = useState<PostAppTab>('recruiter');

  // Coach State
  const [jobData, setJobData] = useState<any>(null);
  const [discoveryQuestions, setDiscoveryQuestions] = useState<any[]>([]);
  const [discoveryResponses, setDiscoveryResponses] = useState<Record<string, { answer: string; skipped: boolean }>>({});
  const [discoveryBatch, setDiscoveryBatch] = useState(0);
  const [profileData, setProfileData] = useState<any>(null);
  const [scoreBefore, setScoreBefore] = useState(0);
  const [scoreAfter, setScoreAfter] = useState(0);
  const [generatedResume, setGeneratedResume] = useState('');

  // Progress Tracking
  const [progress, setProgress] = useState({
    discoveryComplete: false,
    profileAnalyzed: false,
    scoreRecalculated: false,
    resumeGenerated: false,
    resumeFinalized: false,
    coverLetterGenerated: false,
    applied: false,
  });

  // Load job and coach state
  useEffect(() => {
    loadCoachState();
  }, [jobId]);

  const loadCoachState = async () => {
    try {
      // Load job data
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        console.error('Job not found:', jobId);
        alert('Job not found. Redirecting to home...');
        router.push('/');
        return;
      }
      
      const job = await res.json();
      setJobData(job);

      // Determine phase based on coach_status
      if (job.coachStatus === 'applied' || job.coachStatus === 'interview-prep') {
        setPhase('post-app');
      }

      // Load profile if exists
      if (job.jobProfileId) {
        // Profile exists - discovery is complete
        setProgress(prev => ({ ...prev, discoveryComplete: true, profileAnalyzed: true }));
      }

      // Check match score
      if (job.matchScoreData) {
        const matchData = JSON.parse(job.matchScoreData);
        setScoreBefore(matchData.matchScore?.overallScore || 0);
      }

      // ✅ LOAD SAVED COACH STATE (discovery responses, etc.)
      try {
        const coachRes = await fetch(`/api/coach/${jobId}/save`);
        if (coachRes.ok) {
          const savedData = await coachRes.json();
          if (savedData.data) {
            console.log('✅ Loaded saved coach state:', savedData.data);
            // Restore discovery questions if they exist
            if (savedData.data.discoveryQuestions) {
              setDiscoveryQuestions(savedData.data.discoveryQuestions);
            }
            // ✅ Restore discovery responses (THE FIX FOR BUG #10!)
            if (savedData.data.discoveryResponses) {
              setDiscoveryResponses(savedData.data.discoveryResponses);
              console.log('✅ Restored', Object.keys(savedData.data.discoveryResponses).length, 'saved responses');
            }
            // ✅ Restore batch position
            if (savedData.data.currentBatch !== undefined) {
              setDiscoveryBatch(savedData.data.currentBatch);
            }
            // Restore other state
            if (savedData.data.profileData) {
              setProfileData(savedData.data.profileData);
            }
            if (savedData.data.scoreBefore) {
              setScoreBefore(savedData.data.scoreBefore);
            }
            if (savedData.data.scoreAfter) {
              setScoreAfter(savedData.data.scoreAfter);
            }
            if (savedData.data.generatedResume) {
              setGeneratedResume(savedData.data.generatedResume);
            }
            if (savedData.data.progress) {
              setProgress(savedData.data.progress);
            }
          }
        }
      } catch (coachError) {
        console.warn('No saved coach state found (this is ok for new sessions):', coachError);
      }
    } catch (error) {
      console.error('Failed to load coach state:', error);
      alert('Failed to load Coach Mode. Redirecting to home...');
      router.push('/');
    }
  };

  const handleGenerateDiscovery = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/coach/generate-discovery`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Discovery generation failed');

      const data = await res.json();
      setDiscoveryQuestions(data.questions);
    } catch (error) {
      console.error('Discovery generation failed:', error);
      alert('Failed to generate discovery questions');
    }
  };

  const handleDiscoveryComplete = async (responses: any[]) => {
    try {
      // Analyze profile
      const res = await fetch(`/api/jobs/${jobId}/coach/analyze-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discoveryResponses: responses }),
      });

      if (!res.ok) throw new Error('Profile analysis failed');

      const data = await res.json();
      setProfileData(data.profileData);
      setProgress(prev => ({ ...prev, discoveryComplete: true, profileAnalyzed: true }));

      // Auto-advance to score tab
      setPreAppTab('score');
    } catch (error) {
      console.error('Profile analysis failed:', error);
      alert('Failed to analyze profile');
    }
  };

  const handleRecalculateScore = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/coach/recalculate-score`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Score recalculation failed');

      const data = await res.json();
      setScoreBefore(data.matchScore.before); // Fix: Set before score from API
      setScoreAfter(data.matchScore.after);
      setProgress(prev => ({ ...prev, scoreRecalculated: true }));
      
      console.log(`✅ Score improved: ${(data.matchScore.before * 100).toFixed(0)}% → ${(data.matchScore.after * 100).toFixed(0)}% (+${data.matchScore.improvementPercent} points)`);
    } catch (error) {
      console.error('Score recalculation failed:', error);
      alert('Failed to recalculate score');
    }
  };

  const handleGenerateResume = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/coach/generate-resume`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Resume generation failed');

      const data = await res.json();
      setGeneratedResume(data.resume);
      setProgress(prev => ({ ...prev, resumeGenerated: true }));
    } catch (error) {
      console.error('Resume generation failed:', error);
      alert('Failed to generate resume');
    }
  };

  const handleFinalizeResume = async (finalResume: string) => {
    // TODO: Save finalized resume as new attachment
    setProgress(prev => ({ ...prev, resumeFinalized: true }));
    setPreAppTab('cover-letter');
  };

  const handleMarkApplied = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/coach/mark-applied`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Mark applied failed');

      setProgress(prev => ({ ...prev, applied: true }));
      setPhase('post-app');
    } catch (error) {
      console.error('Mark applied failed:', error);
      alert('Failed to mark as applied');
    }
  };

  // Pre-Application Tabs
  const preAppTabs = [
    { id: 'discovery', label: 'Discovery', completed: progress.discoveryComplete },
    { id: 'score', label: 'Score Improvement', completed: progress.scoreRecalculated, locked: !progress.profileAnalyzed },
    { id: 'resume', label: 'Resume Generator', completed: progress.resumeFinalized, locked: !progress.scoreRecalculated },
    { id: 'cover-letter', label: 'Cover Letter', completed: progress.coverLetterGenerated, locked: !progress.resumeFinalized },
    { id: 'ready', label: 'Ready to Apply', completed: progress.applied, locked: !progress.coverLetterGenerated },
  ];

  // Post-Application Tabs
  const postAppTabs = [
    { id: 'recruiter', label: 'Recruiter Prep' },
    { id: 'hiring-manager', label: 'Hiring Manager Prep' },
    { id: 'peer-panel', label: 'Peer Panel Prep' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/jobs/${jobId}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="coach-mode-header">
              Coach Mode
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {jobData?.company} - {jobData?.title}
            </p>
          </div>
          </div>

          {/* Phase Indicator */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              phase === 'pre-app'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {phase === 'pre-app' ? 'Pre-Application' : 'Interview Prep'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-1 overflow-x-auto">
            {phase === 'pre-app' ? (
              preAppTabs.map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => !tab.locked && setPreAppTab(tab.id as PreAppTab)}
                  disabled={tab.locked}
                  data-testid={`tab-${tab.id}`}
                  data-locked={tab.locked}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    preAppTab === tab.id
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : tab.locked
                        ? 'border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.completed && <CheckCircle2 size={16} className="text-green-600" />}
                  {tab.locked && <Lock size={14} data-testid="tab-locked" />}
                  {tab.label}
                </button>
              ))
            ) : (
              postAppTabs.map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setPostAppTab(tab.id as PostAppTab)}
                  data-testid={`tab-${tab.id}`}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    postAppTab === tab.id
                      ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {phase === 'pre-app' && (
          <>
            {preAppTab === 'discovery' && (
              <div className="space-y-6">
                {discoveryQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Build Your Extended Profile
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Answer targeted questions to reveal hidden skills and improve your match score
                    </p>
                    <button
                      onClick={handleGenerateDiscovery}
                      data-testid="generate-discovery-button"
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700"
                    >
                      Generate Discovery Questions
                    </button>
                  </div>
                ) : (
                  <DiscoveryWizard
                    jobId={jobId}
                    questions={discoveryQuestions}
                    initialResponses={discoveryResponses}
                    initialBatch={discoveryBatch}
                    onComplete={handleDiscoveryComplete}
                  />
                )}
              </div>
            )}

            {preAppTab === 'score' && (
              <div className="space-y-6">
                {!progress.scoreRecalculated ? (
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      Recalculate Your Match Score
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      See how your extended profile improves your match
                    </p>
                    <button
                      onClick={handleRecalculateScore}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                    >
                      Recalculate Score
                    </button>
                  </div>
                ) : (
                  <ScoreImprovementCard
                    scoreBefore={scoreBefore}
                    scoreAfter={scoreAfter}
                    improvement={scoreAfter - scoreBefore}
                    fromResume={scoreBefore}
                    fromProfile={scoreAfter - scoreBefore}
                  />
                )}
              </div>
            )}

            {preAppTab === 'resume' && (
              <div className="space-y-6">
                {!progress.resumeGenerated ? (
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      Generate ATS-Optimized Resume
                    </h2>
                    <button
                      onClick={handleGenerateResume}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                    >
                      Generate Resume
                    </button>
                  </div>
                ) : (
                  <ResumeEditor
                    jobId={jobId}
                    initialAiResume={generatedResume}
                    onFinalize={handleFinalizeResume}
                  />
                )}
              </div>
            )}

            {preAppTab === 'cover-letter' && (
              <CoverLetterGenerator 
                jobId={jobId} 
                onGenerate={() => setProgress(prev => ({ ...prev, coverLetterGenerated: true }))}
              />
            )}

            {preAppTab === 'ready' && (
              <div className="text-center py-12 space-y-6">
                <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  You&apos;re Ready to Apply!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Your resume and cover letter are optimized. When you&apos;ve submitted your application, mark it as applied to unlock interview prep.
                </p>
                <button
                  onClick={handleMarkApplied}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700"
                >
                  I&apos;ve Applied! → Start Interview Prep
                </button>
              </div>
            )}
          </>
        )}

        {phase === 'post-app' && (
          <div>
            {postAppTab === 'recruiter' && (
              <InterviewPrepTab
                jobId={jobId}
                interviewStage="recruiter"
                title="Recruiter Phone Screen Prep"
                description="Common questions recruiters ask to assess culture fit and basic qualifications"
              />
            )}

            {postAppTab === 'hiring-manager' && (
              <InterviewPrepTab
                jobId={jobId}
                interviewStage="hiring-manager"
                title="Hiring Manager Interview Prep"
                description="Technical depth, problem-solving scenarios, and team fit questions"
              />
            )}

            {postAppTab === 'peer-panel' && (
              <InterviewPrepTab
                jobId={jobId}
                interviewStage="peer-panel"
                title="Peer Panel Interview Prep"
                description="Collaboration, technical breadth, and day-to-day work questions from your future teammates"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

