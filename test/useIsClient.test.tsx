import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useIsClient from "../src/useIsClient";

describe("useIsClient", () => {
  it("becomes true on client after mount", async () => {
    const { result } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("stays true after rerender", async () => {
    const { result, rerender } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    rerender();
    expect(result.current).toBe(true);
  });
});
