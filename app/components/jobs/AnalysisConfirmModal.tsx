'use client';

import { AlertCircle, Zap, Clock } from 'lucide-react';

interface AnalysisConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  warning: string;
  estimatedTokens?: number;
  estimatedCost?: number;
  cooldownRemaining?: number;
  reason?: string;
}

export default function AnalysisConfirmModal({
  onConfirm,
  onCancel,
  warning,
  estimatedTokens,
  estimatedCost,
  cooldownRemaining,
  reason,
}: AnalysisConfirmModalProps) {
  const isCooldown = reason === 'cooldown';
  const isNoChanges = reason === 'no_changes';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
      data-testid="analysis-confirm-modal"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {isCooldown ? (
            <Clock size={24} className="text-amber-600" />
          ) : (
            <Zap size={24} className="text-purple-600" />
          )}
          <h2 className="text-xl font-bold text-gray-900">
            {isCooldown ? 'Cooldown Active' : isNoChanges ? 'No Changes Detected' : 'Run AI Analysis?'}
          </h2>
        </div>

        {/* Message */}
        <div className="mb-6">
          <div className={`flex items-start gap-2 p-4 rounded-lg ${
            isCooldown ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
          }`}>
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{warning}</p>
          </div>

          {/* Token Estimate */}
          {!isCooldown && estimatedTokens && (
            <div className="mt-4 text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Estimated Tokens:</span>
                <span className="font-medium">~{estimatedTokens}</span>
              </div>
              {estimatedCost && (
                <div className="flex justify-between">
                  <span>Estimated Cost:</span>
                  <span className="font-medium">${estimatedCost.toFixed(4)}</span>
                </div>
              )}
            </div>
          )}

          {/* Cooldown Timer */}
          {isCooldown && cooldownRemaining && (
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-amber-600">
                {Math.floor(cooldownRemaining / 60)}:{String(cooldownRemaining % 60).padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-600 mt-1">Time remaining</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!isCooldown && (
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium transition-all"
              data-testid="confirm-analysis"
            >
              {isNoChanges ? 'Re-run Anyway' : 'Proceed'}
            </button>
          )}
          <button
            onClick={onCancel}
            className={`${isCooldown ? 'flex-1' : 'flex-1'} px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors`}
            data-testid="cancel-analysis"
          >
            {isCooldown ? 'OK' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

