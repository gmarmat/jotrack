"use client";

import { useState, useCallback } from 'react';

export type Kind = 'resume' | 'jd' | 'cover_letter' | 'other';

interface Version {
  id: string;
  filename: string;
  path: string;
  mime: string;
  size: number;
  isActive: boolean;
  createdAt: string;
}

interface UseVersionsState {
  data: Version[];
  loading: boolean;
  error: string | null;
}

interface UseVersionsReturn extends UseVersionsState {
  refresh: () => Promise<void>;
  setData: (updater: (prev: Version[]) => Version[]) => void;
}

export function useVersions(jobId: string, kind: Kind): UseVersionsReturn {
  const [state, setState] = useState<UseVersionsState>({
    data: [],
    loading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const res = await fetch(`/api/jobs/${jobId}/attachments/versions?kind=${kind}`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch versions: ${res.status}`);
      }
      
      const response = await res.json();
      const data = response.versions || [];
      setState({ data, loading: false, error: null });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load versions';
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      console.error('useVersions refresh error:', err);
    }
  }, [jobId, kind]);

  const setData = useCallback((updater: (prev: Version[]) => Version[]) => {
    setState(prev => ({ ...prev, data: updater(prev.data) }));
  }, []);

  return {
    ...state,
    refresh,
    setData,
  };
}

