import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useRequest from "../src/useRequest";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

describe("useRequest", () => {
  it("runs automatically on mount when manual is false", async () => {
    const service = vi.fn(async (id: number) => `value-${id}`);
    const { result } = renderHook(() =>
      useRequest(service, {
        defaultParams: [1]
      })
    );

    expect(service).toHaveBeenCalledTimes(1);
    expect(service).toHaveBeenCalledWith(1);
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe("value-1");
    expect(result.current.params).toEqual([1]);
  });

  it("supports manual mode and run", async () => {
    const deferred = createDeferred<number>();
    const service = vi.fn(() => deferred.promise);
    const { result } = renderHook(() =>
      useRequest<number, [number]>(service, {
        manual: true,
        initialData: 0
      })
    );

    expect(service).not.toHaveBeenCalled();
    expect(result.current.data).toBe(0);

    let promise: Promise<number>;
    act(() => {
      promise = result.current.run(2);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.params).toEqual([2]);

    act(() => {
      deferred.resolve(20);
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(20);
  });

  it("triggers success and finally callbacks", async () => {
    const service = vi.fn(async (text: string) => text.toUpperCase());
    const onSuccess = vi.fn();
    const onFinally = vi.fn();

    const { result } = renderHook(() =>
      useRequest<string, [string]>(service, {
        manual: true,
        onSuccess,
        onFinally
      })
    );

    await act(async () => {
      await result.current.run("react");
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("REACT", ["react"]);
    expect(onFinally).toHaveBeenCalledTimes(1);
    expect(onFinally).toHaveBeenCalledWith(["react"], "REACT");
  });

  it("handles errors and triggers error callbacks", async () => {
    const requestError = new Error("network failed");
    const service = vi.fn(async () => {
      throw requestError;
    });
    const onError = vi.fn();
    const onFinally = vi.fn();

    const { result } = renderHook(() =>
      useRequest<string, []>(service, {
        manual: true,
        onError,
        onFinally
      })
    );

    await act(async () => {
      await expect(result.current.run()).rejects.toBe(requestError);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(requestError);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(requestError, []);
    expect(onFinally).toHaveBeenCalledTimes(1);
    expect(onFinally).toHaveBeenCalledWith([], undefined, requestError);
  });

  it("refreshes with default params and latest params", async () => {
    const service = vi.fn(async (id: number) => id * 10);
    const { result } = renderHook(() =>
      useRequest<number, [number]>(service, {
        manual: true,
        defaultParams: [3]
      })
    );

    await act(async () => {
      await result.current.refresh();
    });
    expect(service).toHaveBeenNthCalledWith(1, 3);

    await act(async () => {
      await result.current.run(7);
    });

    await act(async () => {
      await result.current.refresh();
    });
    expect(service).toHaveBeenNthCalledWith(3, 7);
  });

  it("keeps only latest request result when concurrent requests resolve out of order", async () => {
    const first = createDeferred<string>();
    const second = createDeferred<string>();
    const service = vi.fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = renderHook(() =>
      useRequest<string, [number]>(service, {
        manual: true
      })
    );

    act(() => {
      void result.current.run(1);
      void result.current.run(2);
    });

    act(() => {
      second.resolve("second-result");
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe("second-result");
    });

    act(() => {
      first.resolve("first-result");
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data).toBe("second-result");
    expect(result.current.params).toEqual([2]);
  });

  it("cancels pending request updates", async () => {
    const deferred = createDeferred<string>();
    const service = vi.fn(() => deferred.promise);
    const onSuccess = vi.fn();
    const onFinally = vi.fn();

    const { result } = renderHook(() =>
      useRequest<string, []>(service, {
        manual: true,
        onSuccess,
        onFinally
      })
    );

    act(() => {
      void result.current.run();
    });
    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.cancel();
    });
    expect(result.current.loading).toBe(false);

    act(() => {
      deferred.resolve("done");
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.data).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFinally).not.toHaveBeenCalled();
  });

  it("supports mutate with value and updater function", () => {
    const service = vi.fn(async () => 1);
    const { result } = renderHook(() =>
      useRequest<number, []>(service, {
        manual: true,
        initialData: 5
      })
    );

    act(() => {
      result.current.mutate(8);
    });
    expect(result.current.data).toBe(8);

    act(() => {
      result.current.mutate((previousData) => (previousData ?? 0) + 2);
    });
    expect(result.current.data).toBe(10);
  });
});
