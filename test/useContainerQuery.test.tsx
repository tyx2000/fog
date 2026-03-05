import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useContainerQuery from "../src/useContainerQuery";

interface MockResizeObserverRecord {
  callback: ResizeObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  emit: (target: Element, width: number, height: number) => void;
}

const originalResizeObserver = globalThis.ResizeObserver;
const records: MockResizeObserverRecord[] = [];

function latestRecord() {
  const record = records[records.length - 1];
  if (!record) {
    throw new Error("No ResizeObserver record found");
  }

  return record;
}

function createTarget(initialWidth: number, initialHeight: number) {
  const target = document.createElement("div");
  let width = initialWidth;
  let height = initialHeight;

  target.getBoundingClientRect = () => ({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({})
  } as DOMRect);

  return {
    target,
    setSize(nextWidth: number, nextHeight: number) {
      width = nextWidth;
      height = nextHeight;
    }
  };
}

function setupResizeObserverMock() {
  class MockResizeObserver implements ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      const record: MockResizeObserverRecord = {
        callback,
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        emit: (target, width, height) => {
          const entry = {
            target,
            contentRect: {
              width,
              height,
              top: 0,
              left: 0,
              right: width,
              bottom: height,
              x: 0,
              y: 0,
              toJSON: () => ({})
            },
            contentBoxSize: [
              {
                inlineSize: width,
                blockSize: height
              }
            ],
            borderBoxSize: [],
            devicePixelContentBoxSize: []
          } as unknown as ResizeObserverEntry;

          callback([entry], this);
        }
      };

      records.push(record);

      this.observe = record.observe;
      this.unobserve = record.unobserve;
      this.disconnect = record.disconnect;
    }

    observe: (target: Element, options?: ResizeObserverOptions) => void;
    unobserve: (target: Element) => void;
    disconnect: () => void;
  }

  globalThis.ResizeObserver = MockResizeObserver;
}

beforeEach(() => {
  records.length = 0;
  setupResizeObserverMock();
});

afterEach(() => {
  records.length = 0;
  vi.restoreAllMocks();

  if (originalResizeObserver) {
    globalThis.ResizeObserver = originalResizeObserver;
  } else {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  }
});

describe("useContainerQuery", () => {
  it("updates matches and size for object query", () => {
    const { target } = createTarget(200, 100);
    const { result } = renderHook(() =>
      useContainerQuery({ minWidth: 300 })
    );

    act(() => {
      result.current.ref(target);
    });

    expect(result.current.matches).toBe(false);
    expect(result.current.size).toEqual({ width: 200, height: 100 });

    act(() => {
      latestRecord().emit(target, 320, 120);
    });

    expect(result.current.matches).toBe(true);
    expect(result.current.size).toEqual({ width: 320, height: 120 });
    expect(result.current.entry?.target).toBe(target);
  });

  it("supports min/max width and height constraints", () => {
    const { target } = createTarget(150, 100);
    const { result } = renderHook(() =>
      useContainerQuery({
        minWidth: 100,
        maxWidth: 200,
        minHeight: 80,
        maxHeight: 120
      })
    );

    act(() => {
      result.current.ref(target);
    });
    expect(result.current.matches).toBe(true);

    act(() => {
      latestRecord().emit(target, 220, 100);
    });
    expect(result.current.matches).toBe(false);
  });

  it("supports predicate query", () => {
    const { target } = createTarget(100, 50);
    const { result } = renderHook(() =>
      useContainerQuery((size) => size.width / size.height > 2)
    );

    act(() => {
      result.current.ref(target);
    });
    expect(result.current.matches).toBe(false);

    act(() => {
      latestRecord().emit(target, 240, 100);
    });
    expect(result.current.matches).toBe(true);
  });

  it("calls onChange with latest values", () => {
    const onChange = vi.fn();
    const { target } = createTarget(120, 100);
    const { result } = renderHook(() =>
      useContainerQuery(
        { minWidth: 160 },
        { onChange }
      )
    );

    act(() => {
      result.current.ref(target);
    });
    expect(onChange).toHaveBeenCalledWith(
      false,
      { width: 120, height: 100 },
      null
    );

    act(() => {
      latestRecord().emit(target, 200, 100);
    });
    expect(onChange).toHaveBeenLastCalledWith(
      true,
      { width: 200, height: 100 },
      expect.objectContaining({
        target
      })
    );
  });

  it("passes box option to observer.observe", () => {
    const { target } = createTarget(100, 100);
    const { result } = renderHook(() =>
      useContainerQuery(
        { minWidth: 1 },
        { box: "border-box" }
      )
    );

    act(() => {
      result.current.ref(target);
    });

    expect(records[0]?.observe).toHaveBeenCalledWith(target, {
      box: "border-box"
    });
  });

  it("re-evaluates when query changes", async () => {
    const targetInstance = createTarget(250, 120);
    const { result, rerender } = renderHook(
      ({ minWidth }) =>
        useContainerQuery({
          minWidth
        }),
      {
        initialProps: {
          minWidth: 200
        }
      }
    );

    act(() => {
      result.current.ref(targetInstance.target);
    });
    expect(result.current.matches).toBe(true);

    targetInstance.setSize(250, 120);
    rerender({ minWidth: 300 });

    await waitFor(() => {
      expect(result.current.matches).toBe(false);
    });
  });

  it("disconnects observer on unmount", () => {
    const { target } = createTarget(120, 80);
    const { result, unmount } = renderHook(() =>
      useContainerQuery({ minWidth: 100 })
    );

    act(() => {
      result.current.ref(target);
    });

    unmount();
    expect(records[0]?.disconnect).toHaveBeenCalledTimes(1);
  });

  it("still evaluates with element size when ResizeObserver is unavailable", () => {
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    const { target } = createTarget(300, 100);
    const { result } = renderHook(() =>
      useContainerQuery({ minWidth: 280 })
    );

    act(() => {
      result.current.ref(target);
    });

    expect(result.current.matches).toBe(true);
    expect(result.current.size).toEqual({ width: 300, height: 100 });
    expect(result.current.entry).toBeNull();
  });
});
