import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useTimeout from "../src/useTimeout";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useTimeout", () => {
  it("starts automatically by default and fires callback", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useTimeout(callback, 200)
    );

    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(result.current.isActive).toBe(false);
  });

  it("does not auto start when autoStart is false", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useTimeout(callback, 100, {
        autoStart: false
      })
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(callback).not.toHaveBeenCalled();
    expect(result.current.isActive).toBe(false);

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(100);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("can clear active timeout", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useTimeout(callback, 300)
    );
    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.clear();
      vi.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();
    expect(result.current.isActive).toBe(false);
  });

  it("can reset timeout", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useTimeout(callback, 200, {
        autoStart: false
      })
    );

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(100);
      result.current.reset();
      vi.advanceTimersByTime(100);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("always uses latest callback", () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const second = vi.fn();

    const { result, rerender } = renderHook(
      ({ cb }) =>
        useTimeout(cb, 100, {
          autoStart: false
        }),
      {
        initialProps: {
          cb: first
        }
      }
    );

    rerender({ cb: second });

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(100);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("does not start when delay is null", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useTimeout(callback, null)
    );

    expect(result.current.isActive).toBe(false);

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(1000);
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it("stops when enabled becomes false", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ enabled }) =>
        useTimeout(callback, 200, {
          enabled
        }),
      {
        initialProps: {
          enabled: true
        }
      }
    );

    rerender({ enabled: false });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it("cleans timeout on unmount", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const { unmount } = renderHook(() =>
      useTimeout(callback, 300)
    );
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
