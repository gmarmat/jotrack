'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import Breadcrumb from '@/app/components/Breadcrumb';
import SaveStatusBanner from '@/app/components/SaveStatusBanner';
import Stepper, { Step, StepStatus } from '@/app/components/coach/Stepper';
import GatherStep from '@/app/components/coach/steps/GatherStep';
import ProfileStep from '@/app/components/coach/steps/ProfileStep';
import FitStep from '@/app/components/coach/steps/FitStep';
import ImproveStep from '@/app/components/coach/steps/ImproveStep';

interface CoachPageProps {
  params: Promise<{ jobId: string }> | { jobId: string };
}

export default function CoachPage({ params }: CoachPageProps) {
  // Handle both Promise and resolved params for Next.js compatibility
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const jobId = resolvedParams.jobId;
  const router = useRouter();

  const [currentStepId, setCurrentStepId] = useState('gather');
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({
    gather: 'active',
    profile: 'pending',
    fit: 'pending',
    improve: 'pending',
  });

  const [coachData, setCoachData] = useState<any>({
    jobDescription: '',
    resume: '',
    recruiterLinks: [],
    peerLinks: [],
    companyProfile: null,
    recruiterProfile: null,
    peerProfiles: [],
    fitAnalysis: null,
    suggestions: [],
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const steps: Step[] = [
    { id: 'gather', label: 'Gather', status: stepStatuses.gather },
    { id: 'profile', label: 'Profile', status: stepStatuses.profile },
    { id: 'fit', label: 'Fit', status: stepStatuses.fit },
    { id: 'improve', label: 'Improve / Apply', status: stepStatuses.improve },
  ];

  const handleStepComplete = (stepId: string) => {
    setStepStatuses(prev => ({
      ...prev,
      [stepId]: 'completed',
    }));

    // Move to next step
    const stepOrder = ['gather', 'profile', 'fit', 'improve'];
    const currentIndex = stepOrder.indexOf(stepId);
    if (currentIndex < stepOrder.length - 1) {
      const nextStep = stepOrder[currentIndex + 1];
      setStepStatuses(prev => ({
        ...prev,
        [nextStep]: 'active',
      }));
      setCurrentStepId(nextStep);
    }
  };

  const handleStepClick = (stepId: string) => {
    setCurrentStepId(stepId);
  };

  const updateCoachData = async (updates: Partial<typeof coachData>) => {
    const newData = { ...coachData, ...updates };
    setCoachData(newData);
    
    // Auto-save logic
    setSaveStatus('saving');
    setSaveError(null);
    
    try {
      // Save to backend (we'll create this endpoint)
      await fetch(`/api/coach/${jobId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
      
      setSaveStatus('saved');
      setLastSaved(Date.now());
      
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      setSaveStatus('error');
      setSaveError(error.message || 'Failed to save');
    }
  };

  const handleRetrySave = () => {
    updateCoachData({});
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const stepOrder = ['gather', 'profile', 'fit', 'improve'];
      const currentIndex = stepOrder.indexOf(currentStepId);

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        const prevStep = stepOrder[currentIndex - 1];
        if (stepStatuses[prevStep] === 'completed') {
          setCurrentStepId(prevStep);
        }
      } else if (e.key === 'ArrowRight' && currentIndex < stepOrder.length - 1) {
        const nextStep = stepOrder[currentIndex + 1];
        if (stepStatuses[nextStep] === 'active' || stepStatuses[nextStep] === 'completed') {
          setCurrentStepId(nextStep);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepId, stepStatuses]);

  const handleExit = () => {
    if (confirm('Exit Coach Mode? Your progress has been automatically saved.')) {
      router.push(`/jobs/${jobId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="coach-wizard">
      {/* Header with Breadcrumb and Exit */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Job', href: `/jobs/${jobId}` },
            { label: 'Coach Mode' },
          ]} />
          
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={handleExit}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              data-testid="exit-coach-mode"
            >
              <ArrowLeft size={18} />
              Exit Coach Mode
            </button>
          </div>
        </div>
      </div>

      {/* Save Status Banner */}
      <SaveStatusBanner 
        status={saveStatus} 
        lastSaved={lastSaved} 
        error={saveError}
        onRetry={handleRetrySave}
      />

      <Stepper steps={steps} currentStepId={currentStepId} onStepClick={handleStepClick} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {currentStepId === 'gather' && (
          <GatherStep
            jobId={jobId}
            data={coachData}
            onUpdate={updateCoachData}
            onComplete={() => handleStepComplete('gather')}
          />
        )}
        {currentStepId === 'profile' && (
          <ProfileStep
            jobId={jobId}
            data={coachData}
            onUpdate={updateCoachData}
            onComplete={() => handleStepComplete('profile')}
            onBack={() => setCurrentStepId('gather')}
          />
        )}
        {currentStepId === 'fit' && (
          <FitStep
            jobId={jobId}
            data={coachData}
            onUpdate={updateCoachData}
            onComplete={() => handleStepComplete('fit')}
            onBack={() => setCurrentStepId('profile')}
          />
        )}
        {currentStepId === 'improve' && (
          <ImproveStep
            jobId={jobId}
            data={coachData}
            onUpdate={updateCoachData}
            onBack={() => setCurrentStepId('fit')}
          />
        )}
      </div>
    </div>
  );
}

