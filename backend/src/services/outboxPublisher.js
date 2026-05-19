import { EventEmitter } from "node:events";
import crypto from "node:crypto";
import { hasSqlConnectionConfig, sqlQuery } from "../sql/db.js";

const emitter = new EventEmitter();
const outboxStore = new Map();

function baseEvent(event) {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    type: String(event?.type || "UNKNOWN"),
    source: String(event?.source || "backend"),
    payload: event?.payload || {},
    metadata: event?.metadata || {},
    createdAt: new Date().toISOString(),
    status: "pending",
    attempts: 0,
    lastError: null,
  };
}

export function publishOutboxEvent(event) {
  const normalized = {
    ...baseEvent(event),
    dedupeKey: String(event?.dedupeKey || "").trim(),
  };

  outboxStore.set(normalized.id, normalized);
  persistOutboxEvent(normalized);
  emitter.emit("outbox_event", normalized);
  return normalized;
}

function persistOutboxEvent(event) {
  if (!hasSqlConnectionConfig()) {
    return;
  }

  sqlQuery(
    `INSERT INTO service_outbox (
        event_id, event_type, event_source, payload, metadata, status, attempts, created_at
     ) VALUES (
        $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8::timestamptz
     )
     ON CONFLICT (event_id) DO UPDATE SET
        status = EXCLUDED.status,
        attempts = EXCLUDED.attempts,
        metadata = EXCLUDED.metadata`,
    [
      event.id,
      event.type,
      event.source,
      JSON.stringify(event.payload || {}),
      JSON.stringify({ ...(event.metadata || {}), dedupeKey: event.dedupeKey || "" }),
      event.status,
      event.attempts,
      event.createdAt,
    ]
  ).catch((error) => {
    console.warn(`Skipping PostgreSQL outbox persistence: ${error.message}`);
  });
}

export function subscribeOutbox(listener) {
  emitter.on("outbox_event", listener);
  return () => emitter.off("outbox_event", listener);
}

export function acknowledgeOutboxEvent(eventId) {
  const existing = outboxStore.get(eventId);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    status: "acknowledged",
    attempts: existing.attempts + 1,
    acknowledgedAt: new Date().toISOString(),
  };
  outboxStore.set(eventId, updated);
  return updated;
}

export function failOutboxEvent(eventId, error) {
  const existing = outboxStore.get(eventId);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    status: "failed",
    attempts: existing.attempts + 1,
    lastError: String(error || "unknown error"),
    failedAt: new Date().toISOString(),
  };
  outboxStore.set(eventId, updated);
  return updated;
}

export function listOutboxEvents({ status, type } = {}) {
  return [...outboxStore.values()].filter((event) => {
    if (status && event.status !== status) {
      return false;
    }

    if (type && event.type !== type) {
      return false;
    }

    return true;
  });
}

export function getOutboxStats() {
  const events = [...outboxStore.values()];
  return {
    total: events.length,
    pending: events.filter((event) => event.status === "pending").length,
    acknowledged: events.filter((event) => event.status === "acknowledged").length,
    failed: events.filter((event) => event.status === "failed").length,
  };
}
