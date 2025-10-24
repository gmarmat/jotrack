'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Check, X, Target, MessageSquare, Sparkles } from 'lucide-react';

interface GuidedTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentStep: string;
  onStepChange: (step: string) => void;
}

export default function GuidedTutorial({ 
  isOpen, 
  onClose, 
  onComplete, 
  currentStep, 
  onStepChange 
}: GuidedTutorialProps) {
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const tutorialSteps = [
    {
      id: 'persona',
      title: 'Pick Your Persona',
      description: 'Choose the interviewer type you\'ll be speaking with',
      icon: '🎯',
      instructions: [
        'Click on the persona pills at the top',
        'Each persona has different focus areas',
        'You can switch personas anytime'
      ],
      action: 'Select a persona pill'
    },
    {
      id: 'practice',
      title: 'Practice Your Answers',
      description: 'Write and analyze your interview responses',
      icon: '💬',
      instructions: [
        'Write your answer in the text area',
        'Click "Analyze" to get your score',
        'Use AI Assist for better answers',
        'Test impact of follow-up questions'
      ],
      action: 'Write an answer and click Analyze'
    },
    {
      id: 'talk-tracks',
      title: 'Generate Talk Tracks',
      description: 'Create compelling stories for your interview',
      icon: '✨',
      instructions: [
        'Click "Generate Stories" when ready',
        'Review the persona-specific variants',
        'Use these stories in your interview',
        'Save snapshots of your best work'
      ],
      action: 'Click Generate Stories'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      // Check which step we're currently on
      const stepIndex = tutorialSteps.findIndex(step => step.id === currentStep);
      if (stepIndex !== -1) {
        setCurrentTutorialStep(stepIndex);
      }
    }
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentTutorialStep < tutorialSteps.length - 1) {
      setCurrentTutorialStep(currentTutorialStep + 1);
      setCompletedSteps([...completedSteps, currentTutorialStep]);
    } else {
      setCompletedSteps([...completedSteps, currentTutorialStep]);
      onComplete();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleStepClick = (index: number) => {
    setCurrentTutorialStep(index);
    onStepChange(tutorialSteps[index].id);
  };

  if (!isOpen) return null;

  const currentStepData = tutorialSteps[currentTutorialStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentStepData.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentTutorialStep + 1} of {tutorialSteps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center gap-2">
            {tutorialSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`flex items-center gap-2 px-3 py-1 rounded text-sm ${
                  index === currentTutorialStep
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : completedSteps.includes(index)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}
              >
                {completedSteps.includes(index) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-current" />
                )}
                {step.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-4">{currentStepData.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {currentStepData.description}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What to do:
              </h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                {currentStepData.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Next Action:
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {currentStepData.action}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Skip Tutorial
          </button>
          <div className="flex gap-2">
            {currentTutorialStep > 0 && (
              <button
                onClick={() => setCurrentTutorialStep(currentTutorialStep - 1)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              {currentTutorialStep === tutorialSteps.length - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
