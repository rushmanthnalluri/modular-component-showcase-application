import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import * as authAccess from "@/services/authAccess";
import ProtectedRoute from "@/components/common/ProtectedRoute";

describe("ProtectedRoute", () => {
  const routerFuture = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects unauthenticated users to /login", async () => {
    vi.spyOn(authAccess, "subscribeToAuthUser").mockImplementation((onChange) => {
      onChange(null);
      return () => {};
    });

    render(
      <MemoryRouter initialEntries={["/private"]} future={routerFuture}>
        <Routes>
          <Route
            path="/private"
            element={(
              <ProtectedRoute>
                <div>Private Content</div>
              </ProtectedRoute>
            )}
          />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Login Screen")).toBeTruthy();
  });

  it("renders children for authenticated users", async () => {
    vi.spyOn(authAccess, "subscribeToAuthUser").mockImplementation((onChange) => {
      onChange({ id: "u1", role: "developer" });
      return () => {};
    });

    render(
      <MemoryRouter initialEntries={["/private"]} future={routerFuture}>
        <Routes>
          <Route
            path="/private"
            element={(
              <ProtectedRoute>
                <div>Private Content</div>
              </ProtectedRoute>
            )}
          />
          <Route path="/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Private Content")).toBeTruthy();
  });
});
