import { useCallback, useEffect, useRef, useState } from "react";

export interface UseThrottleOptions<T> {
  leading?: boolean;
  trailing?: boolean;
  equalityFn?: (previousValue: T, nextValue: T) => boolean;
}

export interface UseThrottleResult<T> {
  value: T;
  isPending: boolean;
  cancel: () => void;
  flush: () => void;
}

export default function useThrottle<T>(
  input: T,
  delay = 300,
  options: UseThrottleOptions<T> = {}
): UseThrottleResult<T> {
  const {
    leading = true,
    trailing = true,
    equalityFn = Object.is
  } = options;

  const [value, setValue] = useState(input);
  const [isPending, setIsPending] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousInputRef = useRef(input);
  const pendingValueRef = useRef<T | null>(null);
  const hasPendingRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearPending = useCallback(() => {
    hasPendingRef.current = false;
    pendingValueRef.current = null;
    setIsPending(false);
  }, []);

  const emitPending = useCallback(() => {
    if (!hasPendingRef.current) {
      return;
    }

    setValue(pendingValueRef.current as T);
    clearPending();
  }, [clearPending]);

  const cancel = useCallback(() => {
    clearTimer();
    clearPending();
  }, [clearTimer, clearPending]);

  const flush = useCallback(() => {
    if (timerRef.current === null) {
      return;
    }

    clearTimer();
    emitPending();
  }, [clearTimer, emitPending]);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;

      if (trailing) {
        emitPending();
      } else {
        clearPending();
      }
    }, delay);
  }, [clearTimer, clearPending, delay, emitPending, trailing]);

  useEffect(() => {
    const previousInput = previousInputRef.current;
    previousInputRef.current = input;

    if (equalityFn(previousInput, input)) {
      return;
    }

    if (delay <= 0) {
      clearTimer();
      clearPending();
      setValue(input);
      return;
    }

    const hasActiveTimer = timerRef.current !== null;

    if (!hasActiveTimer) {
      if (leading) {
        setValue(input);
        clearPending();
      } else if (trailing) {
        pendingValueRef.current = input;
        hasPendingRef.current = true;
        setIsPending(true);
      }

      startTimer();
      return;
    }

    if (trailing) {
      pendingValueRef.current = input;
      hasPendingRef.current = true;
      setIsPending(true);
    }
  }, [
    clearPending,
    clearTimer,
    delay,
    equalityFn,
    input,
    leading,
    startTimer,
    trailing
  ]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    value,
    isPending,
    cancel,
    flush
  };
}
