'use client';

import { useState } from 'react';
import { Eye, X, Code2 } from 'lucide-react';

interface ExtractionPromptViewerProps {
  jobId: string;
}

export default function ExtractionPromptViewer({ jobId }: ExtractionPromptViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompts, setPrompts] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'jd' | 'cover_letter'>('resume');

  const handleOpen = async () => {
    setIsOpen(true);
    setLoading(true);
    
    try {
      const res = await fetch(`/api/jobs/${jobId}/extraction-prompts`);
      const data = await res.json();
      setPrompts(data);
    } catch (error) {
      console.error('Failed to load extraction prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title="View extraction prompts"
      >
        <Eye size={16} className="text-gray-600 dark:text-gray-400" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Extraction Prompts
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Actual prompts used to create Normalized & Detailed variants
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'resume'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            📄 Resume
          </button>
          <button
            onClick={() => setActiveTab('jd')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'jd'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-b-2 border-green-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            📋 Job Description
          </button>
          <button
            onClick={() => setActiveTab('cover_letter')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'cover_letter'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            ✉️ Cover Letter
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Process Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-200 mb-2">
                  Extraction Process:
                </h4>
                <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                  <p><strong>Step 1:</strong> {prompts?.process?.step1}</p>
                  <p><strong>Step 2:</strong> {prompts?.process?.step2}</p>
                  <p><strong>Cost:</strong> {prompts?.process?.cost}</p>
                  <p><strong>Model:</strong> {prompts?.process?.model}</p>
                </div>
              </div>

              {/* Actual Prompt */}
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
                  Prompt for {activeTab === 'resume' ? 'Resume' : activeTab === 'jd' ? 'Job Description' : 'Cover Letter'}:
                </h4>
                <pre className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-xs font-mono text-gray-800 dark:text-gray-100 whitespace-pre-wrap overflow-x-auto">
                  {prompts?.prompts?.[activeTab] || 'Loading...'}
                </pre>
              </div>

              {/* Note */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-xs text-yellow-900 dark:text-yellow-200">
                  <strong>Note:</strong> {prompts?.note}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            These prompts are embedded in the refresh-variants API endpoint
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

