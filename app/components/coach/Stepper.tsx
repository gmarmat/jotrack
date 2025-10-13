'use client';

import { CheckCircle2, Circle } from 'lucide-react';

export type StepStatus = 'pending' | 'active' | 'completed';

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

interface StepperProps {
  steps: Step[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
}

export default function Stepper({ steps, currentStepId, onStepClick }: StepperProps) {
  return (
    <div
      className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4"
      data-testid="coach-stepper"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStepId;
            const isCompleted = step.status === 'completed';
            const isClickable = isCompleted || isActive;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={`flex items-center gap-2 ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                  data-testid={`step-${step.id}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle
                      className={`w-6 h-6 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-blue-600'
                        : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

