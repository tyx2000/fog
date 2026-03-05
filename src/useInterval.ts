import { useCallback, useEffect, useRef, useState } from "react";

export interface UseIntervalOptions {
  autoStart?: boolean;
  enabled?: boolean;
  immediate?: boolean;
}

export interface UseIntervalResult {
  isActive: boolean;
  start: () => void;
  clear: () => void;
  reset: () => void;
}

function canStart(delay: number | null, enabled: boolean) {
  return enabled && delay !== null && delay >= 0;
}

export default function useInterval(
  callback: () => void,
  delay: number | null,
  options: UseIntervalOptions = {}
): UseIntervalResult {
  const {
    autoStart = true,
    enabled = true,
    immediate = false
  } = options;

  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsActive(false);
  }, []);

  const start = useCallback(() => {
    if (!canStart(delay, enabled)) {
      return;
    }
    const intervalMs = delay ?? 0;

    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }

    if (immediate) {
      callbackRef.current();
    }

    setIsActive(true);
    timerRef.current = setInterval(() => {
      callbackRef.current();
    }, intervalMs);
  }, [delay, enabled, immediate]);

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
