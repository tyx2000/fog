import { useRef } from "react";

export default function useLatest<T>(value: T) {
  const latestRef = useRef(value);
  latestRef.current = value;
  return latestRef;
}
