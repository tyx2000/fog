import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useLocalStorage from "../src/useLocalStorage";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("useLocalStorage", () => {
  it("returns initial value when localStorage key does not exist", () => {
    const { result } = renderHook(() =>
      useLocalStorage<number>("count", 1)
    );

    expect(result.current[0]).toBe(1);
  });

  it("reads existing value from localStorage", () => {
    window.localStorage.setItem("count", JSON.stringify(5));

    const { result } = renderHook(() =>
      useLocalStorage<number>("count", 0)
    );

    expect(result.current[0]).toBe(5);
  });

  it("updates state and localStorage when setValue is called", () => {
    const { result } = renderHook(() =>
      useLocalStorage<number>("count", 0)
    );

    act(() => {
      const [, setValue] = result.current;
      setValue(8);
    });

    expect(result.current[0]).toBe(8);
    expect(window.localStorage.getItem("count")).toBe("8");
  });

  it("supports functional update with setValue", () => {
    const { result } = renderHook(() =>
      useLocalStorage<number>("count", 1)
    );

    act(() => {
      const [, setValue] = result.current;
      setValue((previous) => previous + 4);
    });

    expect(result.current[0]).toBe(5);
    expect(window.localStorage.getItem("count")).toBe("5");
  });

  it("removes value and resets to initial value", () => {
    window.localStorage.setItem("name", JSON.stringify("Alice"));
    const { result } = renderHook(() =>
      useLocalStorage<string>("name", "Guest")
    );
    expect(result.current[0]).toBe("Alice");

    act(() => {
      const [, , removeValue] = result.current;
      removeValue();
    });

    expect(result.current[0]).toBe("Guest");
    expect(window.localStorage.getItem("name")).toBeNull();
  });

  it("reads the new key value when key changes", async () => {
    window.localStorage.setItem("k1", JSON.stringify(11));
    window.localStorage.setItem("k2", JSON.stringify(22));

    const { result, rerender } = renderHook(
      ({ keyName }) => useLocalStorage<number>(keyName, 0),
      {
        initialProps: {
          keyName: "k1"
        }
      }
    );

    expect(result.current[0]).toBe(11);

    rerender({
      keyName: "k2"
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(22);
    });
  });

  it("supports custom serializer and deserializer", () => {
    window.localStorage.setItem("tags", "a|b");

    const { result } = renderHook(() =>
      useLocalStorage<string[]>("tags", [], {
        serializer: (value) => value.join("|"),
        deserializer: (value) => (value ? value.split("|") : [])
      })
    );

    expect(result.current[0]).toEqual(["a", "b"]);

    act(() => {
      const [, setValue] = result.current;
      setValue(["x", "y", "z"]);
    });

    expect(window.localStorage.getItem("tags")).toBe("x|y|z");
    expect(result.current[0]).toEqual(["x", "y", "z"]);
  });

  it("falls back to initial value when localStorage data is invalid", () => {
    window.localStorage.setItem("broken", "{not-json");

    const { result } = renderHook(() =>
      useLocalStorage<{ ok: boolean }>("broken", { ok: true })
    );

    expect(result.current[0]).toEqual({ ok: true });
  });

  it("syncs state across hook instances with same key", async () => {
    const first = renderHook(() =>
      useLocalStorage<number>("shared", 0)
    );
    const second = renderHook(() =>
      useLocalStorage<number>("shared", 0)
    );

    act(() => {
      const [, setValue] = first.result.current;
      setValue(42);
    });

    await waitFor(() => {
      expect(second.result.current[0]).toBe(42);
    });
  });

  it("updates value on native storage event", async () => {
    const { result } = renderHook(() =>
      useLocalStorage<number>("cross-tab", 0)
    );

    act(() => {
      window.localStorage.setItem("cross-tab", JSON.stringify(7));
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "cross-tab"
        })
      );
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(7);
    });
  });

  it("skips initial read when initializeWithValue is false", () => {
    window.localStorage.setItem("lazy", JSON.stringify(99));
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");

    renderHook(() =>
      useLocalStorage<number>("lazy", 0, {
        initializeWithValue: false
      })
    );

    expect(getItemSpy).toHaveBeenCalledTimes(1);
  });

  it("does not throw when localStorage write fails", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota exceeded");
      });

    const { result } = renderHook(() =>
      useLocalStorage<number>("count", 0)
    );

    act(() => {
      const [, setValue] = result.current;
      setValue(3);
    });

    expect(setItemSpy).toHaveBeenCalled();
    expect(result.current[0]).toBe(0);
  });
});
