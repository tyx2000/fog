import { fireEvent, render } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import useClickOutside from "../src/useClickOutside";

type EventNameOption =
  | "click"
  | "mousedown"
  | "mouseup"
  | "touchstart"
  | "touchend"
  | "pointerdown"
  | "pointerup";

interface TestComponentProps extends PropsWithChildren {
  onOutsideClick: (event: Event) => void;
  enabled?: boolean;
  eventName?: EventNameOption;
}

function TestComponent({
  onOutsideClick,
  enabled = true,
  eventName = "click"
}: TestComponentProps) {
  const ref = useClickOutside<HTMLDivElement>(onOutsideClick, {
    enabled,
    eventName
  });

  return (
    <div>
      <div data-testid="inside" ref={ref}>
        <button data-testid="inside-child" type="button">
          Inside child
        </button>
      </div>
      <button data-testid="outside" type="button">
        Outside
      </button>
    </div>
  );
}

describe("useClickOutside", () => {
  it("triggers callback when clicking outside the element", () => {
    const onOutsideClick = vi.fn();
    const { getByTestId } = render(
      <TestComponent onOutsideClick={onOutsideClick} />
    );

    fireEvent.click(getByTestId("outside"));

    expect(onOutsideClick).toHaveBeenCalledTimes(1);
  });

  it("does not trigger callback when clicking inside the element", () => {
    const onOutsideClick = vi.fn();
    const { getByTestId } = render(
      <TestComponent onOutsideClick={onOutsideClick} />
    );

    fireEvent.click(getByTestId("inside"));
    fireEvent.click(getByTestId("inside-child"));

    expect(onOutsideClick).not.toHaveBeenCalled();
  });

  it("does not trigger callback when hook is disabled", () => {
    const onOutsideClick = vi.fn();
    const { getByTestId } = render(
      <TestComponent onOutsideClick={onOutsideClick} enabled={false} />
    );

    fireEvent.click(getByTestId("outside"));

    expect(onOutsideClick).not.toHaveBeenCalled();
  });

  it("supports custom event type", () => {
    const onOutsideClick = vi.fn();
    const { getByTestId } = render(
      <TestComponent onOutsideClick={onOutsideClick} eventName="mousedown" />
    );

    fireEvent.click(getByTestId("outside"));
    expect(onOutsideClick).not.toHaveBeenCalled();

    fireEvent.mouseDown(getByTestId("outside"));
    expect(onOutsideClick).toHaveBeenCalledTimes(1);
  });

  it("always calls the latest callback after rerender", () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();
    const { rerender, getByTestId } = render(
      <TestComponent onOutsideClick={firstCallback} />
    );

    rerender(<TestComponent onOutsideClick={secondCallback} />);
    fireEvent.click(getByTestId("outside"));

    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
  });

  it("cleans up listener on unmount", () => {
    const onOutsideClick = vi.fn();
    const { unmount } = render(<TestComponent onOutsideClick={onOutsideClick} />);

    unmount();
    fireEvent.click(document.body);

    expect(onOutsideClick).not.toHaveBeenCalled();
  });
});
