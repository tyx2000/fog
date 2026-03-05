import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useUpdateEffect from "../src/useUpdateEffect";

describe("useUpdateEffect", () => {
  it("does not run effect on initial render", () => {
    const effect = vi.fn();

    renderHook(({ value }) => {
      useUpdateEffect(() => {
        effect(value);
      }, [value]);
    }, {
      initialProps: {
        value: 1
      }
    });

    expect(effect).not.toHaveBeenCalled();
  });

  it("runs effect on dependency updates", () => {
    const effect = vi.fn();
    const { rerender } = renderHook(({ value }) => {
      useUpdateEffect(() => {
        effect(value);
      }, [value]);
    }, {
      initialProps: {
        value: 1
      }
    });

    rerender({ value: 2 });
    rerender({ value: 3 });

    expect(effect).toHaveBeenCalledTimes(2);
    expect(effect).toHaveBeenNthCalledWith(1, 2);
    expect(effect).toHaveBeenNthCalledWith(2, 3);
  });

  it("handles cleanup across updates and unmount", () => {
    const cleanup = vi.fn();
    const { rerender, unmount } = renderHook(({ value }) => {
      useUpdateEffect(() => cleanup, [value]);
    }, {
      initialProps: {
        value: "a"
      }
    });

    rerender({ value: "b" });
    expect(cleanup).not.toHaveBeenCalled();

    rerender({ value: "c" });
    expect(cleanup).toHaveBeenCalledTimes(1);

    unmount();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
});
