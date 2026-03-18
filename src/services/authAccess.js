import { apiRequest } from "@/services/apiClient";

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

export function getAuthUser() {
  return readStoredAuthUser();
}

export async function registerUser({ fullName, email, phone, password, role }) {
  await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName,
      email,
      phone,
      password,
      role,
    }),
  });
}

export async function fetchRegisterCaptcha(length = 6) {
  return apiRequest(`/captcha/getcaptcha/${length}`, {
    method: "GET",
  });
}

export async function authenticateUser({ email, password }) {
  const payload = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
  notifyAuthChange();

  return payload.user;
}

export async function forgotPassword({ email, phone, newPassword }) {
  await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({
      email,
      phone,
      newPassword,
    }),
  });
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
