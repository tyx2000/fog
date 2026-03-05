import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import usePrevious from "../src/usePrevious";

describe("usePrevious", () => {
  it("returns undefined on initial render by default", () => {
    const { result } = renderHook(() => usePrevious(1));

    expect(result.current).toBeUndefined();
  });

  it("returns provided initial value on initial render", () => {
    const { result } = renderHook(() => usePrevious(1, 0));

    expect(result.current).toBe(0);
  });

  it("returns previous value after rerender", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      {
        initialProps: {
          value: "a"
        }
      }
    );
    expect(result.current).toBeUndefined();

    rerender({ value: "ab" });
    expect(result.current).toBe("a");

    rerender({ value: "abc" });
    expect(result.current).toBe("ab");
  });

  it("tracks previous reference for objects", () => {
    const first = { id: 1 };
    const second = { id: 2 };

    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      {
        initialProps: {
          value: first
        }
      }
    );

    rerender({ value: second });
    expect(result.current).toBe(first);
  });

  it("returns same value as previous when value does not change between renders", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      {
        initialProps: {
          value: 5
        }
      }
    );

    rerender({ value: 5 });
    expect(result.current).toBe(5);
  });
});
