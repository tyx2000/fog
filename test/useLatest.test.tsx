import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useLatest from "../src/useLatest";

describe("useLatest", () => {
  it("returns a ref with the initial value", () => {
    const { result } = renderHook(() => useLatest(1));

    expect(result.current.current).toBe(1);
  });

  it("keeps ref object identity stable across rerenders", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useLatest(value),
      {
        initialProps: {
          value: "a"
        }
      }
    );

    const firstRef = result.current;
    rerender({ value: "b" });

    expect(result.current).toBe(firstRef);
  });

  it("always updates ref.current to latest value", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useLatest(value),
      {
        initialProps: {
          value: { count: 1 }
        }
      }
    );

    const next = { count: 2 };
    rerender({ value: next });

    expect(result.current.current).toBe(next);
  });

  it("works with function values", () => {
    const firstFn = vi.fn(() => "first");
    const secondFn = vi.fn(() => "second");

    const { result, rerender } = renderHook(
      ({ fn }) => useLatest(fn),
      {
        initialProps: {
          fn: firstFn
        }
      }
    );

    rerender({ fn: secondFn });
    expect(result.current.current).toBe(secondFn);
    expect(result.current.current()).toBe("second");
  });
});
