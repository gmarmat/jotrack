'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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

  const updateCoachData = (updates: Partial<typeof coachData>) => {
    setCoachData((prev: any) => ({ ...prev, ...updates }));
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

  return (
    <div className="min-h-screen bg-gray-50" data-testid="coach-wizard">
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

