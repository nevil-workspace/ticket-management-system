import { useState, useCallback } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  onSuccess,
  onError,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        await onSubmit(values);
        onSuccess?.();
      } catch (error) {
        onError?.(error as Error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    values,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setValue,
    setValues,
  };
}
