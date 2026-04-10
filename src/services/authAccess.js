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
  try {
    const payload = await apiRequest(`/captcha/getcaptcha/${length}`, {
      method: "GET",
    });

    return {
      ...payload,
      source: "server",
    };
  } catch {
    const text = generateLocalCaptchaText(length);
    return {
      text,
      image: buildLocalCaptchaSvg(text),
      source: "local",
    };
  }
}

function generateLocalCaptchaText(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const safeLength = Math.min(Math.max(Number(length) || 6, 4), 8);
  let value = "";
  for (let index = 0; index < safeLength; index += 1) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return value;
}

function buildLocalCaptchaSvg(text) {
  const width = 180;
  const height = 60;
  const gap = width / (text.length + 1);
  const letters = text
    .split("")
    .map((char, index) => {
      const x = Math.round(gap * (index + 1));
      const y = Math.round(height / 2 + (Math.random() * 10 - 5));
      const rotate = (Math.random() * 24 - 12).toFixed(2);
      return `<text x="${x}" y="${y}" font-size="34" font-weight="700" fill="#0f172a" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rotate}, ${x}, ${y})">${char}</text>`;
    })
    .join("");

  const noise = Array.from({ length: 60 }, () => {
    const x = Math.round(Math.random() * width);
    const y = Math.round(Math.random() * height);
    return `<circle cx="${x}" cy="${y}" r="1" fill="rgba(148,163,184,0.4)" />`;
  }).join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8fafc" />
  ${noise}
  ${letters}
</svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
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
