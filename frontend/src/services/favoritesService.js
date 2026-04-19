import { apiRequest } from "@/services/apiClient";
import {
  mapBackendIdsToLocal,
  resolveBackendComponentId,
} from "@/services/componentLookupService";

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
      const localIds = mapBackendIdsToLocal(payload.favorites).map(String);
      writeLocal(localIds);
      return localIds;
    }
  } catch {
    // fall back to local
  }

  return readLocal();
}

export async function toggleFavorite(componentId) {
  const id = String(componentId || "").trim();
  if (!id) return readLocal();
  const backendId = await resolveBackendComponentId(id, { allowRefresh: true });

  try {
    const payload = await apiRequest(`/users/me/favorites/${encodeURIComponent(backendId || id)}`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (payload && Array.isArray(payload.favorites)) {
      const localIds = mapBackendIdsToLocal(payload.favorites).map(String);
      writeLocal(localIds);
      return localIds;
    }
  } catch {
    // local-only toggle if backend not reachable / not logged in
  }

  const existing = readLocal();
  const next = existing.includes(id) ? existing.filter((x) => x !== id) : [...existing, id];
  writeLocal(next);
  return next;
}

