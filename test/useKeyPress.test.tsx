import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useKeyPress from "../src/useKeyPress";

describe("useKeyPress", () => {
  it("tracks key press and release for single key", () => {
    const { result } = renderHook(() => useKeyPress("a"));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    });
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));
    });
    expect(result.current).toBe(false);
  });

  it("supports key arrays", () => {
    const { result } = renderHook(() => useKeyPress(["Escape", "Enter"]));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "Escape" }));
    });
    expect(result.current).toBe(false);
  });

  it("supports predicate key filter", () => {
    const { result } = renderHook(() =>
      useKeyPress((event) => event.key === "k" && event.ctrlKey)
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true
        })
      );
    });
    expect(result.current).toBe(true);
  });

  it("supports preventDefault option", () => {
    renderHook(() =>
      useKeyPress("x", {
        preventDefault: true
      })
    );

    const event = new KeyboardEvent("keydown", {
      key: "x",
      cancelable: true
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
  });

  it("does not track when disabled", () => {
    const { result } = renderHook(() =>
      useKeyPress("a", {
        enabled: false
      })
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    });
    expect(result.current).toBe(false);
  });

  it("supports explicit target", () => {
    const target = document.createElement("div");
    const { result } = renderHook(() =>
      useKeyPress("a", {
        target
      })
    );

    act(() => {
      target.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    });
    expect(result.current).toBe(true);
  });
});
