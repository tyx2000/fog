import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent, TouchEvent } from "react";

type StartEvent<T extends HTMLElement> =
  | MouseEvent<T>
  | TouchEvent<T>;

type EndEvent<T extends HTMLElement> =
  | MouseEvent<T>
  | TouchEvent<T>;

export interface UseLongPressHandlers<T extends HTMLElement> {
  onMouseDown: (event: MouseEvent<T>) => void;
  onMouseUp: (event: MouseEvent<T>) => void;
  onMouseLeave: (event: MouseEvent<T>) => void;
  onTouchStart: (event: TouchEvent<T>) => void;
  onTouchEnd: (event: TouchEvent<T>) => void;
  onTouchCancel: (event: TouchEvent<T>) => void;
}

export interface UseLongPressOptions<T extends HTMLElement> {
  threshold?: number;
  enabled?: boolean;
  onStart?: (event: StartEvent<T>) => void;
  onFinish?: (event: StartEvent<T>) => void;
  onCancel?: (event: EndEvent<T>) => void;
}

export interface UseLongPressResult<T extends HTMLElement> {
  isPressed: boolean;
  handlers: UseLongPressHandlers<T>;
}

export default function useLongPress<T extends HTMLElement>(
  callback: (event: StartEvent<T>) => void,
  options: UseLongPressOptions<T> = {}
): UseLongPressResult<T> {
  const {
    threshold = 400,
    enabled = true,
    onStart,
    onFinish,
    onCancel
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);
  const callbackRef = useRef(callback);
  const onStartRef = useRef(onStart);
  const onFinishRef = useRef(onFinish);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    onStartRef.current = onStart;
  }, [onStart]);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback((event: StartEvent<T>) => {
    if (!enabled) {
      return;
    }

    clearTimer();
    triggeredRef.current = false;
    setIsPressed(true);
    onStartRef.current?.(event);

    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      callbackRef.current(event);
      onFinishRef.current?.(event);
    }, threshold);
  }, [clearTimer, enabled, threshold]);

  const stop = useCallback((event: EndEvent<T>) => {
    const wasTriggered = triggeredRef.current;

    clearTimer();
    triggeredRef.current = false;
    setIsPressed(false);

    if (!wasTriggered) {
      onCancelRef.current?.(event);
    }
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    isPressed,
    handlers: {
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: start,
      onTouchEnd: stop,
      onTouchCancel: stop
    }
  };
}
