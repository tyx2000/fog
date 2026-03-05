import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useThrottle from "../src/useThrottle";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useThrottle", () => {
  it("returns initial input immediately", () => {
    const { result } = renderHook(() =>
      useThrottle("a", 300)
    );

    expect(result.current.value).toBe("a");
    expect(result.current.isPending).toBe(false);
  });

  it("updates immediately on first change and throttles following changes by default", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 300),
      {
        initialProps: {
          value: "a"
        }
      }
    );

    rerender({ value: "ab" });
    expect(result.current.value).toBe("ab");
    expect(result.current.isPending).toBe(false);

    rerender({ value: "abc" });
    expect(result.current.value).toBe("ab");
    expect(result.current.isPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.value).toBe("abc");
    expect(result.current.isPending).toBe(false);
  });

  it("keeps only latest trailing value during rapid changes", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 300),
      {
        initialProps: {
          value: 0
        }
      }
    );

    rerender({ value: 1 });
    rerender({ value: 2 });
    rerender({ value: 3 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.value).toBe(3);
    expect(result.current.isPending).toBe(false);
  });

  it("supports leading false mode", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) =>
        useThrottle(value, 200, {
          leading: false,
          trailing: true
        }),
      {
        initialProps: {
          value: "x"
        }
      }
    );

    rerender({ value: "xy" });
    expect(result.current.value).toBe("x");
    expect(result.current.isPending).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.value).toBe("xy");
    expect(result.current.isPending).toBe(false);
  });

  it("supports trailing false mode", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) =>
        useThrottle(value, 200, {
          leading: true,
          trailing: false
        }),
      {
        initialProps: {
          value: "a"
        }
      }
    );

    rerender({ value: "ab" });
    expect(result.current.value).toBe("ab");

    rerender({ value: "abc" });
    expect(result.current.value).toBe("ab");
    expect(result.current.isPending).toBe(false);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.value).toBe("ab");
  });

  it("cancels pending trailing update", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 300),
      {
        initialProps: {
          value: "a"
        }
      }
    );

    rerender({ value: "ab" });
    rerender({ value: "abc" });
    expect(result.current.isPending).toBe(true);

    act(() => {
      result.current.cancel();
      vi.advanceTimersByTime(300);
    });

    expect(result.current.value).toBe("ab");
    expect(result.current.isPending).toBe(false);
  });

  it("flushes pending value immediately", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 300),
      {
        initialProps: {
          value: "a"
        }
      }
    );

    rerender({ value: "ab" });
    rerender({ value: "abc" });

    act(() => {
      result.current.flush();
    });

    expect(result.current.value).toBe("abc");
    expect(result.current.isPending).toBe(false);
  });

  it("updates immediately when delay is zero or negative", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useThrottle(value, delay),
      {
        initialProps: {
          value: 1,
          delay: 0
        }
      }
    );

    rerender({ value: 2, delay: 0 });
    expect(result.current.value).toBe(2);

    rerender({ value: 3, delay: -1 });
    expect(result.current.value).toBe(3);
    expect(result.current.isPending).toBe(false);
  });

  it("supports custom equalityFn", () => {
    vi.useFakeTimers();

    const equalityFn = vi.fn(
      (prev: { id: number; label: string }, next: { id: number; label: string }) =>
        prev.id === next.id
    );

    const { result, rerender } = renderHook(
      ({ value }) =>
        useThrottle(value, 200, {
          equalityFn
        }),
      {
        initialProps: {
          value: { id: 1, label: "a" }
        }
      }
    );

    rerender({ value: { id: 1, label: "b" } });
    expect(result.current.value).toEqual({ id: 1, label: "a" });

    rerender({ value: { id: 2, label: "b" } });
    expect(result.current.value).toEqual({ id: 2, label: "b" });
    expect(equalityFn).toHaveBeenCalled();
  });

  it("clears timeout on unmount", () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const { rerender, unmount } = renderHook(
      ({ value }) => useThrottle(value, 300),
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
