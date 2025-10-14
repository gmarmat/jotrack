'use client';

import { Sparkles } from 'lucide-react';

interface AnalyzeButtonProps {
  onAnalyze: () => void | Promise<void>;
  isAnalyzing: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export default function AnalyzeButton({ 
  onAnalyze, 
  isAnalyzing, 
  disabled = false,
  className = '',
  label = 'Analyze with AI'
}: AnalyzeButtonProps) {
  return (
    <button
      onClick={onAnalyze}
      disabled={disabled || isAnalyzing}
      className={`p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isAnalyzing ? 'Analyzing...' : label}
      data-testid="analyze-button"
    >
      <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
    </button>
  );
}

