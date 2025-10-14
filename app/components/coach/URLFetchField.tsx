'use client';

import { useState } from 'react';
import { Link as LinkIcon, Download, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface URLFetchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testId?: string;
}

export default function URLFetchField({ 
  label, 
  value, 
  onChange, 
  placeholder = "Enter URL",
  testId 
}: URLFetchFieldProps) {
  const [url, setUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  const handleFetch = async () => {
    if (!url.trim()) {
      setFetchError('Please enter a URL');
      return;
    }

    setIsFetching(true);
    setFetchError(null);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch URL');
      }

      const data = await res.json();
      
      const extractedText = data.text || '';

      if (extractedText.trim()) {
        onChange(extractedText);
        setFetchError(null);
      } else {
        throw new Error('No content could be extracted from this URL');
      }
    } catch (error: any) {
      setFetchError(error.message || 'Failed to fetch content. Try manual input.');
      setShowManual(true);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      
      {/* URL Input with Fetch Button */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid={testId ? `${testId}-url-input` : undefined}
          />
        </div>
        <button
          onClick={handleFetch}
          disabled={isFetching || !url.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          data-testid={testId ? `${testId}-fetch-button` : undefined}
        >
          <Download className={`w-4 h-4 ${isFetching ? 'animate-pulse' : ''}`} />
          {isFetching ? 'Fetching...' : 'Fetch'}
        </button>
      </div>

      {/* Fetch Error */}
      {fetchError && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">{fetchError}</p>
            <button
              onClick={() => setShowManual(!showManual)}
              className="mt-1 text-xs underline hover:text-yellow-900"
            >
              {showManual ? 'Hide' : 'Show'} manual input
            </button>
          </div>
        </div>
      )}

      {/* Fetched Content Preview */}
      {value && !showManual && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">Content Fetched ✓</span>
            <button
              onClick={() => setShowManual(true)}
              className="text-xs text-green-700 hover:text-green-900 underline"
            >
              Edit manually
            </button>
          </div>
          <div className="text-xs text-green-800 max-h-20 overflow-y-auto">
            {value.substring(0, 200)}...
          </div>
        </div>
      )}

      {/* Manual Input (Fallback) */}
      {showManual && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Manual Input</label>
            <button
              onClick={() => setShowManual(false)}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ChevronUp className="w-3 h-3" />
              Hide
            </button>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            placeholder="Paste content manually..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            data-testid={testId ? `${testId}-manual-input` : undefined}
          />
        </div>
      )}

      {/* Toggle Manual Input (if no content yet) */}
      {!value && !showManual && (
        <button
          onClick={() => setShowManual(true)}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <ChevronDown className="w-3 h-3" />
          Or enter manually
        </button>
      )}
    </div>
  );
}

