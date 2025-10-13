'use client';

import { Sparkles } from 'lucide-react';

interface ProviderBadgeProps {
  provider: 'local' | 'remote';
  className?: string;
}

export default function ProviderBadge({ provider, className = '' }: ProviderBadgeProps) {
  const isAiPowered = provider === 'remote';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isAiPowered
          ? 'bg-green-100 text-green-800 border border-green-300'
          : 'bg-gray-100 text-gray-700 border border-gray-300'
      } ${className}`}
      data-testid="provider-badge"
      title={isAiPowered ? 'AI-powered analysis using OpenAI' : 'Local analysis without AI'}
    >
      {isAiPowered ? (
        <>
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <Sparkles className="w-3 h-3" />
          <span>AI Powered</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          <span>Non-AI Powered</span>
        </>
      )}
    </div>
  );
}

