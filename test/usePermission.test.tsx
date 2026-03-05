import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import usePermission from "../src/usePermission";

interface MockPermissionStatus extends PermissionStatus {
  triggerChange: () => void;
  setState: (state: PermissionState) => void;
}

const originalPermissionsDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "permissions"
);

function createPermissionStatus(
  initialState: PermissionState
): MockPermissionStatus {
  let state: PermissionState = initialState;
  const listeners = new Set<() => void>();
  const status = {
    get state() {
      return state;
    },
    name: "camera",
    onchange: null,
    addEventListener: (
      _type: string,
      listener: EventListenerOrEventListenerObject
    ) => {
      const callback = listener as () => void;
      listeners.add(callback);
    },
    removeEventListener: (
      _type: string,
      listener: EventListenerOrEventListenerObject
    ) => {
      const callback = listener as () => void;
      listeners.delete(callback);
    },
    dispatchEvent: () => true,
    triggerChange: () => {
      listeners.forEach((listener) => listener());
      if (typeof status.onchange === "function") {
        status.onchange(new Event("change"));
      }
    },
    setState: (nextState: PermissionState) => {
      state = nextState;
    }
  } as unknown as MockPermissionStatus;

  return status;
}

afterEach(() => {
  vi.restoreAllMocks();

  if (originalPermissionsDescriptor) {
    Object.defineProperty(
      navigator,
      "permissions",
      originalPermissionsDescriptor
    );
  } else {
    delete (navigator as { permissions?: unknown }).permissions;
  }
});

describe("usePermission", () => {
  it("returns unsupported when permissions api is unavailable", () => {
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: undefined
    });

    const { result } = renderHook(() => usePermission("geolocation"));
    expect(result.current).toBe("unsupported");
  });

  it("queries permission state for string permission name", async () => {
    const status = createPermissionStatus("prompt");
    const query = vi.fn(async () => status);

    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query }
    });

    const { result } = renderHook(() => usePermission("camera"));

    await waitFor(() => {
      expect(result.current).toBe("prompt");
    });
    expect(query).toHaveBeenCalledWith({ name: "camera" });
  });

  it("updates when permission status changes", async () => {
    const status = createPermissionStatus("prompt");
    const query = vi.fn(async () => status);

    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query }
    });

    const { result } = renderHook(() => usePermission("camera"));

    await waitFor(() => {
      expect(result.current).toBe("prompt");
    });

    act(() => {
      status.setState("granted");
      status.triggerChange();
    });

    await waitFor(() => {
      expect(result.current).toBe("granted");
    });
  });

  it("returns unsupported when input is null", () => {
    const query = vi.fn();

    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query }
    });

    const { result } = renderHook(() => usePermission(null));
    expect(result.current).toBe("unsupported");
    expect(query).not.toHaveBeenCalled();
  });

  it("returns unsupported when query rejects", async () => {
    const query = vi.fn(async () => {
      throw new Error("failed");
    });

    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query }
    });

    const { result } = renderHook(() => usePermission("camera"));

    await waitFor(() => {
      expect(result.current).toBe("unsupported");
    });
  });
});
