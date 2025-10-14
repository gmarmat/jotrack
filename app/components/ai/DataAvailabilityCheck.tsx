'use client';

import { CheckCircle2, AlertCircle, XCircle, DollarSign } from 'lucide-react';
import { canAnalyzeSection, getSectionRequirements } from '@/lib/ai/promptDataStrategy';

interface DataAvailabilityCheckProps {
  sectionId: string;
  availableData: {
    attachments: Record<string, boolean>;
    fields: Record<string, any>;
    previousAnalysis: string[];
  };
  onAddMissing?: (dataType: string) => void;
}

export default function DataAvailabilityCheck({ 
  sectionId, 
  availableData, 
  onAddMissing 
}: DataAvailabilityCheckProps) {
  const check = canAnalyzeSection(sectionId, availableData);
  const requirements = getSectionRequirements(sectionId);

  if (!requirements) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-800 dark:text-red-400">Unknown section: {sectionId}</p>
      </div>
    );
  }

  const allRequirements = [
    ...requirements.requiredAttachments.map(a => ({ name: `${a} attachment`, required: true, type: 'attachment', key: a })),
    ...requirements.optionalAttachments.map(a => ({ name: `${a} attachment`, required: false, type: 'attachment', key: a })),
    ...requirements.requiredFields.map(f => ({ name: f, required: true, type: 'field', key: f })),
    ...requirements.contextDependencies.map(d => ({ name: `${d} analysis`, required: true, type: 'dependency', key: d }))
  ];

  const getStatus = (item: typeof allRequirements[0]) => {
    if (item.type === 'attachment') {
      return availableData.attachments[item.key] === true;
    } else if (item.type === 'field') {
      return availableData.fields[item.key] && availableData.fields[item.key] !== '';
    } else {
      return availableData.previousAnalysis.includes(item.key);
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border ${
        check.canAnalyze
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}
      data-testid="data-availability-check"
    >
      <h4 className={`text-sm font-semibold mb-3 ${
        check.canAnalyze ? 'text-green-900 dark:text-green-400' : 'text-yellow-900 dark:text-yellow-400'
      }`}>
        {check.canAnalyze ? '✓ Ready to Analyze' : '⚠ Missing Required Data'}
      </h4>

      <div className="space-y-2">
        {allRequirements.map((item, idx) => {
          const hasIt = getStatus(item);
          const isMissing = item.required && !hasIt;

          return (
            <div key={idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {hasIt ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : item.required ? (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                )}
                <span className={`${
                  hasIt 
                    ? 'text-gray-700 dark:text-gray-300' 
                    : isMissing 
                    ? 'text-red-700 dark:text-red-400 font-medium' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {item.name} {!item.required && '(optional)'}
                </span>
              </div>

              {isMissing && onAddMissing && (
                <button
                  onClick={() => onAddMissing(item.key)}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Cost estimate */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <DollarSign className="w-3 h-3" />
          <span>Estimated cost: ~${check.estimatedCost.usd.toFixed(3)}</span>
          <span className="text-gray-500">({check.estimatedCost.tokens.toLocaleString()} tokens)</span>
        </div>

        {check.canAnalyze && (
          <span className="text-green-700 dark:text-green-400 font-medium">
            All requirements met
          </span>
        )}
      </div>

      {/* Missing data summary */}
      {!check.canAnalyze && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-800 dark:text-red-400">
          <strong>Cannot analyze:</strong> Missing {check.missingData.join(', ')}
          {check.missingDependencies.length > 0 && (
            <> and requires {check.missingDependencies.join(', ')} to be completed first</>
          )}
        </div>
      )}
    </div>
  );
}

