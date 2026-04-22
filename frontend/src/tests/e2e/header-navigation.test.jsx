import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "@/components/layout/Header";
import { ThemeProvider } from "@/context/ThemeContext";
import * as authAccess from "@/services/authAccess";

function renderHeader() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe("Header navigation smoke", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows public login and register actions for guests", async () => {
    vi.spyOn(authAccess, "subscribeToAuthUser").mockImplementation((onChange) => {
      onChange(null);
      return () => {};
    });

    renderHeader();
    expect(await screen.findByRole("link", { name: "Login" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Register" })).toBeTruthy();
  });

  it("opens mobile navigation and exposes accessible controls", async () => {
    vi.spyOn(authAccess, "subscribeToAuthUser").mockImplementation((onChange) => {
      onChange({ id: "u1", role: "developer", isVerifiedDeveloper: true });
      return () => {};
    });

    renderHeader();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const mobileNavigation = await screen.findByRole("navigation", { name: "Mobile navigation" });
    expect(mobileNavigation).toBeTruthy();
    expect(within(mobileNavigation).getByRole("link", { name: "Profile" })).toBeTruthy();
  });
});
