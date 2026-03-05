import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useSingleton from "../src/useSingleton";

describe("useSingleton", () => {
  it("initializes value once per component instance", () => {
    const factory = vi.fn(() => ({ id: Math.random() }));

    const { result, rerender } = renderHook(() => useSingleton(factory));
    const firstValue = result.current;

    rerender();
    rerender();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(firstValue);
  });

  it("does not recreate value when factory reference changes", () => {
    const firstFactory = vi.fn(() => ({ value: 1 }));
    const secondFactory = vi.fn(() => ({ value: 2 }));

    const { result, rerender } = renderHook(
      ({ factory }) => useSingleton(factory),
      {
        initialProps: {
          factory: firstFactory
        }
      }
    );
    const firstValue = result.current;

    rerender({
      factory: secondFactory
    });

    expect(firstFactory).toHaveBeenCalledTimes(1);
    expect(secondFactory).not.toHaveBeenCalled();
    expect(result.current).toBe(firstValue);
    expect(result.current.value).toBe(1);
  });

  it("creates independent singletons for separate hook instances", () => {
    const factory = vi.fn(() => ({ token: Symbol("singleton") }));

    const first = renderHook(() => useSingleton(factory));
    const second = renderHook(() => useSingleton(factory));

    expect(factory).toHaveBeenCalledTimes(2);
    expect(first.result.current).not.toBe(second.result.current);
  });

  it("runs factory again after unmount and remount", () => {
    const factory = vi.fn(() => ({ id: Math.random() }));

    const first = renderHook(() => useSingleton(factory));
    const firstValue = first.result.current;
    first.unmount();

    const second = renderHook(() => useSingleton(factory));
    const secondValue = second.result.current;

    expect(factory).toHaveBeenCalledTimes(2);
    expect(secondValue).not.toBe(firstValue);
  });

  it("supports undefined as singleton value", () => {
    const factory = vi.fn(() => undefined);
    const { result, rerender } = renderHook(() => useSingleton(factory));

    rerender();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(result.current).toBeUndefined();
  });
});
