import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

const IS_SERVER = typeof window === "undefined";
const LOCAL_STORAGE_EVENT = "local-storage";

type InitialValue<T> = T | (() => T);

export interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  initializeWithValue?: boolean;
}

export type UseLocalStorageReturn<T> = [
  T,
  Dispatch<SetStateAction<T>>,
  () => void
];

function evaluateInitialValue<T>(initialValue: InitialValue<T>) {
  return initialValue instanceof Function ? initialValue() : initialValue;
}

function dispatchLocalStorageEvent(key: string) {
  if (IS_SERVER) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<{ key: string }>(LOCAL_STORAGE_EVENT, {
      detail: { key }
    })
  );
}

function isStorageEvent(event: Event): event is StorageEvent {
  return typeof StorageEvent !== "undefined" && event instanceof StorageEvent;
}

export default function useLocalStorage<T>(
  key: string,
  initialValue: InitialValue<T>,
  options: UseLocalStorageOptions<T> = {}
): UseLocalStorageReturn<T> {
  const {
    serializer,
    deserializer,
    initializeWithValue = true
  } = options;

  const serialize = useCallback((value: T) => {
    if (serializer) {
      return serializer(value);
    }

    return JSON.stringify(value);
  }, [serializer]);

  const deserialize = useCallback((value: string) => {
    if (deserializer) {
      return deserializer(value);
    }

    return JSON.parse(value) as T;
  }, [deserializer]);

  const readValue = useCallback((): T => {
    const resolvedInitialValue = evaluateInitialValue(initialValue);

    if (IS_SERVER) {
      return resolvedInitialValue;
    }

    try {
      const rawValue = window.localStorage.getItem(key);
      if (rawValue === null) {
        return resolvedInitialValue;
      }

      return deserialize(rawValue);
    } catch {
      return resolvedInitialValue;
    }
  }, [initialValue, key, deserialize]);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!initializeWithValue) {
      return evaluateInitialValue(initialValue);
    }

    return readValue();
  });

  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    if (IS_SERVER) {
      return;
    }

    try {
      const nextValue = value instanceof Function
        ? value(readValue())
        : value;

      window.localStorage.setItem(key, serialize(nextValue));
      setStoredValue(nextValue);
      dispatchLocalStorageEvent(key);
    } catch {
      // Ignore write errors (e.g. private mode / quota exceeded).
    }
  }, [key, readValue, serialize]);

  const removeValue = useCallback(() => {
    if (IS_SERVER) {
      return;
    }

    const resolvedInitialValue = evaluateInitialValue(initialValue);

    try {
      window.localStorage.removeItem(key);
      setStoredValue(resolvedInitialValue);
      dispatchLocalStorageEvent(key);
    } catch {
      // Ignore remove errors.
    }
  }, [initialValue, key]);

  useEffect(() => {
    setStoredValue(readValue());
    // Keep this effect keyed by `key` only to avoid loops from unstable
    // object/function identities passed as `initialValue` or options.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (event: Event) => {
      const eventKey = isStorageEvent(event)
        ? event.key
        : (event as CustomEvent<{ key?: string }>).detail?.key;

      if (eventKey && eventKey !== key) {
        return;
      }

      setStoredValue(readValue());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(LOCAL_STORAGE_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(LOCAL_STORAGE_EVENT, handleStorageChange);
    };
  }, [key, readValue]);

  return [storedValue, setValue, removeValue];
}
