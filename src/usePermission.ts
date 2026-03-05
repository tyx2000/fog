import { useEffect, useState } from "react";

export type PermissionHookState = PermissionState | "unsupported";
export type PermissionInput = PermissionName | PermissionDescriptor | null;

export default function usePermission(
  permission: PermissionInput
): PermissionHookState {
  const [state, setState] = useState<PermissionHookState>("unsupported");
  const permissionDescriptor = typeof permission === "string"
    ? { name: permission } as PermissionDescriptor
    : permission;

  useEffect(() => {
    if (!permissionDescriptor) {
      setState("unsupported");
      return;
    }

    if (
      typeof navigator === "undefined" ||
      typeof navigator.permissions?.query !== "function"
    ) {
      setState("unsupported");
      return;
    }

    let isActive = true;
    let permissionStatus: PermissionStatus | null = null;

    const handleChange = () => {
      if (!permissionStatus || !isActive) {
        return;
      }

      setState(permissionStatus.state);
    };

    void navigator.permissions
      .query(permissionDescriptor)
      .then((status) => {
        if (!isActive) {
          return;
        }

        permissionStatus = status;
        setState(status.state);

        if (typeof status.addEventListener === "function") {
          status.addEventListener("change", handleChange);
        } else {
          status.onchange = handleChange;
        }
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setState("unsupported");
      });

    return () => {
      isActive = false;

      if (!permissionStatus) {
        return;
      }

      if (typeof permissionStatus.removeEventListener === "function") {
        permissionStatus.removeEventListener("change", handleChange);
      } else {
        permissionStatus.onchange = null;
      }
    };
  }, [permissionDescriptor]);

  return state;
}
