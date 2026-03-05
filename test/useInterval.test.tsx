import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useInterval from "../src/useInterval";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useInterval", () => {
  it("starts automatically by default and calls callback on each interval", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useInterval(callback, 100)
    );

    expect(result.current.isActive).toBe(true);

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("does not auto start when autoStart is false", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useInterval(callback, 100, {
        autoStart: false
      })
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(callback).not.toHaveBeenCalled();
    expect(result.current.isActive).toBe(false);

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledTimes(3);
    expect(result.current.isActive).toBe(true);
  });

  it("supports immediate option", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    renderHook(() =>
      useInterval(callback, 100, {
        immediate: true
      })
    );

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("can clear active interval", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useInterval(callback, 100)
    );

    act(() => {
      vi.advanceTimersByTime(220);
      result.current.clear();
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(2);
    expect(result.current.isActive).toBe(false);
  });

  it("can reset interval", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useInterval(callback, 100, {
        autoStart: false
      })
    );

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(150);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.reset();
      vi.advanceTimersByTime(90);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("always uses latest callback", () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(
      ({ cb }) =>
        useInterval(cb, 100, {
          autoStart: true
        }),
      {
        initialProps: {
          cb: first
        }
      }
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(first).toHaveBeenCalledTimes(1);

    rerender({ cb: second });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });

  it("does not start when delay is null", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useInterval(callback, null)
    );

    expect(result.current.isActive).toBe(false);

    act(() => {
      result.current.start();
      vi.advanceTimersByTime(500);
    });
    expect(callback).not.toHaveBeenCalled();
  });

  it("stops when enabled becomes false", () => {
    vi.useFakeTimers();
    const callback = vi.fn();

    const { rerender } = renderHook(
      ({ enabled }) =>
        useInterval(callback, 100, {
          enabled
        }),
      {
        initialProps: {
          enabled: true
        }
      }
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("cleans interval on unmount", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    const { unmount } = renderHook(() =>
      useInterval(callback, 100)
    );
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
