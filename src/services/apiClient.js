import { APIURL, callApi } from "@/lib";

const RENDER_API_BASE_URL = "https://modular-component-showcase-application.onrender.com/api";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${APIURL}/api`;

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

  try {
    return await callApi(
      requestConfig.method || "GET",
      `${API_BASE_URL}${path}`,
      requestConfig.body,
      undefined,
      { headers: requestConfig.headers }
    );
  } catch (primaryError) {
    if (API_BASE_URL === RENDER_API_BASE_URL) {
      throw primaryError;
    }

    try {
      return await callApi(
        requestConfig.method || "GET",
        `${RENDER_API_BASE_URL}${path}`,
        requestConfig.body,
        undefined,
        { headers: requestConfig.headers }
      );
    } catch (fallbackError) {
      if (fallbackError instanceof Error) {
        throw fallbackError;
      }

      throw new Error("Request failed.");
    }
  }
}
