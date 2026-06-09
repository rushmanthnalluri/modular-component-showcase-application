import { apiRequest, backendApiRequest, backendRequest } from "@/services/apiClient";

const AUTH_USER_KEY = "authUser";

function readStoredAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function notifyAuthChange() {
  window.dispatchEvent(new Event("auth-state-changed"));
}

export function updateStoredAuthUser(nextUser) {
  if (!nextUser) {
    return;
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
  notifyAuthChange();
}

export function getAuthUser() {
  return readStoredAuthUser();
}

export async function registerUser({
  fullName,
  email,
  phone,
  password,
  role,
  bio = "",
  avatarImage = "",
  socialLinks = {},
  emailPreferences = {},
}) {
  const request = {
    method: "POST",
    body: JSON.stringify({
      fullName,
      email,
      phone,
      password,
      role,
      bio,
      avatarImage,
      socialLinks,
      emailPreferences,
    }),
  };

  await apiRequest("/auth/register", request);
}

export async function fetchRegisterCaptcha(length = 6) {
  const requestConfig = { method: "GET" };

  const payload = await apiRequest(`/api/captcha/getcaptcha/${length}`, requestConfig);
  if (payload?.text && payload?.image) {
    return {
      text: String(payload.text),
      image: String(payload.image),
    };
  }

  throw new Error("Captcha service unavailable. Please refresh.");
}

export async function authenticateUser({ email, password }) {
  const request = {
    method: "POST",
    body: JSON.stringify({ email, password }),
  };

  const payload = await apiRequest("/auth/login", request);

  if (payload?.token) {
    localStorage.setItem("authToken", payload.token);
  }

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
  notifyAuthChange();

  return payload.user;
}

export async function forgotPassword({ email, phone, newPassword }) {
  const request = {
    method: "POST",
    body: JSON.stringify({
      email,
      phone,
      newPassword,
    }),
  };

  await apiRequest("/auth/forgot-password", request);
}

export async function logoutUser() {
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } catch {
    // Clear local auth state even when the backend session has already expired.
  }

  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem("authToken");
  notifyAuthChange();
}

export function subscribeToAuthUser(onChange) {
  const emitState = () => {
    onChange(readStoredAuthUser());
  };

  const handleStorage = (event) => {
    if (!event.key || event.key === AUTH_USER_KEY) {
      emitState();
    }
  };

  const handleCustom = () => {
    emitState();
  };

  emitState();
  window.addEventListener("storage", handleStorage);
  window.addEventListener("auth-state-changed", handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("auth-state-changed", handleCustom);
  };
}

export function canAccessAddComponent(user) {
  if (!user) {
    return false;
  }

  const role = String(user.role || "").toLowerCase();
  const isVerifiedDeveloper = Boolean(user.isVerifiedDeveloper);
  return role === "admin" || role === "developer" || isVerifiedDeveloper;
}
