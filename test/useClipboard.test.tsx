import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useClipboard from "../src/useClipboard";

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard"
);
const originalExecCommandDescriptor = Object.getOwnPropertyDescriptor(
  document,
  "execCommand"
);

function setClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined
  });
}

function setExecCommand(
  execCommand?: (commandId: string) => boolean
) {
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    value: execCommand
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();

  if (originalClipboardDescriptor) {
    Object.defineProperty(
      navigator,
      "clipboard",
      originalClipboardDescriptor
    );
  } else {
    delete (navigator as { clipboard?: unknown }).clipboard;
  }

  if (originalExecCommandDescriptor) {
    Object.defineProperty(
      document,
      "execCommand",
      originalExecCommandDescriptor
    );
  } else {
    delete (document as { execCommand?: unknown }).execCommand;
  }
});

describe("useClipboard", () => {
  it("copies text with navigator.clipboard and resets after timeout", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(async () => undefined);
    setClipboard(writeText);
    setExecCommand(undefined);

    const { result } = renderHook(() =>
      useClipboard({ timeout: 500 })
    );

    await act(async () => {
      const success = await result.current.copy("hello");
      expect(success).toBe(true);
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("hello");
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.copied).toBe(false);
  });

  it("sets error when navigator.clipboard copy fails", async () => {
    const copyError = new Error("copy failed");
    const writeText = vi.fn(async () => {
      throw copyError;
    });
    setClipboard(writeText);
    setExecCommand(undefined);

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      const success = await result.current.copy("text");
      expect(success).toBe(false);
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBe(copyError);
  });

  it("falls back to document.execCommand when clipboard api is unavailable", async () => {
    const execCommand = vi.fn(() => true);
    setClipboard(undefined);
    setExecCommand(execCommand);

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      const success = await result.current.copy("fallback");
      expect(success).toBe(true);
    });

    expect(execCommand).toHaveBeenCalledTimes(1);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeUndefined();
  });

  it("returns unsupported when clipboard and execCommand are both unavailable", async () => {
    setClipboard(undefined);
    setExecCommand(undefined);

    const { result } = renderHook(() => useClipboard());
    expect(result.current.isSupported).toBe(false);

    await act(async () => {
      const success = await result.current.copy("no-support");
      expect(success).toBe(false);
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("supports reset to clear copied and error state", async () => {
    const copyError = new Error("fail");
    setClipboard(async () => {
      throw copyError;
    });
    setExecCommand(undefined);

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy("data");
    });
    expect(result.current.error).toBe(copyError);

    act(() => {
      result.current.reset();
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it("does not auto reset copied state when timeout is zero", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(async () => undefined);
    setClipboard(writeText);
    setExecCommand(undefined);

    const { result } = renderHook(() =>
      useClipboard({ timeout: 0 })
    );

    await act(async () => {
      await result.current.copy("persist");
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(true);
  });

  it("triggers success and error callbacks", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const writeText = vi.fn(async (_text: string) => undefined);
    writeText.mockRejectedValueOnce(new Error("copy rejected"));
    setClipboard(writeText);
    setExecCommand(undefined);

    const { result } = renderHook(() =>
      useClipboard({
        onSuccess,
        onError
      })
    );

    await act(async () => {
      await result.current.copy("bad");
      await result.current.copy("ok");
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith("ok");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      "bad"
    );
  });
});
