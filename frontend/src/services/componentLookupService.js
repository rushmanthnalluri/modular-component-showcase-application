import { apiRequest } from "@/services/apiClient";
import { components as localComponents } from "@/data/components.data";

const localToBackendId = new Map();
const backendToLocalId = new Map();
const localByNameKey = new Map();
let lookupReady = false;
let lookupPromise = null;

function normalizeNameKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

for (const item of localComponents) {
  localByNameKey.set(normalizeNameKey(item.name), item.id);
}

function registerLookupLink(localId, backendId) {
  const safeLocalId = String(localId || "").trim();
  const safeBackendId = String(backendId || "").trim();
  if (!safeLocalId || !safeBackendId) {
    return;
  }

  localToBackendId.set(safeLocalId, safeBackendId);
  backendToLocalId.set(safeBackendId, safeLocalId);
}

export function registerBackendComponents(backendComponents = []) {
  backendComponents.forEach((item) => {
    const backendId = String(item?.id || "").trim();
    if (!backendId) {
      return;
    }

    const sameIdLocalExists = localComponents.some((localItem) => localItem.id === backendId);
    if (sameIdLocalExists) {
      registerLookupLink(backendId, backendId);
      return;
    }

    const normalizedName = normalizeNameKey(item?.name || "");
    const localIdByName = localByNameKey.get(normalizedName);
    if (localIdByName) {
      registerLookupLink(localIdByName, backendId);
    }
  });

  lookupReady = true;
}

export async function preloadComponentLookup(force = false) {
  if (lookupReady && !force) {
    return;
  }

  if (!force && lookupPromise) {
    await lookupPromise;
    return;
  }

  lookupPromise = (async () => {
    try {
      const payload = await apiRequest("/components", { method: "GET" });
      const collection = Array.isArray(payload) ? payload : payload?.items;
      if (Array.isArray(collection)) {
        registerBackendComponents(collection);
      }
    } catch {
      // Keep lookup empty and allow fallback behavior.
    } finally {
      lookupPromise = null;
    }
  })();

  await lookupPromise;
}

export async function resolveBackendComponentId(localComponentId, options = {}) {
  const localId = String(localComponentId || "").trim();
  if (!localId) {
    return "";
  }

  const direct = localToBackendId.get(localId);
  if (direct) {
    return direct;
  }

  if (options.localName) {
    const localIdByName = localByNameKey.get(normalizeNameKey(options.localName));
    if (localIdByName) {
      const mapped = localToBackendId.get(localIdByName);
      if (mapped) {
        return mapped;
      }
    }
  }

  if (options.allowRefresh !== false) {
    await preloadComponentLookup();
    return localToBackendId.get(localId) || localId;
  }

  return localId;
}

export function mapBackendIdsToLocal(ids = []) {
  return ids.map((id) => backendToLocalId.get(String(id)) || String(id));
}

export function getKnownBackendId(localId) {
  return localToBackendId.get(String(localId || "")) || "";
}
