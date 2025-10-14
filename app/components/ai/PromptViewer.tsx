'use client';

import { useState } from 'react';
import { Eye, X, Code2 } from 'lucide-react';

interface PromptViewerProps {
  promptKind: 'analyze' | 'compare' | 'improve' | 'skillpath' | 'persona' | 'company' | 'people' | 'ecosystem' | 'match-signals' | 'matchSignals';
  version?: string;
  buttonLabel?: string;
  className?: string;
}

export default function PromptViewer({ 
  promptKind, 
  version = 'v1',
  buttonLabel = 'View Prompt',
  className = ''
}: PromptViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [promptContent, setPromptContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/ai/prompts/view?kind=${promptKind}&version=${version}`);
      
      if (!res.ok) {
        throw new Error('Failed to load prompt');
      }

      const data = await res.json();
      setPromptContent(data.content || 'No prompt found');
    } catch (err: any) {
      setError(err.message || 'Failed to load prompt');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className={`text-sm text-gray-600 hover:text-purple-600 flex items-center gap-1 ${className}`}
        title="View the AI prompt being used"
      >
        <Eye className="w-4 h-4" />
        {buttonLabel}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI Prompt: {promptKind} ({version})
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
              {error}
            </div>
          ) : (
            <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {promptContent}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600">
            This is a read-only view. To edit prompts, use the Developer tab in Settings.
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

