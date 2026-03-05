import { useEffect, useRef } from "react";

type RefTarget<T extends EventTarget> = {
  current: T | null | undefined;
};

type MaybeRefTarget<T extends EventTarget> =
  | T
  | null
  | undefined
  | RefTarget<T>;

export interface UseEventListenerOptions<T extends EventTarget>
  extends AddEventListenerOptions {
  target?: MaybeRefTarget<T>;
  enabled?: boolean;
}

function isRefTarget<T extends EventTarget>(
  value: MaybeRefTarget<T>
): value is RefTarget<T> {
  return typeof value === "object" && value !== null && "current" in value;
}

function resolveTarget<T extends EventTarget>(
  target: MaybeRefTarget<T> | undefined
) {
  if (isRefTarget(target)) {
    return target.current ?? null;
  }

  if (typeof target !== "undefined") {
    return target ?? null;
  }

  if (typeof window !== "undefined") {
    return window;
  }

  return null;
}

export default function useEventListener<
  TEvent extends Event = Event,
  TTarget extends EventTarget = Window
>(
  eventName: string,
  handler: (event: TEvent) => void,
  options: UseEventListenerOptions<TTarget> = {}
) {
  const {
    target,
    enabled = true,
    capture,
    passive,
    once,
    signal
  } = options;

  const latestHandlerRef = useRef(handler);
  latestHandlerRef.current = handler;

  const targetElement = resolveTarget(target);

  useEffect(() => {
    if (!enabled || !targetElement) {
      return;
    }

    const listener = (event: Event) => {
      latestHandlerRef.current(event as TEvent);
    };

    targetElement.addEventListener(eventName, listener, {
      capture,
      passive,
      once,
      signal
    });

    return () => {
      targetElement.removeEventListener(eventName, listener, {
        capture
      });
    };
  }, [
    capture,
    enabled,
    eventName,
    once,
    passive,
    signal,
    targetElement
  ]);
}
