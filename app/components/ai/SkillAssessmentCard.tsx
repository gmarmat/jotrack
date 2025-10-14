'use client';

import { AlertTriangle, Info } from 'lucide-react';
import { SkillAssessment, hasDiscrepancy, getConfidenceLabel } from '@/lib/skillAssessment';

interface SkillAssessmentCardProps {
  assessments: SkillAssessment[];
  maxSkills?: number;
}

export default function SkillAssessmentCard({ assessments, maxSkills = 10 }: SkillAssessmentCardProps) {
  const displayAssessments = assessments.slice(0, maxSkills);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 75) return 'text-green-600 bg-green-50';
    if (confidence >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const renderEvidenceTooltip = (assessment: SkillAssessment) => {
    const { evidence } = assessment;
    return (
      <div className="text-xs space-y-1">
        <p><strong>Evidence:</strong></p>
        <ul className="list-disc list-inside pl-2">
          <li>Projects: {evidence.projectCount}</li>
          <li>Years Experience: {evidence.yearsExperience}</li>
          <li>Context Mentions: {evidence.contextMentions}</li>
          {evidence.certifications.length > 0 && (
            <li>Certifications: {evidence.certifications.join(', ')}</li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="skill-assessment-card">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Skill Assessment: Self-Reported vs Computed
      </h3>

      <div className="space-y-4">
        {displayAssessments.map((assessment, idx) => {
          const confidenceLabel = getConfidenceLabel(assessment.confidence);
          const confidenceColor = getConfidenceColor(assessment.confidence);
          const selfReportedScaled = assessment.selfReported 
            ? (assessment.selfReported / 5) * 100 
            : null;
          const showDiscrepancy = hasDiscrepancy(assessment);

          return (
            <div key={idx} className="pb-4 border-b border-gray-100 last:border-0">
              {/* Skill name and confidence */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{assessment.skill}</h4>
                  {showDiscrepancy && (
                    <AlertTriangle size={14} className="text-orange-600" title="Large discrepancy detected" />
                  )}
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${confidenceColor}`}>
                  <Info size={12} />
                  <span className="capitalize">{confidenceLabel} confidence</span>
                </div>
              </div>

              {/* Side-by-side bars */}
              <div className="grid grid-cols-2 gap-4 mb-2">
                {/* Self-Reported */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Self-Reported</span>
                    {assessment.selfReported !== null && (
                      <span className="text-xs font-semibold text-blue-600">
                        {assessment.selfReported}/5
                      </span>
                    )}
                  </div>
                  <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                    {selfReportedScaled !== null ? (
                      <div
                        className="h-full bg-blue-500 flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${selfReportedScaled}%` }}
                      >
                        {selfReportedScaled > 15 && (
                          <span className="text-xs font-semibold text-white">
                            {Math.round(selfReportedScaled)}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-500">
                        Not specified
                      </div>
                    )}
                  </div>
                </div>

                {/* Computed */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Our Computed Score</span>
                    <span className="text-xs font-semibold text-purple-600">
                      {Math.round(assessment.computed)}%
                    </span>
                  </div>
                  <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-purple-500 flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${assessment.computed}%` }}
                    >
                      {assessment.computed > 15 && (
                        <span className="text-xs font-semibold text-white">
                          {Math.round(assessment.computed)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence tooltip (expandable) */}
              <details className="text-xs text-gray-600">
                <summary className="cursor-pointer hover:text-gray-900 select-none">
                  View evidence breakdown
                </summary>
                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                  {renderEvidenceTooltip(assessment)}
                </div>
              </details>

              {/* Discrepancy warning */}
              {showDiscrepancy && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                  <strong>⚠ Discrepancy detected:</strong> Your self-assessment differs significantly 
                  from our computed score. This might indicate a need to update your resume with more 
                  specific examples or adjust your self-assessment.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
        <p className="font-semibold mb-2">How we compute scores:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Project count (up to 40 points)</li>
          <li>Years of experience (up to 30 points)</li>
          <li>Context mentions in resume (up to 20 points)</li>
          <li>Certifications (up to 10 points)</li>
        </ul>
        <p className="mt-2 italic">
          Confidence is based on the number of evidence types found (more sources = higher confidence).
        </p>
      </div>
    </div>
  );
}

