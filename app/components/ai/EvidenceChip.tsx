'use client';

import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';

export type EvidencePlatform = 'linkedin' | 'glassdoor' | 'reddit' | 'blind' | 'other';
export type EvidenceConfidence = 'high' | 'medium' | 'low';

export interface Evidence {
  platform: EvidencePlatform;
  quote: string;
  fullQuote?: string;
  context?: string;
  url?: string;
  date?: string;
  confidence?: EvidenceConfidence;
  author?: string;
}

interface EvidenceChipProps {
  evidence: Evidence;
}

const platformConfig = {
  linkedin: {
    icon: '📊',
    name: 'LinkedIn',
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
  },
  glassdoor: {
    icon: '🔍',
    name: 'Glassdoor',
    color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
  },
  reddit: {
    icon: '💬',
    name: 'Reddit',
    color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
  },
  blind: {
    icon: '🎯',
    name: 'Blind',
    color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
  },
  other: {
    icon: '📄',
    name: 'Source',
    color: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
  }
};

const confidenceBadges = {
  high: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-1.5 py-0.5 rounded',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] px-1.5 py-0.5 rounded',
  low: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 text-[10px] px-1.5 py-0.5 rounded'
};

export default function EvidenceChip({ evidence }: EvidenceChipProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = platformConfig[evidence.platform];
  const displayQuote = evidence.quote.length > 45 ? evidence.quote.substring(0, 45) + '...' : evidence.quote;

  return (
    <div className="inline-block">
      {/* Chip (Collapsed View) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`inline-flex items-center gap-1.5 px-2 py-1 border rounded text-xs
                   ${config.color} hover:opacity-80 transition-opacity cursor-pointer`}
      >
        <span className="text-sm">{config.icon}</span>
        <span className="font-medium">{config.name}</span>
        <span className="text-gray-400 dark:text-gray-500">·</span>
        <span className="italic">"{displayQuote}"</span>
      </button>

      {/* Expanded View (Modal Overlay) */}
      {isExpanded && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40" 
            onClick={() => setIsExpanded(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 
                        bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 max-w-lg w-[90vw]
                        border border-gray-200 dark:border-gray-700">
            {/* Close Button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-2 right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={16} className="text-gray-500" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{config.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{config.name}</span>
                  {evidence.date && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(evidence.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {evidence.confidence && (
                    <span className={confidenceBadges[evidence.confidence]}>
                      {evidence.confidence} confidence
                    </span>
                  )}
                </div>
                {evidence.author && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    by {evidence.author}
                  </p>
                )}
              </div>
            </div>

            {/* Full Quote */}
            <blockquote className="text-sm text-gray-700 dark:text-gray-300 italic mb-3 pl-3 border-l-2 border-gray-300 dark:border-gray-600">
              "{evidence.fullQuote || evidence.quote}"
            </blockquote>

            {/* Context */}
            {evidence.context && (
              <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold">Context:</span> {evidence.context}
              </div>
            )}

            {/* Source Link */}
            {evidence.url && (
              <a
                href={evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink size={12} />
                View Original Source
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

