import { useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

interface UseAutoSaveOptions {
  jobId: string;
  field: string;
  value: any;
  endpoint?: string;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave({
  jobId,
  field,
  value,
  endpoint,
  debounceMs = 1000,
  enabled = true,
}: UseAutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    if (!enabled || !debouncedValue) return;

    const save = async () => {
      setIsSaving(true);
      setError(null);

      try {
        const url = endpoint || `/api/jobs/${jobId}`;
        const response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: debouncedValue }),
        });

        if (!response.ok) {
          throw new Error(`Auto-save failed: ${response.status}`);
        }

        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save error:', err);
        setError(err instanceof Error ? err.message : 'Auto-save failed');
      } finally {
        setIsSaving(false);
      }
    };

    save();
  }, [debouncedValue, enabled, jobId, field, endpoint]);

  return {
    isSaving,
    lastSaved,
    error,
  };
}

