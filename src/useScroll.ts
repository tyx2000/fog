import { useCallback, useEffect, useState } from "react";

type RefTarget<T extends EventTarget> = {
  current: T | null | undefined;
};

type MaybeRefTarget<T extends EventTarget> =
  | T
  | null
  | undefined
  | RefTarget<T>;

type ScrollableTarget = Window | Element;

export interface ScrollPosition {
  x: number;
  y: number;
}

export interface UseScrollOptions<T extends ScrollableTarget> {
  target?: MaybeRefTarget<T>;
  enabled?: boolean;
  behavior?: ScrollBehavior;
}

export interface UseScrollResult {
  x: number;
  y: number;
  scrollTo: (x: number, y: number) => void;
}

function isRefTarget<T extends EventTarget>(
  value: MaybeRefTarget<T>
): value is RefTarget<T> {
  return typeof value === "object" && value !== null && "current" in value;
}

function resolveTarget<T extends ScrollableTarget>(
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

function getScrollPosition(target: ScrollableTarget | null): ScrollPosition {
  if (!target) {
    return { x: 0, y: 0 };
  }

  if ("scrollX" in target && "scrollY" in target) {
    return {
      x: target.scrollX,
      y: target.scrollY
    };
  }

  return {
    x: target.scrollLeft,
    y: target.scrollTop
  };
}

export default function useScroll<T extends ScrollableTarget = Window>(
  options: UseScrollOptions<T> = {}
): UseScrollResult {
  const {
    target,
    enabled = true,
    behavior = "auto"
  } = options;

  const targetElement = resolveTarget(target);
  const [position, setPosition] = useState<ScrollPosition>(() =>
    getScrollPosition(targetElement)
  );

  const syncPosition = useCallback(() => {
    setPosition(getScrollPosition(targetElement));
  }, [targetElement]);

  useEffect(() => {
    if (!targetElement || !enabled) {
      return;
    }

    syncPosition();

    const listener = () => {
      syncPosition();
    };

    targetElement.addEventListener("scroll", listener, {
      passive: true
    });

    return () => {
      targetElement.removeEventListener("scroll", listener);
    };
  }, [enabled, syncPosition, targetElement]);

  const scrollTo = useCallback((x: number, y: number) => {
    if (!targetElement) {
      return;
    }

    if ("scrollX" in targetElement && "scrollY" in targetElement) {
      targetElement.scrollTo({
        left: x,
        top: y,
        behavior
      });
      return;
    }

    if (typeof targetElement.scrollTo === "function") {
      targetElement.scrollTo({
        left: x,
        top: y,
        behavior
      });
      return;
    }

    targetElement.scrollLeft = x;
    targetElement.scrollTop = y;
  }, [behavior, targetElement]);

  return {
    x: position.x,
    y: position.y,
    scrollTo
  };
}
