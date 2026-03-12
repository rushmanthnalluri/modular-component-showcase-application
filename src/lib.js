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

export async function callApi(rmethod, url, data, requestOptions = {}) {
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
    // Read the API's own error message from the response body.
    let apiMessage = "";
    try {
      const errBody = await response.json();
      apiMessage = String(errBody?.message || errBody?.msg || "");
    } catch {
      // ignore JSON parse errors on error responses
    }

    if (response.status === 401) {
      const hadToken = Boolean(localStorage.getItem("authToken"));
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      window.dispatchEvent(new Event("auth-state-changed"));
      if (hadToken && !apiMessage) {
        throw new Error("Session expired. Please log in again.");
      }
    }

    throw new Error(apiMessage || `${response.status}: ${response.statusText}`);
  }

  return response.status === 204 ? null : await response.json();
}