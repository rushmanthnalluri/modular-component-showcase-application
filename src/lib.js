const RENDER_API_URL = "https://modular-component-showcase-application.onrender.com";

function getDefaultApiUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5000";
    }
  }

  return RENDER_API_URL;
}

// Keep a single source for backend URL so API calls can share one utility.
export const APIURL = import.meta.env.VITE_API_URL || getDefaultApiUrl();
export const IMGURL = import.meta.env.BASE_URL;

export async function callApi(rmethod, url, data, responseHandler, requestOptions = {}) {
  const method = String(rmethod || "GET").toUpperCase();
  const customHeaders = requestOptions.headers || {};
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...customHeaders,
    },
  };

  if (method !== "GET" && method !== "DELETE" && data !== undefined && data !== null) {
    options.body = data;
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const payload = response.status === 204 ? null : await response.json();

  if (typeof responseHandler === "function") {
    responseHandler(payload);
  }

  return payload;
}