import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, CompositionEvent } from "react";

export interface UseCompositionOptions<T extends HTMLElement> {
  onChange?: (event: ChangeEvent<T>) => void;
  onCompositionStart?: (event: CompositionEvent<T>) => void;
  onCompositionUpdate?: (event: CompositionEvent<T>) => void;
  onCompositionEnd?: (event: CompositionEvent<T>) => void;
  triggerOnCompositionEnd?: boolean;
}

export interface UseCompositionHandlers<T extends HTMLElement> {
  onChange: (event: ChangeEvent<T>) => void;
  onCompositionStart: (event: CompositionEvent<T>) => void;
  onCompositionUpdate: (event: CompositionEvent<T>) => void;
  onCompositionEnd: (event: CompositionEvent<T>) => void;
}

export interface UseCompositionResult<T extends HTMLElement> {
  isComposing: boolean;
  handlers: UseCompositionHandlers<T>;
  resetComposition: () => void;
}

export default function useComposition<T extends HTMLElement>(
  options: UseCompositionOptions<T> = {}
): UseCompositionResult<T> {
  const {
    onChange,
    onCompositionStart,
    onCompositionUpdate,
    onCompositionEnd,
    triggerOnCompositionEnd = false
  } = options;

  const [isComposing, setIsComposing] = useState(false);
  const isComposingRef = useRef(false);

  const onChangeRef = useRef(onChange);
  const onCompositionStartRef = useRef(onCompositionStart);
  const onCompositionUpdateRef = useRef(onCompositionUpdate);
  const onCompositionEndRef = useRef(onCompositionEnd);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onCompositionStartRef.current = onCompositionStart;
  }, [onCompositionStart]);

  useEffect(() => {
    onCompositionUpdateRef.current = onCompositionUpdate;
  }, [onCompositionUpdate]);

  useEffect(() => {
    onCompositionEndRef.current = onCompositionEnd;
  }, [onCompositionEnd]);

  const onChangeHandler = useCallback((event: ChangeEvent<T>) => {
    if (isComposingRef.current) {
      return;
    }

    onChangeRef.current?.(event);
  }, []);

  const onCompositionStartHandler = useCallback((event: CompositionEvent<T>) => {
    isComposingRef.current = true;
    setIsComposing(true);
    onCompositionStartRef.current?.(event);
  }, []);

  const onCompositionUpdateHandler = useCallback((event: CompositionEvent<T>) => {
    onCompositionUpdateRef.current?.(event);
  }, []);

  const onCompositionEndHandler = useCallback((event: CompositionEvent<T>) => {
    isComposingRef.current = false;
    setIsComposing(false);
    onCompositionEndRef.current?.(event);

    if (triggerOnCompositionEnd) {
      onChangeRef.current?.(event as unknown as ChangeEvent<T>);
    }
  }, [triggerOnCompositionEnd]);

  const resetComposition = useCallback(() => {
    isComposingRef.current = false;
    setIsComposing(false);
  }, []);

  return {
    isComposing,
    handlers: {
      onChange: onChangeHandler,
      onCompositionStart: onCompositionStartHandler,
      onCompositionUpdate: onCompositionUpdateHandler,
      onCompositionEnd: onCompositionEndHandler
    },
    resetComposition
  };
}
