'use client';

import { useState } from 'react';
import { FileText, Download, Copy, Check, Sparkles } from 'lucide-react';
import AnalyzeButton from '../ai/AnalyzeButton';

interface CoverLetterGeneratorProps {
  jobId: string;
  onGenerate?: (coverLetter: string) => void;
}

export default function CoverLetterGenerator({ jobId, onGenerate }: CoverLetterGeneratorProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const res = await fetch(`/api/jobs/${jobId}/coach/generate-cover-letter`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Cover letter generation failed');
      }

      const data = await res.json();
      setCoverLetter(data.coverLetter);
      setMetadata(data.metadata);
      
      if (onGenerate) {
        onGenerate(data.coverLetter);
      }
      
      console.log(`✅ Cover letter generated: ${data.metadata?.wordCount || 0} words, ${data.metadata?.principleMentions || 0} principles mentioned`);
    } catch (error) {
      console.error('Cover letter generation failed:', error);
      alert('Failed to generate cover letter. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = coverLetter.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Cover Letter Generator
          </h3>
        </div>

        {!coverLetter && (
          <AnalyzeButton
            onAnalyze={handleGenerate}
            isAnalyzing={isGenerating}
            label="Generate Cover Letter"
            estimatedCost={0.025}
            estimatedSeconds={20}
          />
        )}
      </div>

      {/* Generated Cover Letter */}
      {coverLetter ? (
        <div className="space-y-4">
          {/* Metadata */}
          {metadata && (
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-purple-600" />
                AI Generated
              </span>
              <span>{wordCount} words</span>
              {metadata.principleMentions > 0 && (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  {metadata.principleMentions} company principles mentioned
                </span>
              )}
              {metadata.keywordsUsed && (
                <span className="text-blue-600 dark:text-blue-400">
                  Keywords: {metadata.keywordsUsed.slice(0, 3).join(', ')}
                </span>
              )}
            </div>
          )}

          {/* Cover Letter Display/Edit */}
          {isEditing ? (
            <div>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans text-sm leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500"
              />
              
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {wordCount} words
                </p>
                
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-indigo-200 dark:border-indigo-800 rounded-lg p-6 bg-indigo-50 dark:bg-indigo-900/20">
              <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-sans leading-relaxed">
                {coverLetter}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium"
              >
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
              
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium"
              >
                <Download size={14} />
                Download
              </button>
            </div>

            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
            >
              <Sparkles size={14} />
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Click "Generate Cover Letter" to create a personalized cover letter
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            We'll craft a conversational, punchy letter that references company principles and highlights your fit
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Cover Letter Best Practices
        </h5>
        <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Keep it concise (250-350 words, 3 paragraphs)</li>
          <li>• Reference company principles to show cultural fit</li>
          <li>• Include 2-3 quantified achievements</li>
          <li>• Address hiring manager by name if known</li>
          <li>• Show genuine enthusiasm (not desperation)</li>
          <li>• Edit the AI version to add your personal touch!</li>
        </ul>
      </div>
    </div>
  );
}

