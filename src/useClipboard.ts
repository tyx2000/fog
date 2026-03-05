import { useCallback, useEffect, useRef, useState } from "react";

export interface UseClipboardOptions {
  timeout?: number;
  onSuccess?: (text: string) => void;
  onError?: (error: unknown, text: string) => void;
}

export interface UseClipboardResult {
  copied: boolean;
  error: unknown;
  isSupported: boolean;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

function canUseNavigatorClipboard() {
  return typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.writeText === "function";
}

function canUseExecCommand() {
  return typeof document !== "undefined" &&
    typeof document.execCommand === "function";
}

function copyByExecCommand(text: string) {
  if (typeof document === "undefined" || !document.body) {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  let success = false;

  try {
    success = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }

  return success;
}

export default function useClipboard(
  options: UseClipboardOptions = {}
): UseClipboardResult {
  const {
    timeout = 1500,
    onSuccess,
    onError
  } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setCopied(false);
    setError(undefined);
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const copy = useCallback(async (text: string) => {
    clearTimer();
    setError(undefined);

    try {
      if (canUseNavigatorClipboard()) {
        await navigator.clipboard.writeText(text);
      } else if (canUseExecCommand()) {
        const success = copyByExecCommand(text);
        if (!success) {
          throw new Error("document.execCommand copy failed");
        }
      } else {
        throw new Error("Clipboard is not supported in this environment");
      }

      setCopied(true);

      if (timeout > 0) {
        timerRef.current = setTimeout(() => {
          setCopied(false);
        }, timeout);
      }

      onSuccessRef.current?.(text);
      return true;
    } catch (caughtError) {
      setCopied(false);
      setError(caughtError);
      onErrorRef.current?.(caughtError, text);
      return false;
    }
  }, [clearTimer, timeout]);

  return {
    copied,
    error,
    isSupported: canUseNavigatorClipboard() || canUseExecCommand(),
    copy,
    reset
  };
}
