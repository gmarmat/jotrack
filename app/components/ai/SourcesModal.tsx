'use client';

import { X, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export interface Source {
  url: string;
  title: string;
  type: 'financial_report' | 'news' | 'glassdoor' | 'linkedin' | 'other';
  dateAccessed: string;
  relevance?: string;
}

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sources: Source[];
}

export default function SourcesModal({ isOpen, onClose, title, sources }: SourcesModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const groupedSources = sources.reduce((acc, source) => {
    if (!acc[source.type]) {
      acc[source.type] = [];
    }
    acc[source.type].push(source);
    return acc;
  }, {} as Record<string, Source[]>);

  const typeLabels: Record<string, string> = {
    financial_report: 'Financial Reports',
    news: 'News Articles',
    glassdoor: 'Glassdoor/Reviews',
    linkedin: 'LinkedIn Profiles',
    other: 'Other Sources',
  };

  const handleCopyAll = () => {
    const formatted = sources
      .map((s, idx) => `${idx + 1}. ${s.title}\n   ${s.url}\n   Accessed: ${s.dateAccessed}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" data-testid="sources-modal">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
              title="Copy all sources"
            >
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy All'}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {sources.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-8">
              No sources available for this analysis.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSources).map(([type, typeSources]) => (
                <div key={type}>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    {typeLabels[type] || 'Other Sources'}
                    <span className="text-xs text-gray-500 font-normal">({typeSources.length})</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {typeSources.map((source, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {source.title}
                            </h4>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mb-1"
                            >
                              <ExternalLink size={12} />
                              <span className="truncate">{source.url}</span>
                            </a>
                            <p className="text-xs text-gray-600">
                              Accessed: {new Date(source.dateAccessed).toLocaleDateString()}
                            </p>
                            {source.relevance && (
                              <p className="text-xs text-gray-700 mt-2 italic">
                                <strong>Why:</strong> {source.relevance}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600">
            Total sources: {sources.length} | Click links to view in new tab
          </p>
        </div>
      </div>
    </div>
  );
}

