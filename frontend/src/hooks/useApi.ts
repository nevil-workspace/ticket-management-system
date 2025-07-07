import { useState, useCallback } from 'react';
import toast from '@/lib/toast';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export function useApi<T = any>(options: UseApiOptions<T> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (apiCall: () => Promise<T>) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        setData(result);

        if (options.showToast !== false && options.successMessage) {
          toast.success(options.successMessage);
        }

        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);

        if (options.showToast !== false) {
          toast.error(options.errorMessage || error.message || 'An error occurred');
        }

        options.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
