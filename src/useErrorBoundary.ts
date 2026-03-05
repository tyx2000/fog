import { useCallback, useState } from "react";

export interface UseErrorBoundaryResult<TError = unknown> {
  error: TError | null;
  showBoundary: (error: TError) => void;
  resetBoundary: () => void;
}

export default function useErrorBoundary<TError = unknown>(): UseErrorBoundaryResult<TError> {
  const [error, setError] = useState<TError | null>(null);

  const showBoundary = useCallback((nextError: TError) => {
    setError(nextError);
  }, []);

  const resetBoundary = useCallback(() => {
    setError(null);
  }, []);

  if (error !== null) {
    throw error;
  }

  return {
    error,
    showBoundary,
    resetBoundary
  };
}
