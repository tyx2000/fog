import { useEffect, useRef } from "react";

type ClickOutsideEvent =
  | MouseEvent
  | TouchEvent
  | PointerEvent;

type ClickOutsideEventName =
  | "click"
  | "mousedown"
  | "mouseup"
  | "touchstart"
  | "touchend"
  | "pointerdown"
  | "pointerup";

interface UseClickOutsideOptions {
  enabled?: boolean;
  eventName?: ClickOutsideEventName;
  capture?: boolean;
}

export default function useClickOutside<T extends HTMLElement>(
  onClickOutside: (event: ClickOutsideEvent) => void,
  options: UseClickOutsideOptions = {}
) {
  const { enabled = true, eventName = "click", capture = true } = options;
  const ref = useRef<T | null>(null);
  const callbackRef = useRef(onClickOutside);

  useEffect(() => {
    callbackRef.current = onClickOutside;
  }, [onClickOutside]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const listener = (event: Event) => {
      const element = ref.current;
      if (!element) {
        return;
      }

      const path = typeof event.composedPath === "function"
        ? event.composedPath()
        : [];

      if (path.includes(element)) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && element.contains(target)) {
        return;
      }

      callbackRef.current(event as ClickOutsideEvent);
    };

    document.addEventListener(eventName, listener, capture);

    return () => {
      document.removeEventListener(eventName, listener, capture);
    };
  }, [enabled, eventName, capture]);

  return ref;
}
