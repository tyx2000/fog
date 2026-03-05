import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useMediaQuery from "../src/useMediaQuery";

type ChangeListener = (event: MediaQueryListEvent | MediaQueryList) => void;

interface MatchMediaEntry {
  listeners: Set<ChangeListener>;
  matches: boolean;
}

interface MatchMediaController {
  emit: (query: string, matches: boolean) => void;
  getListenerCount: (query: string) => number;
  matchMedia: (query: string) => MediaQueryList;
}

const originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(
  window,
  "matchMedia"
);

function createMatchMediaController(options?: {
  legacy?: boolean;
  matches?: Record<string, boolean>;
}): MatchMediaController {
  const legacy = options?.legacy ?? false;
  const initialMatches = options?.matches ?? {};
  const entries = new Map<string, MatchMediaEntry>();

  const getEntry = (query: string) => {
    const entry = entries.get(query);
    if (entry) {
      return entry;
    }

    const createdEntry: MatchMediaEntry = {
      listeners: new Set(),
      matches: initialMatches[query] ?? false
    };
    entries.set(query, createdEntry);
    return createdEntry;
  };

  const matchMedia = vi.fn((query: string) => {
    const entry = getEntry(query);
    const addListener = (listener: ChangeListener) => {
      entry.listeners.add(listener);
    };
    const removeListener = (listener: ChangeListener) => {
      entry.listeners.delete(listener);
    };

    const mediaQueryList = {
      media: query,
      onchange: null,
      get matches() {
        return entry.matches;
      },
      addEventListener: legacy
        ? undefined
        : (
          eventName: string,
          listener: EventListenerOrEventListenerObject
        ) => {
          if (eventName === "change") {
            addListener(listener as ChangeListener);
          }
        },
      removeEventListener: legacy
        ? undefined
        : (
          eventName: string,
          listener: EventListenerOrEventListenerObject
        ) => {
          if (eventName === "change") {
            removeListener(listener as ChangeListener);
          }
        },
      addListener,
      removeListener,
      dispatchEvent: () => true
    };

    return mediaQueryList as unknown as MediaQueryList;
  });

  return {
    matchMedia,
    emit: (query: string, matches: boolean) => {
      const entry = getEntry(query);
      entry.matches = matches;
      const event = {
        matches,
        media: query
      } as MediaQueryListEvent;

      entry.listeners.forEach((listener) => {
        listener(event);
      });
    },
    getListenerCount: (query: string) => getEntry(query).listeners.size
  };
}

function setMatchMedia(matchMedia?: (query: string) => MediaQueryList) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: matchMedia
  });
}

afterEach(() => {
  vi.restoreAllMocks();

  if (originalMatchMediaDescriptor) {
    Object.defineProperty(window, "matchMedia", originalMatchMediaDescriptor);
  } else {
    delete (window as { matchMedia?: unknown }).matchMedia;
  }
});

describe("useMediaQuery", () => {
  it("returns current match result on mount", () => {
    const controller = createMatchMediaController({
      matches: {
        "(min-width: 768px)": true
      }
    });
    setMatchMedia(controller.matchMedia);

    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 768px)")
    );

    expect(result.current).toBe(true);
  });

  it("updates when media query match value changes", () => {
    const controller = createMatchMediaController({
      matches: {
        "(prefers-reduced-motion: reduce)": false
      }
    });
    setMatchMedia(controller.matchMedia);

    const { result } = renderHook(() =>
      useMediaQuery("(prefers-reduced-motion: reduce)")
    );
    expect(result.current).toBe(false);

    act(() => {
      controller.emit("(prefers-reduced-motion: reduce)", true);
    });
    expect(result.current).toBe(true);
  });

  it("resubscribes when query changes and ignores previous query updates", () => {
    const oldQuery = "(min-width: 768px)";
    const newQuery = "(max-width: 767px)";
    const controller = createMatchMediaController({
      matches: {
        [oldQuery]: false,
        [newQuery]: false
      }
    });
    setMatchMedia(controller.matchMedia);

    const { result, rerender } = renderHook(
      ({ query }) => useMediaQuery(query),
      {
        initialProps: {
          query: oldQuery
        }
      }
    );

    expect(controller.getListenerCount(oldQuery)).toBe(1);

    rerender({
      query: newQuery
    });

    expect(controller.getListenerCount(oldQuery)).toBe(0);
    expect(controller.getListenerCount(newQuery)).toBe(1);

    act(() => {
      controller.emit(oldQuery, true);
    });
    expect(result.current).toBe(false);

    act(() => {
      controller.emit(newQuery, true);
    });
    expect(result.current).toBe(true);
  });

  it("uses defaultValue when matchMedia is unavailable", () => {
    setMatchMedia(undefined);

    const { result } = renderHook(() =>
      useMediaQuery("(min-width: 1024px)", {
        defaultValue: true
      })
    );

    expect(result.current).toBe(true);
  });

  it("supports initializeWithValue false", () => {
    const controller = createMatchMediaController({
      matches: {
        "(orientation: landscape)": true
      }
    });
    setMatchMedia(controller.matchMedia);

    const { result } = renderHook(() =>
      useMediaQuery("(orientation: landscape)", {
        defaultValue: false,
        initializeWithValue: false
      })
    );

    expect(controller.matchMedia).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(true);
  });

  it("cleans listener on unmount", () => {
    const query = "(prefers-color-scheme: dark)";
    const controller = createMatchMediaController({
      matches: {
        [query]: true
      }
    });
    setMatchMedia(controller.matchMedia);

    const { unmount } = renderHook(() => useMediaQuery(query));
    expect(controller.getListenerCount(query)).toBe(1);

    unmount();
    expect(controller.getListenerCount(query)).toBe(0);
  });

  it("supports legacy addListener/removeListener fallback", () => {
    const query = "(max-width: 480px)";
    const controller = createMatchMediaController({
      legacy: true,
      matches: {
        [query]: false
      }
    });
    setMatchMedia(controller.matchMedia);

    const { result } = renderHook(() => useMediaQuery(query));
    expect(result.current).toBe(false);

    act(() => {
      controller.emit(query, true);
    });
    expect(result.current).toBe(true);
  });
});
