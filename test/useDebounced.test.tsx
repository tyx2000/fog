import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useDebounced from "../src/useDebounced";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useDebounced", () => {
  it("returns initial input immediately", () => {
    const { result } = renderHook(() =>
      useDebounced("react", 300)
    );

    expect(result.current.value).toBe("react");
    expect(result.current.isPending).toBe(false);
  });

  it("updates value after delay", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useDebounced(value, 500),
      {
        initialProps: {
          value: "a"
        }
      }
    );

    rerender({ value: "ab" });
    expect(result.current.value).toBe("a");
    expect(result.current.isPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current.value).toBe("a");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.value).toBe("ab");
    expect(result.current.isPending).toBe(false);
  });

  it("keeps only latest input when changes are rapid", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useDebounced(value, 300),
      {
        initialProps: {
          value: "h"
        }
      }
    );

    rerender({ value: "he" });
    rerender({ value: "hel" });
    rerender({ value: "hell" });
    rerender({ value: "hello" });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.value).toBe("hello");
    expect(result.current.isPending).toBe(false);
  });

  it("cancels pending update", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useDebounced(value, 400),
      {
        initialProps: {
          value: 1
        }
      }
    );

    rerender({ value: 2 });
    expect(result.current.isPending).toBe(true);

    act(() => {
      result.current.cancel();
      vi.advanceTimersByTime(400);
    });

    expect(result.current.value).toBe(1);
    expect(result.current.isPending).toBe(false);
  });

  it("flushes pending update immediately", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useDebounced(value, 500),
      {
        initialProps: {
          value: "x"
        }
      }
    );

    rerender({ value: "xy" });
    expect(result.current.value).toBe("x");

    act(() => {
      result.current.flush();
    });

    expect(result.current.value).toBe("xy");
    expect(result.current.isPending).toBe(false);
  });

  it("supports custom equalityFn", () => {
    vi.useFakeTimers();

    const equalityFn = vi.fn(
      (previous: { id: number; name: string }, next: { id: number; name: string }) =>
        previous.id === next.id
    );

    const { result, rerender } = renderHook(
      ({ value }) =>
        useDebounced(value, 200, {
          equalityFn
        }),
      {
        initialProps: {
          value: { id: 1, name: "A" }
        }
      }
    );

    rerender({ value: { id: 1, name: "B" } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.value).toEqual({ id: 1, name: "A" });

    rerender({ value: { id: 2, name: "B" } });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.value).toEqual({ id: 2, name: "B" });
    expect(equalityFn).toHaveBeenCalled();
  });

  it("updates immediately when delay is zero or negative", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounced(value, delay),
      {
        initialProps: {
          value: 10,
          delay: 0
        }
      }
    );

    rerender({ value: 20, delay: 0 });
    expect(result.current.value).toBe(20);
    expect(result.current.isPending).toBe(false);

    rerender({ value: 30, delay: -1 });
    expect(result.current.value).toBe(30);
    expect(result.current.isPending).toBe(false);
  });

  it("clears timeout on unmount", () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const { rerender, unmount } = renderHook(
      ({ value }) => useDebounced(value, 300),
      {
        initialProps: {
          value: "a"
        }
      }
    );

    rerender({ value: "ab" });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
