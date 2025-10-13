'use client';

import { Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface SaveStatusBannerProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: number | null;
  error?: string | null;
  onRetry?: () => void;
}

export default function SaveStatusBanner({ status, lastSaved, error, onRetry }: SaveStatusBannerProps) {
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div 
      className={`sticky top-0 z-40 px-6 py-3 border-b transition-colors ${
        status === 'saving' ? 'bg-blue-50 border-blue-200' :
        status === 'saved' ? 'bg-green-50 border-green-200' :
        status === 'error' ? 'bg-red-50 border-red-200' :
        'bg-gray-50 border-gray-200'
      }`}
      data-testid="save-status-banner"
    >
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          {status === 'saving' && (
            <>
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-900">Saving changes...</span>
            </>
          )}
          
          {status === 'saved' && (
            <>
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Auto-Save: ON {lastSaved && `• Last saved ${getTimeAgo(lastSaved)}`}
              </span>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                Save failed: {error || 'Unknown error'}
              </span>
            </>
          )}
          
          {status === 'idle' && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">
                Auto-Save: Enabled
              </span>
            </>
          )}
        </div>

        {status === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-red-700 hover:text-red-900 hover:bg-red-100 rounded-md transition-colors"
            data-testid="retry-save"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

