import { useCallback, useEffect, useRef, useState } from "react";

export interface UseIntersectionOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
  initialIsIntersecting?: boolean;
  onChange?: (entry: IntersectionObserverEntry) => void;
}

export interface UseIntersectionResult<T extends Element> {
  ref: (node: T | null) => void;
  entry: IntersectionObserverEntry | null;
  isIntersecting: boolean;
}

function getThresholdDependency(
  threshold: number | number[] | undefined
) {
  if (Array.isArray(threshold)) {
    return threshold.join(",");
  }

  return String(threshold ?? "");
}

export default function useIntersection<T extends Element>(
  options: UseIntersectionOptions = {}
): UseIntersectionResult<T> {
  const {
    root = null,
    rootMargin,
    threshold,
    freezeOnceVisible = false,
    initialIsIntersecting = false,
    onChange
  } = options;

  const [target, setTarget] = useState<T | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);

  const onChangeRef = useRef(onChange);
  const thresholdDependency = getThresholdDependency(threshold);
  const frozen = freezeOnceVisible && isIntersecting;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const ref = useCallback((node: T | null) => {
    setTarget(node);
  }, []);

  useEffect(() => {
    if (!target || frozen || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (!firstEntry) {
          return;
        }

        setEntry(firstEntry);
        setIsIntersecting(firstEntry.isIntersecting);
        onChangeRef.current?.(firstEntry);
      },
      {
        root,
        rootMargin,
        threshold
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [target, root, rootMargin, threshold, thresholdDependency, frozen]);

  return {
    ref,
    entry,
    isIntersecting
  };
}
