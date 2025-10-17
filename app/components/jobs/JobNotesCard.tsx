'use client';

import { useState, useEffect } from 'react';
import { Edit3, Plus, FileText, Sparkles, RotateCcw } from 'lucide-react';
import AnalyzeButton from '../ai/AnalyzeButton';

interface JobNotesCardProps {
  jobId: string;
  initialNotes?: string;
}

export default function JobNotesCard({ 
  jobId, 
  initialNotes = ''
}: JobNotesCardProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [originalNotes, setOriginalNotes] = useState(initialNotes);

  useEffect(() => {
    setNotes(initialNotes);
    setOriginalNotes(initialNotes);
  }, [initialNotes]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditing(false);
      } else {
        throw new Error(data.message || 'Failed to save notes');
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
      alert('Failed to save notes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBullet = () => {
    const newText = notes.trim() ? `${notes}\n• ` : '• ';
    setNotes(newText);
    setIsEditing(true);
  };

  const handleAiSummarize = async () => {
    if (!notes || notes.trim().length === 0) {
      alert('Please add some notes first before AI summarization.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/summarize-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) {
        throw new Error('AI summarization failed');
      }

      const data = await res.json();
      setAiNotes(data.summarizedNotes);
      setNotes(data.summarizedNotes);
    } catch (error) {
      console.error('AI summarization failed:', error);
      alert('Failed to summarize notes. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRevert = () => {
    setNotes(originalNotes);
    setAiNotes(null);
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col" data-testid="job-notes-card">
      {/* Header - No frame */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* AI Summarize Button */}
          <AnalyzeButton
            onAnalyze={handleAiSummarize}
            isAnalyzing={isAnalyzing}
            label="Summarize Notes with AI"
            estimatedCost={0.01}
            estimatedSeconds={15}
          />
          
          {/* Revert Button (if AI notes exist) */}
          {aiNotes && (
            <button
              onClick={handleRevert}
              className="p-2 rounded-md bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 transition-colors"
              title="Revert to original notes"
            >
              <RotateCcw size={16} />
            </button>
          )}
          
          <button
            onClick={handleAddBullet}
            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            data-testid="add-bullet-button"
            title="Add bullet point"
          >
            <Plus size={16} />
            Bullet
          </button>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 text-sm font-medium transition-colors"
            data-testid="edit-notes-button"
          >
            <Edit3 size={16} />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Notes Content - Always Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes about this application...&#10;&#10;💡 Tips:&#10;• Keep notes actionable and keyword-focused&#10;• Quick reminders for interview prep&#10;• Mental notes about the role/company&#10;• Use AI Summarize to condense long notes"
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              data-testid="notes-textarea"
            />
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                data-testid="save-notes-button"
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
              
              <button
                onClick={() => {
                  setNotes(aiNotes || originalNotes);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                data-testid="cancel-notes-button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* AI Badge (if AI summarized) */}
            {aiNotes && (
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded text-xs text-purple-700 dark:text-purple-300 font-medium">
                <Sparkles size={12} />
                AI Summarized
              </div>
            )}
            
            {notes ? (
              <div 
                className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                data-testid="notes-display"
              >
                {notes}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic text-sm" data-testid="notes-empty">
                No notes yet. Click &quot;Edit&quot; to add notes about this application.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

