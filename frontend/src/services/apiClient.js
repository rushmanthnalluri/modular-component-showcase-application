const DEFAULT_DEV_API_BASE_URL = "/api";
const DEFAULT_DEV_GATEWAY_BASE_URL = "/gateway";
const SAFE_READONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const DEFAULT_REQUEST_TIMEOUT_MS = 20000;
let csrfBootstrapPromise = null;
let memoryCsrfToken = null;

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function stripApiSuffix(value) {
  const normalizedBaseUrl = normalizeBaseUrl(value);
  if (!normalizedBaseUrl) {
    return "";
  }

  try {
    const parsed = new URL(normalizedBaseUrl);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if ((pathParts[pathParts.length - 1] || "").toLowerCase() === "api") {
      pathParts.pop();
    }
    parsed.pathname = pathParts.length ? `/${pathParts.join("/")}` : "/";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return normalizedBaseUrl.endsWith("/api") ? normalizedBaseUrl.slice(0, -4) : normalizedBaseUrl;
  }
}

function isLocalHostAlias(hostname) {
  const normalized = String(hostname || "").toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function alignLocalHostAlias(baseUrl) {
  if (typeof window === "undefined") {
    return normalizeBaseUrl(baseUrl);
  }

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  if (!/^https?:\/\//i.test(normalizedBaseUrl)) {
    return normalizedBaseUrl;
  }

  try {
    const parsed = new URL(normalizedBaseUrl);
    const runtimeHostname = String(window.location?.hostname || "");

    if (isLocalHostAlias(parsed.hostname) && isLocalHostAlias(runtimeHostname) && parsed.hostname !== runtimeHostname) {
      parsed.hostname = runtimeHostname;
      return parsed.toString().replace(/\/+$/, "");
    }
  } catch {
    return normalizedBaseUrl;
  }

  return normalizedBaseUrl;
}

export const API_BASE_URL =
  alignLocalHostAlias(import.meta.env.VITE_API_BASE_URL) || DEFAULT_DEV_API_BASE_URL;
export const GATEWAY_BASE_URL =
  alignLocalHostAlias(import.meta.env.VITE_GATEWAY_URL) ||
  alignLocalHostAlias(stripApiSuffix(import.meta.env.VITE_API_BASE_URL)) ||
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

function normalizePathname(path = "") {
  return `/${String(path || "").replace(/^\/+/, "")}`;
}

function toAbsoluteFetchUrl(baseUrl, path = "") {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedPath = normalizePathname(path);

  if (!normalizedBaseUrl) {
    return normalizedPath;
  }

  const absoluteBaseUrl = /^https?:\/\//i.test(normalizedBaseUrl)
    ? normalizedBaseUrl
    : typeof window !== "undefined"
      ? `${window.location.origin}${normalizedBaseUrl.startsWith("/") ? "" : "/"}${normalizedBaseUrl}`
      : normalizedBaseUrl;

  try {
    return new URL(normalizedPath, absoluteBaseUrl.endsWith("/") ? absoluteBaseUrl : `${absoluteBaseUrl}/`)
      .toString()
      .replace(/\/+$/, "");
  } catch {
    return `${normalizedBaseUrl}${normalizedPath}`;
  }
}

function getCookieValue(name) {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function isFormDataBody(value) {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

async function callApi(method, url, body, options = {}) {
  const csrfToken =
    options.withCredentials === false ? null : (memoryCsrfToken || getCookieValue("csrf_token"));
  const headers = {
    ...(options.headers || {}),
    ...(csrfToken && !isSafeReadonlyMethod(method) ? { "x-csrf-token": csrfToken } : {}),
  };
  if (!isFormDataBody(body) && body !== undefined && !Object.keys(headers).some((key) => key.toLowerCase() === "content-type")) {
    headers["Content-Type"] = "application/json";
  }

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
      message = data?.error?.message || data?.message || data?.msg || message;
    } catch {
      // Ignore JSON parse errors for non-JSON error responses.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return {};
  }

  const payload = await response.json();
  if (payload?.success === true && payload?.data !== undefined) {
    if (Array.isArray(payload.data) || payload.data === null || typeof payload.data !== "object") {
      return payload.data;
    }
    return {
      ...payload.data,
      __envelope: payload,
    };
  }
  return payload;
}

async function ensureCsrfCookie(baseUrl) {
  if (typeof window === "undefined") {
    return;
  }

  if (getCookieValue("csrf_token")) {
    return;
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = callApi("GET", toAbsoluteFetchUrl(baseUrl, "/auth/csrf"));
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
  const body = options.body;
  const normalizedPath = String(path || "").startsWith("/api")
    ? String(path)
    : `${baseUrl === GATEWAY_BASE_URL ? "/api" : ""}${String(path || "")}`;
  const headers = {
    ...(options.headers || {}),
  };
  if (!isFormDataBody(body) && body !== undefined && !Object.keys(headers).some((key) => key.toLowerCase() === "content-type")) {
    headers["Content-Type"] = "application/json";
  }

  if (!isSafeReadonlyMethod(method)) {
    await ensureCsrfCookie(`${baseUrl}${baseUrl === GATEWAY_BASE_URL ? "/api" : ""}`);
  }

  return callApi(
    method,
    toAbsoluteFetchUrl(baseUrl, normalizedPath),
    body,
    { headers }
  );
}

export async function gatewayRequest(path, options = {}) {
  const gatewayBaseUrl = GATEWAY_BASE_URL || stripApiSuffix(API_BASE_URL);
  const method = String(options.method || "GET").toUpperCase();
  const body = options.body;
  const headers = {
    ...(options.headers || {}),
  };
  if (!isFormDataBody(body) && body !== undefined && !Object.keys(headers).some((key) => key.toLowerCase() === "content-type")) {
    headers["Content-Type"] = "application/json";
  }

  if (!gatewayBaseUrl) {
    throw new Error("Gateway base URL is not configured.");
  }

  return callApi(
    method,
    toAbsoluteFetchUrl(gatewayBaseUrl, path),
    body,
    {
      headers,
      withCredentials: options.withCredentials ?? false,
      timeoutMs: options.timeoutMs,
    }
  );
}
