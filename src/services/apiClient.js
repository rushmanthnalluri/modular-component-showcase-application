const RENDER_API_BASE_URL = "https://modular-component-showcase-application.onrender.com/api";

function getDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    return import.meta.env.VITE_API_BASE_URL || RENDER_API_BASE_URL;
  }

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:5000/api";
  }

  return RENDER_API_BASE_URL;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl();

async function parseError(response) {
  try {
    const payload = await response.json();
    return payload?.message || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("authToken");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestConfig = {
    ...options,
    headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, requestConfig);
  } catch (primaryError) {
    if (API_BASE_URL === RENDER_API_BASE_URL) {
      throw primaryError;
    }

    response = await fetch(`${RENDER_API_BASE_URL}${path}`, requestConfig);
  }

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
}
