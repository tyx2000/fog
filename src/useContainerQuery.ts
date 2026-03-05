import { useCallback, useEffect, useRef, useState } from "react";

export interface ContainerSize {
  width: number;
  height: number;
}

export interface ContainerQuery {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export interface UseContainerQueryOptions {
  initialSize?: ContainerSize;
  initialMatches?: boolean;
  box?: ResizeObserverBoxOptions;
  onChange?: (
    matches: boolean,
    size: ContainerSize,
    entry: ResizeObserverEntry | null
  ) => void;
}

export interface UseContainerQueryResult<T extends Element> {
  ref: (node: T | null) => void;
  matches: boolean;
  size: ContainerSize;
  entry: ResizeObserverEntry | null;
}

type ContainerQueryInput = ContainerQuery | ((size: ContainerSize) => boolean);

function evaluateContainerQuery(
  query: ContainerQueryInput,
  size: ContainerSize
) {
  if (typeof query === "function") {
    return query(size);
  }

  const {
    minWidth,
    maxWidth,
    minHeight,
    maxHeight
  } = query;

  if (typeof minWidth === "number" && size.width < minWidth) {
    return false;
  }

  if (typeof maxWidth === "number" && size.width > maxWidth) {
    return false;
  }

  if (typeof minHeight === "number" && size.height < minHeight) {
    return false;
  }

  if (typeof maxHeight === "number" && size.height > maxHeight) {
    return false;
  }

  return true;
}

function getSizeFromElement(target: Element): ContainerSize {
  const rect = target.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height
  };
}

function getSizeFromEntry(entry: ResizeObserverEntry): ContainerSize {
  const contentBox = Array.isArray(entry.contentBoxSize)
    ? entry.contentBoxSize[0]
    : entry.contentBoxSize;

  if (contentBox && typeof contentBox.inlineSize === "number") {
    return {
      width: contentBox.inlineSize,
      height: contentBox.blockSize
    };
  }

  return {
    width: entry.contentRect.width,
    height: entry.contentRect.height
  };
}

export default function useContainerQuery<T extends Element>(
  query: ContainerQueryInput,
  options: UseContainerQueryOptions = {}
): UseContainerQueryResult<T> {
  const {
    initialSize = { width: 0, height: 0 },
    initialMatches = false,
    box,
    onChange
  } = options;

  const [target, setTarget] = useState<T | null>(null);
  const [size, setSize] = useState<ContainerSize>(initialSize);
  const [matches, setMatches] = useState(initialMatches);
  const [entry, setEntry] = useState<ResizeObserverEntry | null>(null);

  const onChangeRef = useRef(onChange);
  const queryRef = useRef(query);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    queryRef.current = query;

    const nextMatches = evaluateContainerQuery(query, size);
    setMatches((previousMatches) => {
      if (previousMatches === nextMatches) {
        return previousMatches;
      }

      onChangeRef.current?.(nextMatches, size, entry);
      return nextMatches;
    });
  }, [query, size, entry]);

  const ref = useCallback((node: T | null) => {
    setTarget((previousNode) => (previousNode === node ? previousNode : node));
  }, []);

  useEffect(() => {
    if (!target) {
      return;
    }

    const updateState = (
      nextSize: ContainerSize,
      nextEntry: ResizeObserverEntry | null
    ) => {
      const nextMatches = evaluateContainerQuery(queryRef.current, nextSize);

      setSize((previousSize) => {
        if (
          previousSize.width === nextSize.width &&
          previousSize.height === nextSize.height
        ) {
          return previousSize;
        }

        return nextSize;
      });

      setMatches((previousMatches) => {
        if (previousMatches === nextMatches) {
          return previousMatches;
        }

        return nextMatches;
      });

      setEntry(nextEntry);
      onChangeRef.current?.(nextMatches, nextSize, nextEntry);
    };

    updateState(getSizeFromElement(target), null);

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const firstEntry = entries[0];
      if (!firstEntry) {
        return;
      }

      updateState(getSizeFromEntry(firstEntry), firstEntry);
    });

    observer.observe(target, box ? { box } : undefined);

    return () => {
      observer.disconnect();
    };
  }, [target, box]);

  return {
    ref,
    matches,
    size,
    entry
  };
}
