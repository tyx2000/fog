import { useEffect, useState } from "react";

export interface UseMediaQueryOptions {
  defaultValue?: boolean;
  initializeWithValue?: boolean;
}

function getMediaQueryMatch(
  query: string,
  defaultValue: boolean
) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return defaultValue;
  }

  return window.matchMedia(query).matches;
}

export default function useMediaQuery(
  query: string,
  options: UseMediaQueryOptions = {}
) {
  const {
    defaultValue = false,
    initializeWithValue = true
  } = options;

  const [matches, setMatches] = useState(() => {
    if (!initializeWithValue) {
      return defaultValue;
    }

    return getMediaQueryMatch(query, defaultValue);
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches);
    };

    setMatches(mediaQueryList.matches);

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", onChange);
      return () => {
        mediaQueryList.removeEventListener("change", onChange);
      };
    }

    mediaQueryList.addListener(onChange);
    return () => {
      mediaQueryList.removeListener(onChange);
    };
  }, [query]);

  return matches;
}
