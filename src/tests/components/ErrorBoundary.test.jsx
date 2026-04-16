import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ErrorBoundary from "@/components/common/ErrorBoundary";

function ThrowOnRender() {
  throw new Error("Boom");
}

describe("ErrorBoundary", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders fallback UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset error boundary" })).toBeTruthy();
  });

  it("reset button remains available after fallback", () => {
    render(
      <ErrorBoundary>
        <ThrowOnRender />
      </ErrorBoundary>
    );

    const resetButton = screen.getByRole("button", { name: "Reset error boundary" });
    fireEvent.click(resetButton);
    expect(screen.getByRole("button", { name: "Reset error boundary" })).toBeTruthy();
  });
});
