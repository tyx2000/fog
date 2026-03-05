import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useHotKeys from "../src/useHotKeys";

describe("useHotKeys", () => {
  it("triggers callback for matching combo", () => {
    const callback = vi.fn();
    renderHook(() => useHotKeys("ctrl+k", callback));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true
        })
      );
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("supports hotkey arrays", () => {
    const callback = vi.fn();
    renderHook(() => useHotKeys(["ctrl+k", "meta+k"], callback));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true
        })
      );
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("supports preventDefault option", () => {
    const callback = vi.fn();
    renderHook(() =>
      useHotKeys("ctrl+s", callback, {
        preventDefault: true
      })
    );

    const event = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      cancelable: true
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("respects exact mode", () => {
    const callback = vi.fn();
    renderHook(() =>
      useHotKeys("ctrl+k", callback, {
        exact: true
      })
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          altKey: true
        })
      );
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("supports enabled false", () => {
    const callback = vi.fn();
    renderHook(() =>
      useHotKeys("ctrl+k", callback, {
        enabled: false
      })
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true
        })
      );
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it("always uses latest callback after rerender", () => {
    const first = vi.fn();
    const second = vi.fn();

    const { rerender } = renderHook(
      ({ callback }) => useHotKeys("ctrl+k", callback),
      {
        initialProps: {
          callback: first
        }
      }
    );

    rerender({ callback: second });

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true
        })
      );
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("supports keyup event name", () => {
    const callback = vi.fn();
    renderHook(() =>
      useHotKeys("ctrl+k", callback, {
        eventName: "keyup"
      })
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true
        })
      );
      window.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: "k",
          ctrlKey: true
        })
      );
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
