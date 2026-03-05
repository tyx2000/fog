import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import useScrollLock from "../src/useScrollLock";

const originalBodyOverflow = document.body.style.overflow;

afterEach(() => {
  document.body.style.overflow = originalBodyOverflow;
});

describe("useScrollLock", () => {
  it("locks and unlocks body scroll", () => {
    document.body.style.overflow = "auto";
    const { result } = renderHook(() => useScrollLock());

    act(() => {
      result.current.lock();
    });

    expect(result.current.isLocked).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      result.current.unlock();
    });

    expect(result.current.isLocked).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("supports auto lock", () => {
    document.body.style.overflow = "scroll";
    const { result, unmount } = renderHook(() =>
      useScrollLock({
        autoLock: true
      })
    );

    expect(result.current.isLocked).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });

  it("supports custom target element", () => {
    const target = document.createElement("div");
    target.style.overflow = "auto";

    const { result } = renderHook(() =>
      useScrollLock<HTMLDivElement>({
        target
      })
    );

    act(() => {
      result.current.lock();
    });
    expect(target.style.overflow).toBe("hidden");

    act(() => {
      result.current.unlock();
    });
    expect(target.style.overflow).toBe("auto");
  });

  it("lock and unlock are idempotent", () => {
    document.body.style.overflow = "visible";
    const { result } = renderHook(() => useScrollLock());

    act(() => {
      result.current.lock();
      result.current.lock();
    });
    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      result.current.unlock();
      result.current.unlock();
    });
    expect(document.body.style.overflow).toBe("visible");
  });
});
