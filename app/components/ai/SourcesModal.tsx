'use client';

import { X, ExternalLink, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export interface Source {
  url?: string;
  name?: string;
  title?: string;
  type?: string;
  category?: string;
  confidence?: 'high' | 'medium' | 'low';
  dateAccessed?: string;
  relevance?: string;
}

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Source[];
  title?: string;
  sectionName?: string;
}

export default function SourcesModal({ isOpen, onClose, sources, title, sectionName }: SourcesModalProps) {
  if (!isOpen) return null;

  const hasRealSources = sources && sources.length > 0;
  const modalTitle = title || 'Sources & Research';
  const modalSubtitle = sectionName;

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
            <CheckCircle size={12} />
            High Confidence
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
            <AlertTriangle size={12} />
            Medium Confidence
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 rounded">
            <AlertCircle size={12} />
            Low Confidence
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {modalTitle}
            </h2>
            {modalSubtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {modalSubtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {!hasRealSources ? (
            <div className="text-center py-12">
              <AlertCircle size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No sources available
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This analysis was calculated locally using native app signals.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                {sources.length} source{sources.length !== 1 ? 's' : ''} used for this analysis
              </p>

              {sources.map((source, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {source.title || source.name || 'Untitled Source'}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(source.category || source.type) && (
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            {source.category || source.type}
                          </span>
                        )}
                        {source.dateAccessed && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(source.dateAccessed).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {getConfidenceBadge(source.confidence)}
                  </div>

                  {source.relevance && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {source.relevance}
                    </p>
                  )}

                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                    >
                      <ExternalLink size={14} />
                      {source.url.length > 60 ? source.url.substring(0, 60) + '...' : source.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
