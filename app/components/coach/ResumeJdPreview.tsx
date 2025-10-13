'use client';

import { useState, useEffect } from 'react';
import { Lock, Pencil, RotateCcw, Save, Upload } from 'lucide-react';

interface ResumeJdPreviewProps {
  label: string;
  jobId: string;
  kind: 'resume' | 'jd';
  value: string;
  onChange: (newValue: string) => void;
  onSave?: (value: string) => Promise<void>;
  className?: string;
}

export default function ResumeJdPreview({ 
  label, 
  jobId, 
  kind, 
  value, 
  onChange, 
  onSave,
  className = '' 
}: ResumeJdPreviewProps) {
  const [isEditable, setIsEditable] = useState(false);
  const [baselineText, setBaselineText] = useState('');
  const [currentText, setCurrentText] = useState(value);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttachment, setHasAttachment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadAttachment = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/jobs/${jobId}/attachments`);
        const data = await res.json();
        const attachments = data.attachments || [];
        const attachment = attachments.find((a: any) => a.kind === kind && !a.deletedAt);

        if (attachment) {
          setHasAttachment(true);
          // Extract text from attachment
          const textRes = await fetch(`/api/files/extract?path=${encodeURIComponent(attachment.path)}`);
          if (textRes.ok) {
            const textData = await textRes.json();
            const extractedText = textData.text || '';
            setBaselineText(extractedText);
            setCurrentText(extractedText);
            onChange(extractedText);
          }
        } else {
          setHasAttachment(false);
          setIsEditable(true); // If no attachment, make editable by default
        }
      } catch (error) {
        console.error('Failed to load attachment:', error);
        setIsEditable(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttachment();
  }, [jobId, kind, onChange]);

  const handleEdit = () => {
    setIsEditable(true);
  };

  const handleRevert = () => {
    setCurrentText(baselineText);
    onChange(baselineText);
    setIsEditable(false);
  };

  const handleOverwriteBaseline = async () => {
    if (confirm('This will replace the baseline version with your current edits. Are you sure?')) {
      setBaselineText(currentText);
      if (onSave) {
        setIsSaving(true);
        try {
          await onSave(currentText);
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  const handleTextChange = (newText: string) => {
    setCurrentText(newText);
    onChange(newText);
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="h-64 bg-gray-100 rounded-md animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`} data-testid={`preview-${kind}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">{label}</label>
        
        <div className="flex items-center gap-2">
          {hasAttachment && !isEditable && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              data-testid={`edit-${kind}`}
            >
              <Pencil size={14} />
              Edit
            </button>
          )}
          
          {hasAttachment && isEditable && currentText !== baselineText && (
            <>
              <button
                onClick={handleRevert}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                data-testid={`revert-${kind}`}
              >
                <RotateCcw size={14} />
                Revert to Baseline
              </button>
              
              <button
                onClick={handleOverwriteBaseline}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors disabled:opacity-50"
                data-testid={`overwrite-baseline-${kind}`}
              >
                <Save size={14} />
                {isSaving ? 'Saving...' : 'Update Baseline'}
              </button>
            </>
          )}
        </div>
      </div>

      <textarea
        value={currentText}
        onChange={(e) => handleTextChange(e.target.value)}
        readOnly={!isEditable}
        rows={12}
        className={`w-full px-4 py-3 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono ${
          isEditable 
            ? 'bg-white text-gray-900 border-gray-300' 
            : 'bg-gray-50 text-gray-700 border-gray-200 cursor-not-allowed'
        }`}
        placeholder={`Enter or paste ${label.toLowerCase()} here...`}
        data-testid={`textarea-${kind}`}
      />

      {!hasAttachment && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-3">
            <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">No {label} uploaded yet</p>
              <p className="text-xs text-blue-700 mt-1">
                You can paste text above or upload a file in the Job Settings → Files tab
              </p>
            </div>
          </div>
        </div>
      )}

      {hasAttachment && !isEditable && (
        <p className="text-xs text-gray-600 flex items-center gap-1.5">
          <Lock size={12} />
          Read-only. Click &quot;Edit&quot; to make changes.
        </p>
      )}

      {isEditable && currentText !== baselineText && baselineText && (
        <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
          ⚠️ You have unsaved changes. Click &quot;Update Baseline&quot; to save, or &quot;Revert&quot; to discard.
        </p>
      )}
    </div>
  );
}

