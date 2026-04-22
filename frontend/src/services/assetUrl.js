import { API_BASE_URL } from "@/services/apiClient";

function resolveOrigin(baseUrl) {
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost";

  try {
    return new URL(String(baseUrl || ""), fallbackOrigin).origin;
  } catch {
    return fallbackOrigin;
  }
}

export function resolveAssetUrl(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return "";
  }

  if (
    rawValue.startsWith("data:")
    || rawValue.startsWith("blob:")
    || /^[a-z][a-z\d+\-.]*:\/\//i.test(rawValue)
  ) {
    return rawValue;
  }

  if (!rawValue.startsWith("/")) {
    return rawValue;
  }

  return new URL(rawValue, resolveOrigin(API_BASE_URL)).toString();
}
