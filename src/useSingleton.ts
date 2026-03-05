import { useRef } from "react";

export type UseSingletonFactory<T> = () => T;

export default function useSingleton<T>(factory: UseSingletonFactory<T>): T {
  const singletonRef = useRef<{
    initialized: boolean;
    value: T;
  } | null>(null);

  if (singletonRef.current === null || !singletonRef.current.initialized) {
    singletonRef.current = {
      initialized: true,
      value: factory()
    };
  }

  return singletonRef.current.value;
}
