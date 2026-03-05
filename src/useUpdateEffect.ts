import { useEffect, useRef } from "react";
import type { DependencyList, EffectCallback } from "react";

export default function useUpdateEffect(
  effect: EffectCallback,
  deps: DependencyList
) {
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    return effect();
    // Hook intentionally mirrors useEffect dependency behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
