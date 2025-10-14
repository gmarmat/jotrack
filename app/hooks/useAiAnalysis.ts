import { useState, useCallback } from 'react';

export interface AnalysisState {
  isAnalyzing: boolean;
  lastAnalyzed: number | null;
  error: string | null;
  data: any | null;
}

export interface UseAiAnalysisReturn {
  state: AnalysisState;
  analyze: (fn: () => Promise<any>) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing independent AI analysis state per section
 * Each AI card can use this to track its own loading/error/data state
 */
export function useAiAnalysis(initialData: any = null): UseAiAnalysisReturn {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    lastAnalyzed: null,
    error: null,
    data: initialData,
  });

  const analyze = useCallback(async (fn: () => Promise<any>) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const result = await fn();
      setState({
        isAnalyzing: false,
        lastAnalyzed: Date.now(),
        error: null,
        data: result,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.message || 'Analysis failed',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      lastAnalyzed: null,
      error: null,
      data: initialData,
    });
  }, [initialData]);

  return { state, analyze, reset };
}

