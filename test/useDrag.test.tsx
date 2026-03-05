import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { UseDragOptions } from "../src/useDrag";
import useDrag from "../src/useDrag";

interface TestComponentProps {
  options?: UseDragOptions;
}

function TestComponent({ options }: TestComponentProps) {
  const { ref, position, isDragging } = useDrag<HTMLDivElement>(options);

  return (
    <div>
      <div data-testid="drag-target" ref={ref}>
        Drag me
      </div>
      <span data-testid="position">
        {position.x},{position.y}
      </span>
      <span data-testid="dragging">{String(isDragging)}</span>
    </div>
  );
}

describe("useDrag", () => {
  it("updates position when dragging with mouse", () => {
    const { getByTestId } = render(
      <TestComponent options={{ initialPosition: { x: 10, y: 20 } }} />
    );
    const target = getByTestId("drag-target");

    fireEvent.mouseDown(target, {
      button: 0,
      clientX: 100,
      clientY: 100
    });
    expect(getByTestId("dragging").textContent).toBe("true");

    fireEvent.mouseMove(document, {
      clientX: 125,
      clientY: 140
    });
    expect(getByTestId("position").textContent).toBe("35,60");

    fireEvent.mouseUp(document, {
      clientX: 125,
      clientY: 140
    });
    expect(getByTestId("dragging").textContent).toBe("false");
  });

  it("ignores non-left mouse button drag start", () => {
    const { getByTestId } = render(<TestComponent />);
    const target = getByTestId("drag-target");

    fireEvent.mouseDown(target, {
      button: 2,
      clientX: 0,
      clientY: 0
    });
    fireEvent.mouseMove(document, {
      clientX: 30,
      clientY: 30
    });

    expect(getByTestId("position").textContent).toBe("0,0");
    expect(getByTestId("dragging").textContent).toBe("false");
  });

  it("does not drag when disabled", () => {
    const { getByTestId } = render(
      <TestComponent options={{ disabled: true }} />
    );
    const target = getByTestId("drag-target");

    fireEvent.mouseDown(target, {
      button: 0,
      clientX: 10,
      clientY: 10
    });
    fireEvent.mouseMove(document, {
      clientX: 20,
      clientY: 20
    });
    fireEvent.mouseUp(document, {
      clientX: 20,
      clientY: 20
    });

    expect(getByTestId("position").textContent).toBe("0,0");
    expect(getByTestId("dragging").textContent).toBe("false");
  });

  it("triggers callbacks with expected payload", () => {
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const { getByTestId } = render(
      <TestComponent options={{ onDragStart, onDrag, onDragEnd }} />
    );
    const target = getByTestId("drag-target");

    fireEvent.mouseDown(target, {
      button: 0,
      clientX: 4,
      clientY: 8
    });
    fireEvent.mouseMove(document, {
      clientX: 10,
      clientY: 20
    });
    fireEvent.mouseUp(document, {
      clientX: 10,
      clientY: 20
    });

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart).toHaveBeenCalledWith(
      expect.objectContaining({
        position: { x: 0, y: 0 },
        delta: { x: 0, y: 0 }
      })
    );

    expect(onDrag).toHaveBeenCalledTimes(1);
    expect(onDrag).toHaveBeenCalledWith(
      expect.objectContaining({
        position: { x: 6, y: 12 },
        delta: { x: 6, y: 12 }
      })
    );

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        position: { x: 6, y: 12 },
        delta: { x: 6, y: 12 }
      })
    );
  });

  it("always calls the latest callback after rerender", () => {
    const firstOnDrag = vi.fn();
    const secondOnDrag = vi.fn();
    const { rerender, getByTestId } = render(
      <TestComponent options={{ onDrag: firstOnDrag }} />
    );
    const target = getByTestId("drag-target");

    rerender(<TestComponent options={{ onDrag: secondOnDrag }} />);
    fireEvent.mouseDown(target, {
      button: 0,
      clientX: 2,
      clientY: 2
    });
    fireEvent.mouseMove(document, {
      clientX: 7,
      clientY: 9
    });
    fireEvent.mouseUp(document, {
      clientX: 7,
      clientY: 9
    });

    expect(firstOnDrag).not.toHaveBeenCalled();
    expect(secondOnDrag).toHaveBeenCalledTimes(1);
  });

  it("supports touch drag events", () => {
    const { getByTestId } = render(<TestComponent />);
    const target = getByTestId("drag-target");

    fireEvent.touchStart(target, {
      touches: [{ clientX: 5, clientY: 5 }]
    });
    fireEvent.touchMove(document, {
      touches: [{ clientX: 8, clientY: 10 }]
    });
    expect(getByTestId("position").textContent).toBe("3,5");

    fireEvent.touchEnd(document, {
      changedTouches: [{ clientX: 8, clientY: 10 }]
    });
    expect(getByTestId("dragging").textContent).toBe("false");
  });

  it("removes document listeners on unmount", () => {
    const onDrag = vi.fn();
    const { getByTestId, unmount } = render(
      <TestComponent options={{ onDrag }} />
    );
    const target = getByTestId("drag-target");

    fireEvent.mouseDown(target, {
      button: 0,
      clientX: 0,
      clientY: 0
    });
    unmount();
    fireEvent.mouseMove(document, {
      clientX: 10,
      clientY: 10
    });

    expect(onDrag).not.toHaveBeenCalled();
  });
});
