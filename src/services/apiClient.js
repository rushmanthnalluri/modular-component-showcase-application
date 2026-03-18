import { APIURL, callApi, getCookieValue } from "@/lib";

const RENDER_API_BASE_URL = "https://modular-component-showcase-application.onrender.com/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${APIURL}/api`;
const SAFE_READONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ENABLE_READONLY_FALLBACK = import.meta.env.VITE_ENABLE_READONLY_FALLBACK !== "false";
let csrfBootstrapPromise = null;

function isSafeReadonlyMethod(method) {
  return SAFE_READONLY_METHODS.has(String(method || "").toUpperCase());
}

function canFallbackToRender(path, method) {
  if (!ENABLE_READONLY_FALLBACK || !isSafeReadonlyMethod(method)) {
    return false;
  }

  return path === "/components" || path.startsWith("/components?");
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
    await csrfBootstrapPromise;
  } finally {
    csrfBootstrapPromise = null;
  }
}

export async function apiRequest(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (!isSafeReadonlyMethod(method)) {
    await ensureCsrfCookie(API_BASE_URL);
  }

  try {
    return await callApi(
      method,
      `${API_BASE_URL}${path}`,
      options.body,
      { headers }
    );
  } catch (primaryError) {
    if (API_BASE_URL === RENDER_API_BASE_URL || !canFallbackToRender(path, method)) {
      throw primaryError;
    }

    try {
      return await callApi(
        method,
        `${RENDER_API_BASE_URL}${path}`,
        options.body,
        { headers }
      );
    } catch (fallbackError) {
      if (fallbackError instanceof Error) {
        throw fallbackError;
      }

      throw new Error("Request failed.");
    }
  }
}
