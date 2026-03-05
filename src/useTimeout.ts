import { useCallback, useEffect, useRef, useState } from "react";

export interface UseTimeoutOptions {
  autoStart?: boolean;
  enabled?: boolean;
}

export interface UseTimeoutResult {
  isActive: boolean;
  start: () => void;
  clear: () => void;
  reset: () => void;
}

function canStart(delay: number | null, enabled: boolean) {
  return enabled && delay !== null && delay >= 0;
}

export default function useTimeout(
  callback: () => void,
  delay: number | null,
  options: UseTimeoutOptions = {}
): UseTimeoutResult {
  const {
    autoStart = true,
    enabled = true
  } = options;

  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setIsActive(false);
  }, []);

  const start = useCallback(() => {
    if (!canStart(delay, enabled)) {
      return;
    }
    const timeoutMs = delay ?? 0;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    setIsActive(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setIsActive(false);
      callbackRef.current();
    }, timeoutMs);
  }, [delay, enabled]);

  const reset = useCallback(() => {
    clear();
    start();
  }, [clear, start]);

  useEffect(() => {
    if (!autoStart) {
      return;
    }

    start();
    return clear;
  }, [autoStart, clear, start]);

  useEffect(() => {
    if (!canStart(delay, enabled)) {
      clear();
    }
  }, [delay, enabled, clear]);

  useEffect(() => clear, [clear]);

  return {
    isActive,
    start,
    clear,
    reset
  };
}
