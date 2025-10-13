'use client';

import { useState } from 'react';
import { Download, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';

interface URLInputFieldProps {
  label: string;
  url: string;
  onUrlChange: (url: string) => void;
  onManualData?: (data: Record<string, string>) => void;
  manualFields?: Array<{ name: string; label: string; placeholder?: string }>;
  placeholder?: string;
}

export default function URLInputField({
  label,
  url,
  onUrlChange,
  onManualData,
  manualFields = [],
  placeholder = 'https://linkedin.com/in/...',
}: URLInputFieldProps) {
  const [isFetching, setIsFetching] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualValues, setManualValues] = useState<Record<string, string>>({});

  const handleFetch = async () => {
    if (!url) {
      setError('Please enter a URL first');
      return;
    }

    setIsFetching(true);
    setError(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Auto-populate manual fields if provided
        if (onManualData) {
          onManualData(data.data);
        }
        
        // Success feedback
        setError(null);
      } else if (data.fallback) {
        // Show manual input
        setError(data.error || 'Could not fetch content');
        setShowManual(true);
      }
    } catch (err) {
      setError('Failed to fetch content. Please enter manually.');
      setShowManual(true);
    } finally {
      setIsFetching(false);
    }
  };

  const handleManualChange = (fieldName: string, value: string) => {
    const updated = { ...manualValues, [fieldName]: value };
    setManualValues(updated);
    onManualData?.(updated);
  };

  return (
    <div className="space-y-3" data-testid="url-input-field">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            data-testid="url-input"
          />
          <button
            onClick={handleFetch}
            disabled={isFetching || !url}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            data-testid="fetch-button"
          >
            {isFetching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isFetching ? 'Fetching...' : 'Fetch'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Manual Input Section */}
      {manualFields.length > 0 && (
        <div>
          <button
            onClick={() => setShowManual(!showManual)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            data-testid="toggle-manual-input"
          >
            {showManual ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Or paste manually {showManual ? '(collapse)' : '(expand)'}
          </button>

          {showManual && (
            <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {manualFields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={manualValues[field.name] || ''}
                    onChange={(e) => handleManualChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    data-testid={`manual-${field.name}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

