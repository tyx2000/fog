import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useScroll from "../src/useScroll";

function setWindowScroll(x: number, y: number) {
  Object.defineProperty(window, "scrollX", {
    configurable: true,
    writable: true,
    value: x
  });
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    writable: true,
    value: y
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useScroll", () => {
  it("tracks window scroll by default", () => {
    setWindowScroll(10, 20);
    const { result } = renderHook(() => useScroll());
    expect(result.current.x).toBe(10);
    expect(result.current.y).toBe(20);

    act(() => {
      setWindowScroll(30, 40);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.x).toBe(30);
    expect(result.current.y).toBe(40);
  });

  it("supports explicit element target", () => {
    const target = document.createElement("div");
    target.scrollLeft = 5;
    target.scrollTop = 8;

    const { result } = renderHook(() =>
      useScroll<HTMLDivElement>({
        target
      })
    );

    expect(result.current.x).toBe(5);
    expect(result.current.y).toBe(8);

    act(() => {
      target.scrollLeft = 15;
      target.scrollTop = 18;
      target.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.x).toBe(15);
    expect(result.current.y).toBe(18);
  });

  it("supports ref target", () => {
    const target = document.createElement("div");
    target.scrollLeft = 1;
    target.scrollTop = 2;

    const { result } = renderHook(() =>
      useScroll<HTMLDivElement>({
        target: { current: target }
      })
    );

    expect(result.current.x).toBe(1);
    expect(result.current.y).toBe(2);
  });

  it("does not update when disabled", () => {
    setWindowScroll(0, 0);
    const { result } = renderHook(() =>
      useScroll({
        enabled: false
      })
    );

    act(() => {
      setWindowScroll(100, 200);
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.x).toBe(0);
    expect(result.current.y).toBe(0);
  });

  it("calls scrollTo on window target", () => {
    const scrollToSpy = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);

    const { result } = renderHook(() => useScroll());

    act(() => {
      result.current.scrollTo(50, 60);
    });

    expect(scrollToSpy).toHaveBeenCalledWith({
      left: 50,
      top: 60,
      behavior: "auto"
    });
  });
});
