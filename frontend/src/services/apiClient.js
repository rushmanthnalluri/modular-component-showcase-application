const DEFAULT_DEV_API_BASE_URL = "/api";
const DEFAULT_DEV_GATEWAY_BASE_URL = "/gateway";
const SAFE_READONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const DEFAULT_REQUEST_TIMEOUT_MS = 20000;
let csrfBootstrapPromise = null;
let memoryCsrfToken = null;

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || DEFAULT_DEV_API_BASE_URL;
export const GATEWAY_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_GATEWAY_URL) ||
  (import.meta.env.DEV ? DEFAULT_DEV_GATEWAY_BASE_URL : "");
export const USE_GATEWAY =
  String(import.meta.env.VITE_USE_GATEWAY || "true").toLowerCase() !== "false";

function resolveBaseUrl(path = "") {
  const useGatewayForApi =
    USE_GATEWAY &&
    Boolean(GATEWAY_BASE_URL) &&
    (String(path).startsWith("/api") || String(path).startsWith("/auth") || String(path).startsWith("/"));

  if (useGatewayForApi) {
    return GATEWAY_BASE_URL;
  }

  return API_BASE_URL;
}

function isSafeReadonlyMethod(method) {
  return SAFE_READONLY_METHODS.has(String(method || "").toUpperCase());
}

function getCookieValue(name) {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

async function callApi(method, url, body, options = {}) {
  const csrfToken =
    options.withCredentials === false ? null : (memoryCsrfToken || getCookieValue("csrf_token"));
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(csrfToken && !isSafeReadonlyMethod(method) ? { "x-csrf-token": csrfToken } : {}),
  };

  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || DEFAULT_REQUEST_TIMEOUT_MS);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: options.withCredentials === false ? "omit" : "include",
      body: body ?? undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error && typeof error === "object" && error.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      message = data?.message || data?.msg || message;
    } catch {
      // Ignore JSON parse errors for non-JSON error responses.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {};
  }

  return response.json();
}

async function ensureCsrfCookie(baseUrl) {
  if (typeof window === "undefined") {
    return;
  }

  if (getCookieValue("csrf_token")) {
    return;
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = callApi("GET", `${baseUrl}/auth/csrf`);
  }

  try {
    const payload = await csrfBootstrapPromise;
    memoryCsrfToken = payload?.csrfToken || null;
  } finally {
    csrfBootstrapPromise = null;
  }
}

export async function apiRequest(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const baseUrl = resolveBaseUrl(path);
  const normalizedPath = String(path || "").startsWith("/api")
    ? String(path)
    : `${baseUrl === GATEWAY_BASE_URL ? "/api" : ""}${String(path || "")}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (!isSafeReadonlyMethod(method)) {
    await ensureCsrfCookie(`${baseUrl}${baseUrl === GATEWAY_BASE_URL ? "/api" : ""}`);
  }

  return callApi(
    method,
    `${baseUrl}${normalizedPath}`,
    options.body,
    { headers }
  );
}

export async function gatewayRequest(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (!GATEWAY_BASE_URL) {
    throw new Error("Gateway base URL is not configured.");
  }

  return callApi(
    method,
    `${GATEWAY_BASE_URL}${path}`,
    options.body,
    {
      headers,
      withCredentials: options.withCredentials ?? false,
      timeoutMs: options.timeoutMs,
    }
  );
}
