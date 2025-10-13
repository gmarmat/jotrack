'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import URLInputField from './URLInputField';

interface Entry {
  id: string;
  url: string;
  name?: string;
  title?: string;
  role?: string;
}

interface MultiEntryFieldProps {
  label: string;
  entries: Entry[];
  onChange: (entries: Entry[]) => void;
  fieldType?: 'person' | 'company';
  placeholder?: string;
  addButtonLabel?: string;
}

export default function MultiEntryField({
  label,
  entries,
  onChange,
  fieldType = 'person',
  placeholder = 'https://linkedin.com/in/...',
  addButtonLabel = 'Add Another',
}: MultiEntryFieldProps) {
  const handleAdd = () => {
    const newEntry: Entry = {
      id: `entry-${Date.now()}`,
      url: '',
    };
    onChange([...entries, newEntry]);
  };

  const handleRemove = (id: string) => {
    onChange(entries.filter((e) => e.id !== id));
  };

  const handleUrlChange = (id: string, url: string) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, url } : e)));
  };

  const handleManualData = (id: string, data: Record<string, string>) => {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...data } : e)));
  };

  return (
    <div className="space-y-4" data-testid="multi-entry-field">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
          data-testid="add-entry-button"
        >
          <Plus size={14} />
          {addButtonLabel}
        </button>
      </div>

      {entries.length === 0 && (
        <div className="text-sm text-gray-500 italic text-center py-4 border border-dashed border-gray-300 rounded-lg">
          No entries yet. Click &quot;{addButtonLabel}&quot; to add one.
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="relative p-4 bg-gray-50 rounded-lg border border-gray-200"
            data-testid={`entry-${index}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold mt-1">
                {index + 1}
              </div>

              <div className="flex-1">
                <URLInputField
                  label={`${fieldType === 'person' ? 'LinkedIn' : 'Company'} URL`}
                  url={entry.url}
                  onUrlChange={(url) => handleUrlChange(entry.id, url)}
                  onManualData={(data) => handleManualData(entry.id, data)}
                  manualFields={
                    fieldType === 'person'
                      ? [
                          { name: 'name', label: 'Name', placeholder: 'Jane Doe' },
                          { name: 'title', label: 'Title', placeholder: 'Senior Engineer' },
                          { name: 'role', label: 'Role Type', placeholder: 'Recruiter, Peer, Manager' },
                        ]
                      : [
                          { name: 'name', label: 'Company Name', placeholder: 'TechCorp' },
                          { name: 'industry', label: 'Industry', placeholder: 'SaaS, Fintech, etc.' },
                        ]
                  }
                  placeholder={placeholder}
                />
              </div>

              <button
                onClick={() => handleRemove(entry.id)}
                className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                title="Remove entry"
                data-testid={`remove-entry-${index}`}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

