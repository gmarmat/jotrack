'use client';

import { useState } from 'react';
import { FileText, Download, Copy, Check, RefreshCw } from 'lucide-react';
import AnalyzeButton from '../ai/AnalyzeButton';

interface ResumeEditorProps {
  jobId: string;
  initialAiResume: string;
  onFinalize: (finalResume: string) => void;
}

export default function ResumeEditor({ jobId, initialAiResume, onFinalize }: ResumeEditorProps) {
  const [aiResume, setAiResume] = useState(initialAiResume);
  const [userEdits, setUserEdits] = useState(initialAiResume);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);

  const handleReOptimize = async () => {
    setIsOptimizing(true);
    
    try {
      const res = await fetch(`/api/jobs/${jobId}/coach/optimize-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentAiResume: aiResume,
          userEdits: userEdits,
        }),
      });

      if (!res.ok) {
        throw new Error('Optimization failed');
      }

      const data = await res.json();
      
      // Update left pane with optimized version
      setAiResume(data.optimizedResume);
      setUserEdits(data.optimizedResume);
      setChanges(data.changes || []);
      
      console.log(`✅ Resume re-optimized: ${data.changes?.length || 0} improvements made`);
    } catch (error) {
      console.error('Resume optimization failed:', error);
      alert('Failed to optimize resume. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(userEdits);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([userEdits], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-optimized-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAcceptAsFinal = () => {
    if (confirm('Accept this resume as final? This will be your application resume.')) {
      onFinalize(userEdits);
    }
  };

  const wordCount = userEdits.trim().split(/\s+/).filter(w => w.length > 0).length;
  const hasChanges = aiResume !== userEdits;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Resume Editor
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      {/* Recent Changes */}
      {changes.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2">
            ✨ Recent AI Improvements:
          </p>
          <ul className="text-xs text-green-700 dark:text-green-400 space-y-1">
            {changes.slice(0, 3).map((change, idx) => (
              <li key={idx}>• {change}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Split View Editor */}
      <div className="grid grid-cols-2 gap-4 mb-4" style={{ height: '600px' }}>
        {/* Left: AI-Optimized Resume (Read-Only) */}
        <div className="flex flex-col border-2 border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
          <div className="bg-purple-100 dark:bg-purple-900/30 px-4 py-2 border-b border-purple-200 dark:border-purple-800">
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300">
              AI-Optimized Resume (Read-Only)
            </h4>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              This is the AI-generated version with keyword optimization
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-mono leading-relaxed">
              {aiResume}
            </pre>
          </div>
        </div>

        {/* Right: User Editable Version */}
        <div className="flex flex-col border-2 border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
          <div className="bg-blue-100 dark:bg-blue-900/30 px-4 py-2 border-b border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Your Edits
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Make any changes you want, then click "Re-Optimize" to incorporate them
            </p>
          </div>
          
          <textarea
            value={userEdits}
            onChange={(e) => setUserEdits(e.target.value)}
            className="flex-1 p-4 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 font-mono leading-relaxed resize-none focus:outline-none"
            placeholder="Edit your resume here..."
            spellCheck={true}
          />
          
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {wordCount} words
              {hasChanges && <span className="ml-2 text-orange-600 dark:text-orange-400">• Unsaved changes</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <AnalyzeButton
            onAnalyze={handleReOptimize}
            isAnalyzing={isOptimizing}
            label="Re-Optimize with AI"
            estimatedCost={0.02}
            estimatedSeconds={15}
          />
          
          {hasChanges && (
            <button
              onClick={() => setUserEdits(aiResume)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
            >
              <RefreshCw size={14} />
              Reset to AI Version
            </button>
          )}
        </div>

        <button
          onClick={handleAcceptAsFinal}
          className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold text-sm shadow-md"
        >
          ✓ Accept as Final Resume
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          How to Use This Editor
        </h5>
        <ol className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
          <li>Review the AI-optimized resume on the left (keyword-optimized, ATS-friendly)</li>
          <li>Make any edits you want in the right pane (add details, adjust wording)</li>
          <li>Click "Re-Optimize with AI" to merge your changes with AI polish</li>
          <li>The left pane updates with the improved version</li>
          <li>Repeat steps 2-4 until you're happy with the result</li>
          <li>Click "Accept as Final Resume" to save and proceed</li>
        </ol>
      </div>
    </div>
  );
}

