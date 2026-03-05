import { useEffect, useMemo, useRef } from "react";

type RefTarget<T extends EventTarget> = {
  current: T | null | undefined;
};

type MaybeRefTarget<T extends EventTarget> =
  | T
  | null
  | undefined
  | RefTarget<T>;

interface ParsedHotKey {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  mod: boolean;
  key: string | null;
}

type HotKey = string | string[];

export interface UseHotKeysOptions<
  T extends Window | Document | HTMLElement = Window
> {
  target?: MaybeRefTarget<T>;
  enabled?: boolean;
  preventDefault?: boolean;
  exact?: boolean;
  eventName?: "keydown" | "keyup";
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

function normalizeKey(key: string) {
  const lower = key.toLowerCase();
  if (lower === " ") {
    return "space";
  }

  if (lower === "esc") {
    return "escape";
  }

  return lower;
}

function parseHotKeyCombo(combo: string): ParsedHotKey {
  const parsed: ParsedHotKey = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    mod: false,
    key: null
  };

  const tokens = combo
    .toLowerCase()
    .split("+")
    .map((token) => token.trim())
    .filter(Boolean);

  tokens.forEach((token) => {
    if (token === "ctrl" || token === "control") {
      parsed.ctrl = true;
      return;
    }

    if (token === "shift") {
      parsed.shift = true;
      return;
    }

    if (token === "alt" || token === "option") {
      parsed.alt = true;
      return;
    }

    if (token === "meta" || token === "cmd" || token === "command") {
      parsed.meta = true;
      return;
    }

    if (token === "mod") {
      parsed.mod = true;
      return;
    }

    parsed.key = normalizeKey(token);
  });

  return parsed;
}

function matchHotKey(
  hotKey: ParsedHotKey,
  event: KeyboardEvent,
  exact: boolean
) {
  const eventKey = normalizeKey(event.key);

  if (hotKey.key && eventKey !== hotKey.key) {
    return false;
  }

  if (hotKey.ctrl && !event.ctrlKey) {
    return false;
  }

  if (hotKey.shift && !event.shiftKey) {
    return false;
  }

  if (hotKey.alt && !event.altKey) {
    return false;
  }

  if (hotKey.meta && !event.metaKey) {
    return false;
  }

  if (hotKey.mod && !(event.metaKey || event.ctrlKey)) {
    return false;
  }

  if (!exact) {
    return true;
  }

  const ctrlAllowed = hotKey.ctrl || hotKey.mod;
  const metaAllowed = hotKey.meta || hotKey.mod;

  if (!ctrlAllowed && event.ctrlKey) {
    return false;
  }

  if (!metaAllowed && event.metaKey) {
    return false;
  }

  if (!hotKey.shift && event.shiftKey) {
    return false;
  }

  if (!hotKey.alt && event.altKey) {
    return false;
  }

  return true;
}

export default function useHotKeys<
  T extends Window | Document | HTMLElement = Window
>(
  hotKeys: HotKey,
  callback: (event: KeyboardEvent) => void,
  options: UseHotKeysOptions<T> = {}
) {
  const {
    target,
    enabled = true,
    preventDefault = false,
    exact = true,
    eventName = "keydown"
  } = options;

  const callbackRef = useRef(callback);
  const parsedHotKeys = useMemo(
    () => (Array.isArray(hotKeys) ? hotKeys : [hotKeys]).map(parseHotKeyCombo),
    [hotKeys]
  );
  const targetElement = resolveTarget(target);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!targetElement || !enabled) {
      return;
    }

    const listener = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      const matched = parsedHotKeys.some((hotKey) =>
        matchHotKey(hotKey, keyboardEvent, exact)
      );

      if (!matched) {
        return;
      }

      if (preventDefault) {
        keyboardEvent.preventDefault();
      }

      callbackRef.current(keyboardEvent);
    };

    targetElement.addEventListener(eventName, listener);

    return () => {
      targetElement.removeEventListener(eventName, listener);
    };
  }, [enabled, eventName, exact, parsedHotKeys, preventDefault, targetElement]);
}
