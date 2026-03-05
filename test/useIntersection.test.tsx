import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useIntersection from "../src/useIntersection";

interface MockObserverEntry {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observed: Set<Element>;
  disconnected: boolean;
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  emit: (entry: { target?: Element; isIntersecting: boolean }) => void;
}

const originalIntersectionObserver = globalThis.IntersectionObserver;
const observerEntries: MockObserverEntry[] = [];

function createIntersectionObserverMock() {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null;
    readonly rootMargin: string;
    readonly thresholds: ReadonlyArray<number>;

    private readonly entry: MockObserverEntry;

    constructor(
      callback: IntersectionObserverCallback,
      options: IntersectionObserverInit = {}
    ) {
      this.root = options.root ?? null;
      this.rootMargin = options.rootMargin ?? "";
      this.thresholds = Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold ?? 0];

      const observed = new Set<Element>();
      const entry: MockObserverEntry = {
        callback,
        options,
        observed,
        disconnected: false,
        observe: vi.fn((target: Element) => {
          observed.add(target);
        }),
        unobserve: vi.fn((target: Element) => {
          observed.delete(target);
        }),
        disconnect: vi.fn(() => {
          entry.disconnected = true;
          observed.clear();
        }),
        emit: ({ target, isIntersecting }) => {
          if (entry.disconnected) {
            return;
          }

          const resolvedTarget = target ?? observed.values().next().value;
          if (!resolvedTarget) {
            return;
          }

          const observerEntry = {
            time: Date.now(),
            target: resolvedTarget,
            rootBounds: null,
            boundingClientRect: resolvedTarget.getBoundingClientRect(),
            intersectionRect: resolvedTarget.getBoundingClientRect(),
            isIntersecting,
            intersectionRatio: isIntersecting ? 1 : 0
          } as IntersectionObserverEntry;

          callback([observerEntry], this);
        }
      };

      this.entry = entry;
      observerEntries.push(entry);
    }

    observe(target: Element) {
      this.entry.observe(target);
    }

    unobserve(target: Element) {
      this.entry.unobserve(target);
    }

    disconnect() {
      this.entry.disconnect();
    }

    takeRecords() {
      return [];
    }
  }

  globalThis.IntersectionObserver = MockIntersectionObserver;
}

beforeEach(() => {
  observerEntries.length = 0;
  createIntersectionObserverMock();
});

afterEach(() => {
  vi.restoreAllMocks();
  observerEntries.length = 0;

  if (originalIntersectionObserver) {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  } else {
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
  }
});

describe("useIntersection", () => {
  it("observes target and updates intersection state", () => {
    const { result } = renderHook(() => useIntersection<HTMLDivElement>());
    const target = document.createElement("div");

    act(() => {
      result.current.ref(target);
    });

    expect(observerEntries).toHaveLength(1);
    expect(observerEntries[0]?.observe).toHaveBeenCalledWith(target);
    expect(result.current.isIntersecting).toBe(false);

    act(() => {
      observerEntries[0]?.emit({
        target,
        isIntersecting: true
      });
    });

    expect(result.current.isIntersecting).toBe(true);
    expect(result.current.entry?.target).toBe(target);
  });

  it("passes options to IntersectionObserver", () => {
    const root = document.createElement("section");
    const { result } = renderHook(() =>
      useIntersection<HTMLDivElement>({
        root,
        rootMargin: "12px",
        threshold: [0, 0.5, 1]
      })
    );

    const target = document.createElement("div");

    act(() => {
      result.current.ref(target);
    });

    expect(observerEntries[0]?.options).toEqual({
      root,
      rootMargin: "12px",
      threshold: [0, 0.5, 1]
    });
  });

  it("calls onChange callback with observer entry", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useIntersection<HTMLDivElement>({
        onChange
      })
    );
    const target = document.createElement("div");

    act(() => {
      result.current.ref(target);
    });

    expect(observerEntries).toHaveLength(1);

    act(() => {
      observerEntries[0]?.emit({
        target,
        isIntersecting: true
      });
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target,
        isIntersecting: true
      })
    );
  });

  it("supports initialIsIntersecting option", () => {
    const { result } = renderHook(() =>
      useIntersection<HTMLDivElement>({
        initialIsIntersecting: true
      })
    );

    expect(result.current.isIntersecting).toBe(true);
  });

  it("freezes observation after first visible when freezeOnceVisible is true", async () => {
    const { result } = renderHook(() =>
      useIntersection<HTMLDivElement>({
        freezeOnceVisible: true
      })
    );
    const target = document.createElement("div");

    act(() => {
      result.current.ref(target);
    });

    expect(observerEntries).toHaveLength(1);

    act(() => {
      observerEntries[0]?.emit({
        target,
        isIntersecting: true
      });
    });

    await waitFor(() => {
      expect(result.current.isIntersecting).toBe(true);
    });
    await waitFor(() => {
      expect(observerEntries[0]?.disconnect).toHaveBeenCalledTimes(1);
    });

    act(() => {
      observerEntries[0]?.emit({
        target,
        isIntersecting: false
      });
    });

    expect(result.current.isIntersecting).toBe(true);
  });

  it("disconnects observer on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useIntersection<HTMLDivElement>()
    );
    const target = document.createElement("div");

    act(() => {
      result.current.ref(target);
    });

    unmount();
    expect(observerEntries[0]?.disconnect).toHaveBeenCalledTimes(1);
  });

  it("works safely when IntersectionObserver is unavailable", () => {
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;

    const { result } = renderHook(() =>
      useIntersection<HTMLDivElement>({
        initialIsIntersecting: false
      })
    );
    const target = document.createElement("div");

    act(() => {
      result.current.ref(target);
    });

    expect(result.current.isIntersecting).toBe(false);
    expect(result.current.entry).toBeNull();
    expect(observerEntries).toHaveLength(0);
  });
});
