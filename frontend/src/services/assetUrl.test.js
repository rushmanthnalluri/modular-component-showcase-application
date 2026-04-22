import { beforeEach, describe, expect, it, vi } from "vitest";

describe("resolveAssetUrl", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    window.history.replaceState({}, "", "https://rushmanthnalluri.github.io/modular-component-showcase-application/user/dashboard");
  });

  it("keeps absolute URLs unchanged", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://modular-component-showcase-application.onrender.com/api");
    const { resolveAssetUrl } = await import("./assetUrl");

    expect(resolveAssetUrl("https://cdn.example.com/avatar.png")).toBe("https://cdn.example.com/avatar.png");
  });

  it("resolves uploaded avatar paths against the backend origin", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://modular-component-showcase-application.onrender.com/api");
    const { resolveAssetUrl } = await import("./assetUrl");

    expect(resolveAssetUrl("/app/uploads/avatars/test.png")).toBe(
      "https://modular-component-showcase-application.onrender.com/app/uploads/avatars/test.png"
    );
  });

  it("uses the current origin for local relative API bases", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "/api");
    const { resolveAssetUrl } = await import("./assetUrl");

    expect(resolveAssetUrl("/app/uploads/avatars/test.png")).toBe(
      "https://rushmanthnalluri.github.io/app/uploads/avatars/test.png"
    );
  });
});
