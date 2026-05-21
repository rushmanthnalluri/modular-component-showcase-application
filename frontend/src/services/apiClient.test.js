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
});