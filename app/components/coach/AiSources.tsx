'use client';

import { ExternalLink } from 'lucide-react';

interface AiSourcesProps {
  sources: string[];
  className?: string;
}

export default function AiSources({ sources, className = '' }: AiSourcesProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className={`mt-3 pt-3 border-t border-gray-200 ${className}`} data-testid="ai-sources">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Sources</p>
      <div className="space-y-1">
        {sources.slice(0, 3).map((source, i) => {
          // Check if it's a URL
          const isUrl = source.startsWith('http://') || source.startsWith('https://');
          
          if (isUrl) {
            return (
              <a
                key={i}
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {new URL(source).hostname}
              </a>
            );
          }
          
          return (
            <p key={i} className="text-xs text-gray-600">
              • {source}
            </p>
          );
        })}
      </div>
    </div>
  );
}

