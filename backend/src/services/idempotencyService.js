function now() {
  return Date.now();
}

export function createIdempotencyService({ ttlMs = 10 * 60 * 1000 } = {}) {
  const store = new Map();

  function cleanupExpired() {
    const current = now();
    for (const [key, value] of store.entries()) {
      if (value.expiresAt <= current) {
        store.delete(key);
      }
    }
  }

  function makeKey(scope, key) {
    return `${String(scope || "global")}:${String(key || "")}`;
  }

  function reserve({ scope = "global", key, fingerprint = "" }) {
    cleanupExpired();
    if (!key) {
      return { ok: false, message: "idempotency key is required" };
    }

    const composite = makeKey(scope, key);
    const existing = store.get(composite);
    if (existing) {
      if (fingerprint && existing.fingerprint && fingerprint !== existing.fingerprint) {
        return {
          ok: false,
          conflict: true,
          statusCode: 409,
          message: "idempotency key was reused with a different request payload",
        };
      }

      return {
        ok: false,
        cached: existing.payload,
        statusCode: existing.statusCode || (existing.pending ? 202 : 200),
        pending: existing.pending,
      };
    }

    store.set(composite, {
      payload: null,
      statusCode: 202,
      expiresAt: now() + ttlMs,
      pending: true,
      fingerprint,
      createdAt: new Date().toISOString(),
    });

    return { ok: true, composite };
  }

  function commit({ composite, payload, statusCode = 200 }) {
    if (!composite || !store.has(composite)) {
      return;
    }

    store.set(composite, {
      payload,
      statusCode,
      expiresAt: now() + ttlMs,
      pending: false,
      fingerprint: store.get(composite)?.fingerprint || "",
      createdAt: store.get(composite)?.createdAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
  }

  function fail({ composite }) {
    if (!composite) {
      return;
    }

    store.delete(composite);
  }

  return {
    reserve,
    commit,
    fail,
    get(composite) {
      cleanupExpired();
      return composite ? store.get(composite) || null : null;
    },
    stats() {
      cleanupExpired();
      const entries = [...store.values()];
      return {
        total: entries.length,
        pending: entries.filter((entry) => entry.pending).length,
        committed: entries.filter((entry) => !entry.pending).length,
      };
    },
  };
}

export const idempotencyService = createIdempotencyService();
