import { useCallback, useEffect, useRef, useState } from "react";

type RefTarget<T extends HTMLElement> = {
  current: T | null | undefined;
};

type MaybeRefTarget<T extends HTMLElement> =
  | T
  | null
  | undefined
  | RefTarget<T>;

export interface UseScrollLockOptions<T extends HTMLElement = HTMLElement> {
  target?: MaybeRefTarget<T>;
  autoLock?: boolean;
}

export interface UseScrollLockResult {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
}

function isRefTarget<T extends HTMLElement>(
  value: MaybeRefTarget<T>
): value is RefTarget<T> {
  return typeof value === "object" && value !== null && "current" in value;
}

function resolveTarget<T extends HTMLElement>(
  target: MaybeRefTarget<T> | undefined
) {
  if (isRefTarget(target)) {
    return target.current ?? null;
  }

  if (typeof target !== "undefined") {
    return target ?? null;
  }

  if (typeof document !== "undefined") {
    return document.body;
  }

  return null;
}

export default function useScrollLock<T extends HTMLElement = HTMLElement>(
  options: UseScrollLockOptions<T> = {}
): UseScrollLockResult {
  const {
    target,
    autoLock = false
  } = options;

  const targetElement = resolveTarget(target);
  const [isLocked, setIsLocked] = useState(false);
  const lockedRef = useRef(false);
  const lockedElementRef = useRef<HTMLElement | null>(null);
  const previousOverflowRef = useRef<string | null>(null);

  const lock = useCallback(() => {
    if (!targetElement || lockedRef.current) {
      return;
    }

    previousOverflowRef.current = targetElement.style.overflow;
    targetElement.style.overflow = "hidden";
    lockedElementRef.current = targetElement;
    lockedRef.current = true;
    setIsLocked(true);
  }, [targetElement]);

  const unlock = useCallback(() => {
    const lockedElement = lockedElementRef.current;
    if (!lockedRef.current || !lockedElement) {
      return;
    }

    lockedElement.style.overflow = previousOverflowRef.current ?? "";
    lockedElementRef.current = null;
    previousOverflowRef.current = null;
    lockedRef.current = false;
    setIsLocked(false);
  }, []);

  useEffect(() => {
    if (!autoLock) {
      return;
    }

    lock();
    return unlock;
  }, [autoLock, lock, unlock]);

  useEffect(() => unlock, [unlock]);

  return {
    isLocked,
    lock,
    unlock
  };
}
