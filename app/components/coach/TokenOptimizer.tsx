'use client';

import { useState } from 'react';
import { Zap, Check, X, Loader2 } from 'lucide-react';

interface TokenOptimizerProps {
  originalText: string;
  onOptimize: (optimizedText: string) => void;
  label?: string;
}

export default function TokenOptimizer({ originalText, onOptimize, label = 'Content' }: TokenOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  // Simple token estimation (rough approximation: 1 token ≈ 4 characters)
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  const originalTokens = estimateTokens(originalText);
  const optimizedTokens = estimateTokens(optimizedText);
  const savings = originalTokens - optimizedTokens;
  const savingsPercent = originalTokens > 0 ? Math.round((savings / originalTokens) * 100) : 0;

  const handleOptimize = async () => {
    if (!originalText.trim()) return;

    setIsOptimizing(true);
    setError('');

    try {
      const res = await fetch('/api/ai/optimize-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText }),
      });

      if (!res.ok) {
        throw new Error('Failed to optimize content');
      }

      const data = await res.json();
      setOptimizedText(data.optimized);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAccept = () => {
    onOptimize(optimizedText);
    setShowPreview(false);
  };

  const handleReject = () => {
    setOptimizedText('');
    setShowPreview(false);
  };

  if (showPreview && optimizedText) {
    return (
      <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-purple-900 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Token-Optimized Version
          </h4>
          <div className="flex items-center gap-4">
            <div className="text-sm text-purple-700">
              <span className="font-bold text-lg">{savingsPercent}%</span> savings
              <span className="text-xs ml-1">
                ({originalTokens} → {optimizedTokens} tokens)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded p-3 mb-3 max-h-64 overflow-y-auto border border-purple-200">
          <pre className="whitespace-pre-wrap text-sm text-gray-800">{optimizedText}</pre>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Use This Version
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Keep Original
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-sm text-gray-700">
        <span className="font-medium">{label}:</span> ~{originalTokens} tokens
      </div>
      <button
        onClick={handleOptimize}
        disabled={isOptimizing || !originalText.trim()}
        className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isOptimizing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Optimizing...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Optimize for AI
          </>
        )}
      </button>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

