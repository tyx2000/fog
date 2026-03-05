import { useEffect, useRef } from "react";

export default function usePrevious<T>(
  value: T,
  initialValue?: T
) {
  const previousRef = useRef<T | undefined>(initialValue);

  useEffect(() => {
    previousRef.current = value;
  }, [value]);

  return previousRef.current;
}
