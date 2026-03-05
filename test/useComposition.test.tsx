import { fireEvent, render } from "@testing-library/react";
import type { ChangeEvent, CompositionEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import useComposition from "../src/useComposition";

interface DemoProps {
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onCompositionStart?: (event: CompositionEvent<HTMLInputElement>) => void;
  onCompositionUpdate?: (event: CompositionEvent<HTMLInputElement>) => void;
  onCompositionEnd?: (event: CompositionEvent<HTMLInputElement>) => void;
  triggerOnCompositionEnd?: boolean;
}

function Demo(props: DemoProps) {
  const { isComposing, handlers, resetComposition } = useComposition<HTMLInputElement>(props);

  return (
    <div>
      <input data-testid="input" {...handlers} />
      <span data-testid="composing">{String(isComposing)}</span>
      <button data-testid="reset" type="button" onClick={resetComposition}>
        Reset
      </button>
    </div>
  );
}

describe("useComposition", () => {
  it("tracks composition state correctly", () => {
    const { getByTestId } = render(<Demo />);
    const input = getByTestId("input");

    expect(getByTestId("composing").textContent).toBe("false");

    fireEvent.compositionStart(input);
    expect(getByTestId("composing").textContent).toBe("true");

    fireEvent.compositionEnd(input);
    expect(getByTestId("composing").textContent).toBe("false");
  });

  it("suppresses onChange while composing", () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<Demo onChange={onChange} />);
    const input = getByTestId("input");

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "你" } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange when not composing", () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<Demo onChange={onChange} />);
    const input = getByTestId("input");

    fireEvent.change(input, { target: { value: "hello" } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("can trigger onChange when composition ends", () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <Demo onChange={onChange} triggerOnCompositionEnd />
    );
    const input = getByTestId("input");

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "拼" } });
    fireEvent.compositionEnd(input);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("forwards composition lifecycle callbacks", () => {
    const onCompositionStart = vi.fn();
    const onCompositionUpdate = vi.fn();
    const onCompositionEnd = vi.fn();
    const { getByTestId } = render(
      <Demo
        onCompositionStart={onCompositionStart}
        onCompositionUpdate={onCompositionUpdate}
        onCompositionEnd={onCompositionEnd}
      />
    );
    const input = getByTestId("input");

    fireEvent.compositionStart(input);
    fireEvent.compositionUpdate(input);
    fireEvent.compositionEnd(input);

    expect(onCompositionStart).toHaveBeenCalledTimes(1);
    expect(onCompositionUpdate).toHaveBeenCalledTimes(1);
    expect(onCompositionEnd).toHaveBeenCalledTimes(1);
  });

  it("resets composition state manually", () => {
    const { getByTestId } = render(<Demo />);
    const input = getByTestId("input");

    fireEvent.compositionStart(input);
    expect(getByTestId("composing").textContent).toBe("true");

    fireEvent.click(getByTestId("reset"));
    expect(getByTestId("composing").textContent).toBe("false");
  });

  it("always uses latest callbacks after rerender", () => {
    const firstOnChange = vi.fn();
    const secondOnChange = vi.fn();
    const { rerender, getByTestId } = render(
      <Demo onChange={firstOnChange} />
    );
    const input = getByTestId("input");

    rerender(<Demo onChange={secondOnChange} />);
    fireEvent.change(input, { target: { value: "updated" } });

    expect(firstOnChange).not.toHaveBeenCalled();
    expect(secondOnChange).toHaveBeenCalledTimes(1);
  });
});
