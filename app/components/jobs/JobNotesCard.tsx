'use client';

import { useState, useEffect } from 'react';
import { Edit3, Plus, FileText } from 'lucide-react';

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

  useEffect(() => {
    setNotes(initialNotes);
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

  return (
    <div className="bg-blue-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm" data-testid="job-notes-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes</h2>
        </div>
        
        <div className="flex items-center gap-2">
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

      {/* Notes Content */}
      <div className="p-6">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes about this application..."
                className="w-full min-h-[200px] form-field resize-y"
              data-testid="notes-textarea"
            />
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="save-notes-button"
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
              
              <button
                onClick={() => {
                  setNotes(initialNotes);
                  setIsEditing(false);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                data-testid="cancel-notes-button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notes ? (
              <div 
                className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                data-testid="notes-display"
              >
                {notes}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic" data-testid="notes-empty">
                No notes yet. Click &quot;Edit&quot; to add notes about this application.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

