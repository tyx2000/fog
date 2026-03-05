import { useCallback, useEffect, useRef, useState } from "react";

export interface UseDebouncedOptions<T> {
  equalityFn?: (previousValue: T, nextValue: T) => boolean;
}

export interface UseDebouncedResult<T> {
  value: T;
  isPending: boolean;
  cancel: () => void;
  flush: () => void;
}

export default function useDebounced<T>(
  input: T,
  delay = 300,
  options: UseDebouncedOptions<T> = {}
): UseDebouncedResult<T> {
  const { equalityFn = Object.is } = options;

  const [value, setValue] = useState(input);
  const [isPending, setIsPending] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef(input);
  const previousInputRef = useRef(input);

  latestValueRef.current = input;

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    clearTimer();
    setIsPending(false);
  }, [clearTimer]);

  const flush = useCallback(() => {
    if (timeoutRef.current === null) {
      return;
    }

    clearTimer();
    setValue(latestValueRef.current);
    setIsPending(false);
  }, [clearTimer]);

  useEffect(() => {
    const previousInput = previousInputRef.current;
    previousInputRef.current = input;

    if (equalityFn(previousInput, input)) {
      return;
    }

    if (delay <= 0) {
      clearTimer();
      setValue(input);
      setIsPending(false);
      return;
    }

    clearTimer();
    setIsPending(true);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setValue(latestValueRef.current);
      setIsPending(false);
    }, delay);
  }, [input, delay, equalityFn, clearTimer]);

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
