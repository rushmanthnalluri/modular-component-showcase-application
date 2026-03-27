import { apiRequest } from "@/services/apiClient";

const LOCAL_KEY = "favoriteComponentIds";

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(Array.from(new Set(ids.map(String)))));
}

export async function getFavoriteIds() {
  try {
    const payload = await apiRequest("/users/me/favorites", { method: "GET" });
    if (payload && Array.isArray(payload.favorites)) {
      writeLocal(payload.favorites);
      return payload.favorites.map(String);
    }
  } catch {
    // fall back to local
  }

  return readLocal();
}

export async function toggleFavorite(componentId) {
  const id = String(componentId || "").trim();
  if (!id) return readLocal();

  try {
    const payload = await apiRequest(`/users/me/favorites/${encodeURIComponent(id)}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (payload && Array.isArray(payload.favorites)) {
      writeLocal(payload.favorites);
      return payload.favorites.map(String);
    }
  } catch {
    // local-only toggle if backend not reachable / not logged in
  }

  const existing = readLocal();
  const next = existing.includes(id) ? existing.filter((x) => x !== id) : [...existing, id];
  writeLocal(next);
  return next;
}

