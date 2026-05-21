const DEFAULT_DEV_API_BASE_URL = "/api";
const DEFAULT_DEV_GATEWAY_BASE_URL = "/gateway";
const DEFAULT_DEV_BACKEND_BASE_URL = "http://localhost:5000";
const DEFAULT_PRODUCTION_GATEWAY_BASE_URL = "https://modular-component-showcase-application-ve5e.onrender.com";
const DEFAULT_PRODUCTION_BACKEND_BASE_URL = "https://modular-component-showcase-application.onrender.com";
const SAFE_READONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const BACKEND_FALLBACK_PREFIXES = [
  "/api",
  "/auth",
  "/captcha",
  "/components",
  "/dashboard",
  "/profile",
  "/admin/sql",
  "/reviews",
  "/discussions",
  "/users",
  "/email",
  "/search",
  "/vector",
];
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

function sanitizeConfiguredUrl(baseUrl) {
  const normalizedBaseUrl = alignLocalHostAlias(baseUrl);
  if (!normalizedBaseUrl) {
    return "";
  }

  if (typeof window !== "undefined" && !import.meta.env.DEV && /^https?:\/\//i.test(normalizedBaseUrl)) {
    try {
      const parsed = new URL(normalizedBaseUrl);
      if (isLocalHostAlias(parsed.hostname)) {
        return "";
      }
    } catch {
      return "";
    }
  }

  return normalizedBaseUrl;
}

function inferBrowserGatewayBaseUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const hostname = String(window.location?.hostname || "").toLowerCase();
  if (hostname.endsWith(".onrender.com")) {
    return String(window.location.origin || "").trim();
  }
  if (hostname.endsWith("github.io")) {
    return DEFAULT_PRODUCTION_GATEWAY_BASE_URL;
  }

  return "";
}

function inferBrowserBackendBaseUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  const hostname = String(window.location?.hostname || "").toLowerCase();
  if (hostname.endsWith(".onrender.com")) {
    return String(window.location.origin || "").trim();
  }
  if (hostname.endsWith("github.io")) {
    return DEFAULT_PRODUCTION_BACKEND_BASE_URL;
  }

  return "";
}

// Production convention: frontend calls the FastAPI gateway only.
// Gateway routes are mounted at the origin + "/api" (e.g. https://<gateway>/api/profile).
export const API_BASE_URL =
  sanitizeConfiguredUrl(import.meta.env.VITE_API_BASE_URL) || DEFAULT_DEV_API_BASE_URL;

// Accept VITE_GATEWAY_URL in either form:
//   1) "https://gateway.example.com"  (preferred)
//   2) "https://gateway.example.com/api" (tolerated)
function normalizeGatewayBaseUrl(value) {
  const raw = sanitizeConfiguredUrl(value);
  if (!raw) return "";

  const normalized = normalizeBaseUrl(raw);
  // Remove a trailing /api so we can consistently prepend /api in buildApiUrl.
  return normalized.replace(/\/api\/+$/i, "").replace(/\/+$/, "");
}

export const GATEWAY_BASE_URL =
  normalizeGatewayBaseUrl(import.meta.env.VITE_GATEWAY_URL) ||
  normalizeGatewayBaseUrl(stripApiSuffix(import.meta.env.VITE_API_BASE_URL)) ||
  inferBrowserGatewayBaseUrl() ||
  (import.meta.env.DEV ? DEFAULT_DEV_GATEWAY_BASE_URL : "");

export const BACKEND_BASE_URL =
  sanitizeConfiguredUrl(import.meta.env.VITE_BACKEND_URL) ||
  inferBrowserBackendBaseUrl() ||
  (import.meta.env.DEV ? DEFAULT_DEV_BACKEND_BASE_URL : DEFAULT_PRODUCTION_BACKEND_BASE_URL);

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
  const cleanPath = String(path || "").replace(/^\/+/, "");

  if (!normalizedBaseUrl) {
    return `/${cleanPath}`;
  }

  const absoluteBaseUrl = /^https?:\/\//i.test(normalizedBaseUrl)
    ? normalizedBaseUrl
    : typeof window !== "undefined"
      ? `${window.location.origin}${normalizedBaseUrl.startsWith("/") ? "" : "/"}${normalizedBaseUrl}`
      : normalizedBaseUrl;

  try {
    const url = new URL(absoluteBaseUrl.endsWith("/") ? absoluteBaseUrl : `${absoluteBaseUrl}/`);
    url.pathname = url.pathname.endsWith("/") ? `${url.pathname}${cleanPath}` : `${url.pathname}/${cleanPath}`;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return `${normalizedBaseUrl}/${cleanPath}`.replace(/\/+/g, "/").replace(":/", "://");
  }
}

export function buildApiUrl(path = "", { useGateway = true } = {}) {
  const baseUrl = useGateway ? resolveBaseUrl(path) : API_BASE_URL;
  const normalizedPath = String(path || "").startsWith("/api")
    ? String(path)
    : `${useGateway && baseUrl === GATEWAY_BASE_URL ? "/api" : ""}${String(path || "")}`;

  return toAbsoluteFetchUrl(baseUrl, normalizedPath);
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
    const error = new Error(message);
    error.status = response.status;
    error.url = url;
    throw error;
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
  return ensureCsrfCookieAt(baseUrl, "/auth/csrf");
}

async function ensureCsrfCookieAt(baseUrl, csrfPath) {
  if (typeof window === "undefined") {
    return;
  }

  if (getCookieValue("csrf_token")) {
    return;
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = callApi("GET", toAbsoluteFetchUrl(baseUrl, csrfPath));
  }

  try {
    const payload = await csrfBootstrapPromise;
    memoryCsrfToken = payload?.csrfToken || null;
  } finally {
    csrfBootstrapPromise = null;
  }
}

function shouldRetryAgainstBackend(path) {
  const normalizedPath = String(path || "").trim().toLowerCase();
  return BACKEND_FALLBACK_PREFIXES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
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
    const csrfBaseUrl = baseUrl === GATEWAY_BASE_URL
      ? `${baseUrl}/api`
      : baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
    await ensureCsrfCookie(csrfBaseUrl);
  }

  try {
    return await callApi(method, toAbsoluteFetchUrl(baseUrl, normalizedPath), body, { headers });
  } catch (error) {
    const retryableStatus = !error || typeof error !== "object"
      ? false
      : [404, 500, 502, 503, 504].includes(Number(error.status || 0));

    if (baseUrl === GATEWAY_BASE_URL && shouldRetryAgainstBackend(normalizedPath) && retryableStatus) {
      return backendApiRequest(path, options);
    }

    throw error;
  }
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

export async function backendRequest(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const body = options.body;
  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormDataBody(body) && body !== undefined && !Object.keys(headers).some((key) => key.toLowerCase() === "content-type")) {
    headers["Content-Type"] = "application/json";
  }

  return callApi(
    method,
    toAbsoluteFetchUrl(BACKEND_BASE_URL, path),
    body,
    {
      headers,
      withCredentials: options.withCredentials ?? true,
      timeoutMs: options.timeoutMs,
    }
  );
}

export async function backendApiRequest(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const normalizedPath = String(path || "").startsWith("/api")
    ? String(path)
    : `/api${String(path || "").startsWith("/") ? String(path) : `/${String(path || "")}`}`;

  if (!isSafeReadonlyMethod(method)) {
    await ensureCsrfCookieAt(BACKEND_BASE_URL, "/api/auth/csrf");
  }

  return backendRequest(normalizedPath, options);
}
