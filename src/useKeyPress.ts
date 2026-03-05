import { useEffect, useState } from "react";

type RefTarget<T extends EventTarget> = {
  current: T | null | undefined;
};

type MaybeRefTarget<T extends EventTarget> =
  | T
  | null
  | undefined
  | RefTarget<T>;

type KeyFilter =
  | string
  | string[]
  | ((event: KeyboardEvent) => boolean);

export interface UseKeyPressOptions<
  T extends Window | Document | HTMLElement = Window
> {
  target?: MaybeRefTarget<T>;
  enabled?: boolean;
  preventDefault?: boolean;
}

function isRefTarget<T extends EventTarget>(
  value: MaybeRefTarget<T>
): value is RefTarget<T> {
  return typeof value === "object" && value !== null && "current" in value;
}

function resolveTarget<T extends Window | Document | HTMLElement>(
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

function matchesKey(
  key: KeyFilter,
  event: KeyboardEvent
) {
  if (typeof key === "function") {
    return key(event);
  }

  if (Array.isArray(key)) {
    return key.some((candidate) =>
      candidate.toLowerCase() === event.key.toLowerCase()
    );
  }

  return key.toLowerCase() === event.key.toLowerCase();
}

export default function useKeyPress<
  T extends Window | Document | HTMLElement = Window
>(
  key: KeyFilter,
  options: UseKeyPressOptions<T> = {}
) {
  const {
    target,
    enabled = true,
    preventDefault = false
  } = options;
  const targetElement = resolveTarget(target);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (!targetElement || !enabled) {
      setIsPressed(false);
      return;
    }

    const onKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;

      if (!matchesKey(key, keyboardEvent)) {
        return;
      }

      if (preventDefault) {
        keyboardEvent.preventDefault();
      }

      setIsPressed(true);
    };

    const onKeyUp = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;

      if (!matchesKey(key, keyboardEvent)) {
        return;
      }

      setIsPressed(false);
    };

    const onBlur = () => {
      setIsPressed(false);
    };

    targetElement.addEventListener("keydown", onKeyDown);
    targetElement.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      targetElement.removeEventListener("keydown", onKeyDown);
      targetElement.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled, key, preventDefault, targetElement]);

  return isPressed;
}
