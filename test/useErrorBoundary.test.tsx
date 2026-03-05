import { fireEvent, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Component, useEffect, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useErrorBoundary from "../src/useErrorBoundary";

interface BoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface BoundaryState {
  error: unknown;
}

class TestErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = {
    error: null
  };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error };
  }

  render() {
    if (this.state.error !== null) {
      const message = this.state.error instanceof Error
        ? this.state.error.message
        : String(this.state.error);

      return (
        <div>
          <p data-testid="fallback-message">{message}</p>
          <button
            data-testid="fallback-reset"
            type="button"
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset?.();
            }}
          >
            Reset
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface DemoProps {
  errorValue?: unknown;
}

function Demo({ errorValue = new Error("boom") }: DemoProps) {
  const { error, showBoundary, resetBoundary } = useErrorBoundary<unknown>();

  return (
    <div>
      <span data-testid="has-error">{String(error !== null)}</span>
      <button
        data-testid="throw"
        type="button"
        onClick={() => {
          showBoundary(errorValue);
        }}
      >
        Throw
      </button>
      <button
        data-testid="set-and-reset"
        type="button"
        onClick={() => {
          showBoundary(new Error("temporary"));
          resetBoundary();
        }}
      >
        Set and reset
      </button>
    </div>
  );
}

function AsyncDemo() {
  const { showBoundary } = useErrorBoundary<unknown>();
  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    if (!trigger) {
      return;
    }

    Promise.resolve().then(() => {
      showBoundary(new Error("async boom"));
    });
  }, [showBoundary, trigger]);

  return (
    <button
      data-testid="throw-async"
      type="button"
      onClick={() => {
        setTrigger(true);
      }}
    >
      Throw async
    </button>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useErrorBoundary", () => {
  it("throws to nearest error boundary when showBoundary is called", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const { getByTestId } = render(
      <TestErrorBoundary>
        <Demo />
      </TestErrorBoundary>
    );

    fireEvent.click(getByTestId("throw"));

    expect(getByTestId("fallback-message").textContent).toBe("boom");
    expect(consoleError).toHaveBeenCalled();
  });

  it("supports non-Error thrown values", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { getByTestId } = render(
      <TestErrorBoundary>
        <Demo errorValue="string error" />
      </TestErrorBoundary>
    );

    fireEvent.click(getByTestId("throw"));

    expect(getByTestId("fallback-message").textContent).toBe("string error");
  });

  it("allows recovery after boundary reset", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const handleReset = vi.fn();

    const { getByTestId, queryByTestId } = render(
      <TestErrorBoundary onReset={handleReset}>
        <Demo />
      </TestErrorBoundary>
    );

    fireEvent.click(getByTestId("throw"));
    expect(getByTestId("fallback-message").textContent).toBe("boom");

    fireEvent.click(getByTestId("fallback-reset"));
    expect(handleReset).toHaveBeenCalledTimes(1);
    expect(queryByTestId("fallback-message")).toBeNull();
    expect(getByTestId("has-error").textContent).toBe("false");
  });

  it("can clear pending error state with resetBoundary before re-render throws", () => {
    const { getByTestId, queryByTestId } = render(
      <TestErrorBoundary>
        <Demo />
      </TestErrorBoundary>
    );

    fireEvent.click(getByTestId("set-and-reset"));

    expect(queryByTestId("fallback-message")).toBeNull();
    expect(getByTestId("has-error").textContent).toBe("false");
  });

  it("works with async flows when showBoundary is called later", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { getByTestId } = render(
      <TestErrorBoundary>
        <AsyncDemo />
      </TestErrorBoundary>
    );

    fireEvent.click(getByTestId("throw-async"));

    await waitFor(() => {
      expect(getByTestId("fallback-message").textContent).toBe("async boom");
    });
  });
});
