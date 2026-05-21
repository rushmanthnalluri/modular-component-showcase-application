import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

describe("apiClient backend fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async (url) => ({
      ok: true,
      status: 200,
      json: async () => ({ url }),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the local backend base url in development", async () => {
    const apiClient = await import("@/services/apiClient");

    expect(apiClient.BACKEND_BASE_URL).toBe("http://localhost:5000");

    await apiClient.backendRequest("/api/captcha/getcaptcha/6", { method: "GET" });

    expect(fetch).toHaveBeenCalled();
    expect(fetch.mock.calls[0][0]).toContain("http://localhost:5000/api/captcha/getcaptcha/6");
  });

  it("preserves base URL path when building URLs", async () => {
    const apiClient = await import("@/services/apiClient");

    // In dev, resolveBaseUrl("/profile") is GATEWAY_BASE_URL which is "/gateway" (or http://localhost:8000 from env)
    // buildApiUrl uses normalizedPath = "/api/profile"
    const gatewayUrl = apiClient.buildApiUrl("/profile", { useGateway: true });
    if (apiClient.GATEWAY_BASE_URL.includes("localhost:8000")) {
      expect(gatewayUrl).toContain("http://localhost:8000/api/profile");
    } else {
      expect(gatewayUrl).toContain("/gateway/api/profile");
    }

    // In dev, API_BASE_URL is "/api" (or http://localhost:5000/api from env). buildApiUrl uses normalizedPath = "/profile"
    const backendUrl = apiClient.buildApiUrl("/profile", { useGateway: false });
    if (apiClient.API_BASE_URL.includes("localhost:5000")) {
      expect(backendUrl).toContain("http://localhost:5000/api/profile");
    } else {
      expect(backendUrl).toContain("/api/profile");
    }
  });
});