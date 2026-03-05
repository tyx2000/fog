import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useLongPress from "../src/useLongPress";

interface DemoProps {
  onLongPress: () => void;
  threshold?: number;
  enabled?: boolean;
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
}

function Demo({
  onLongPress,
  threshold = 400,
  enabled = true,
  onStart,
  onFinish,
  onCancel
}: DemoProps) {
  const { isPressed, handlers } = useLongPress<HTMLButtonElement>(
    onLongPress,
    {
      threshold,
      enabled,
      onStart,
      onFinish,
      onCancel
    }
  );

  return (
    <div>
      <button data-testid="target" type="button" {...handlers}>
        Hold
      </button>
      <span data-testid="pressed">{String(isPressed)}</span>
    </div>
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useLongPress", () => {
  it("triggers callback after threshold", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onFinish = vi.fn();
    const { getByTestId } = render(
      <Demo onLongPress={onLongPress} onFinish={onFinish} />
    );
    const target = getByTestId("target");

    fireEvent.mouseDown(target);
    expect(getByTestId("pressed").textContent).toBe("true");

    vi.advanceTimersByTime(399);
    expect(onLongPress).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("cancels when released before threshold", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onCancel = vi.fn();
    const { getByTestId } = render(
      <Demo onLongPress={onLongPress} onCancel={onCancel} />
    );
    const target = getByTestId("target");

    fireEvent.mouseDown(target);
    vi.advanceTimersByTime(200);
    fireEvent.mouseUp(target);

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(getByTestId("pressed").textContent).toBe("false");
  });

  it("supports touch events", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { getByTestId } = render(<Demo onLongPress={onLongPress} />);
    const target = getByTestId("target");

    fireEvent.touchStart(target);
    vi.advanceTimersByTime(400);
    expect(onLongPress).toHaveBeenCalledTimes(1);

    fireEvent.touchEnd(target);
    expect(getByTestId("pressed").textContent).toBe("false");
  });

  it("does not start when disabled", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onStart = vi.fn();
    const { getByTestId } = render(
      <Demo onLongPress={onLongPress} enabled={false} onStart={onStart} />
    );
    const target = getByTestId("target");

    fireEvent.mouseDown(target);
    vi.advanceTimersByTime(500);

    expect(onLongPress).not.toHaveBeenCalled();
    expect(onStart).not.toHaveBeenCalled();
    expect(getByTestId("pressed").textContent).toBe("false");
  });

  it("always uses latest callback after rerender", () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const second = vi.fn();

    const { rerender, getByTestId } = render(
      <Demo onLongPress={first} />
    );
    const target = getByTestId("target");

    rerender(<Demo onLongPress={second} />);
    fireEvent.mouseDown(target);
    vi.advanceTimersByTime(400);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("clears timer on unmount", () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { getByTestId, unmount } = render(<Demo onLongPress={onLongPress} />);

    fireEvent.mouseDown(getByTestId("target"));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
