import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useEventListener from "../src/useEventListener";

describe("useEventListener", () => {
  it("listens on window by default", () => {
    const handler = vi.fn();
    renderHook(() => useEventListener("click", handler));

    act(() => {
      window.dispatchEvent(new MouseEvent("click"));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("supports explicit event target", () => {
    const target = document.createElement("button");
    const handler = vi.fn();

    renderHook(() =>
      useEventListener<MouseEvent, HTMLButtonElement>("click", handler, {
        target
      })
    );

    act(() => {
      target.dispatchEvent(new MouseEvent("click"));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("supports ref-style target", () => {
    const target = document.createElement("div");
    const targetRef = {
      current: target
    };
    const handler = vi.fn();

    renderHook(() =>
      useEventListener<MouseEvent, HTMLDivElement>("click", handler, {
        target: targetRef
      })
    );

    act(() => {
      target.dispatchEvent(new MouseEvent("click"));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not listen when enabled is false", () => {
    const handler = vi.fn();
    renderHook(() =>
      useEventListener("click", handler, {
        enabled: false
      })
    );

    act(() => {
      window.dispatchEvent(new MouseEvent("click"));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("uses latest handler after rerender", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ handler }) => useEventListener("click", handler),
      {
        initialProps: {
          handler: first
        }
      }
    );

    rerender({ handler: second });

    act(() => {
      window.dispatchEvent(new MouseEvent("click"));
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("rebinds when event name changes", () => {
    const handler = vi.fn();
    const { rerender } = renderHook(
      ({ eventName }) => useEventListener(eventName, handler),
      {
        initialProps: {
          eventName: "click"
        }
      }
    );

    rerender({ eventName: "mousedown" });

    act(() => {
      window.dispatchEvent(new MouseEvent("click"));
      window.dispatchEvent(new MouseEvent("mousedown"));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("removes listener on unmount", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() =>
      useEventListener("click", handler)
    );

    unmount();

    act(() => {
      window.dispatchEvent(new MouseEvent("click"));
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
