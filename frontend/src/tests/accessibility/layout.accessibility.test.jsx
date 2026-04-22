import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { ThemeProvider } from "@/context/ThemeContext";
import * as authAccess from "@/services/authAccess";

describe("Layout accessibility smoke", () => {
  it("renders skip link, main landmark, and named theme control", async () => {
    vi.spyOn(authAccess, "subscribeToAuthUser").mockImplementation((onChange) => {
      onChange(null);
      return () => {};
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <Layout>
            <section>Accessible content</section>
          </Layout>
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByRole("link", { name: "Skip to main content" })).toBeTruthy();
    expect(screen.getByRole("main")).toBeTruthy();
    expect(await screen.findByRole("button", { name: /Switch to .* theme/i })).toBeTruthy();
  });
});
