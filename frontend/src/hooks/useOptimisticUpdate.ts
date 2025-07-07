import { useState, useCallback } from 'react';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error, originalData: T) => void;
  onFinally?: () => void;
}

export function useOptimisticUpdate<T>(initialData: T, options: OptimisticUpdateOptions<T> = {}) {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateOptimistically = useCallback(
    async (
      optimisticUpdate: (currentData: T) => T,
      apiCall: () => Promise<any>,
      successUpdate?: (response: any, currentData: T) => T,
    ) => {
      const originalData = data;

      // Apply optimistic update
      const optimisticData = optimisticUpdate(data);
      setData(optimisticData);

      setIsUpdating(true);

      try {
        const response = await apiCall();

        // Apply success update if provided, otherwise keep optimistic update
        if (successUpdate) {
          setData(successUpdate(response, optimisticData));
        }

        options.onSuccess?.(response);
        return response;
      } catch (error) {
        // Revert to original data on error
        setData(originalData);
        options.onError?.(error as Error, originalData);
        throw error;
      } finally {
        setIsUpdating(false);
        options.onFinally?.();
      }
    },
    [data, options],
  );

  const setDataDirectly = useCallback((newData: T) => {
    setData(newData);
  }, []);

  return {
    data,
    setData: setDataDirectly,
    updateOptimistically,
    isUpdating,
  };
}
