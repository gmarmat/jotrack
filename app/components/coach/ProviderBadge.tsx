'use client';

import { Cloud, Laptop } from 'lucide-react';

interface ProviderBadgeProps {
  provider: 'local' | 'remote';
  className?: string;
}

export default function ProviderBadge({ provider, className = '' }: ProviderBadgeProps) {
  const isLocal = provider === 'local';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isLocal
          ? 'bg-gray-100 text-gray-700 border border-gray-300'
          : 'bg-blue-100 text-blue-700 border border-blue-300'
      } ${className}`}
      data-testid="provider-badge"
      title={isLocal ? 'Running in local dry-run mode' : 'Using remote AI provider'}
    >
      {isLocal ? (
        <>
          <Laptop className="w-3 h-3" />
          <span>Local (Dry-run)</span>
        </>
      ) : (
        <>
          <Cloud className="w-3 h-3" />
          <span>AI (Remote)</span>
        </>
      )}
    </div>
  );
}

