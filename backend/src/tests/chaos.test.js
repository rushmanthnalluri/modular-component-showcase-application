import assert from "node:assert/strict";
import test from "node:test";
import { createIdempotencyService } from "../services/idempotencyService.js";

test("chaos resilience: repeated idempotent operation survives retries", () => {
  const service = createIdempotencyService({ ttlMs: 5_000 });
  const attempts = [];

  for (let i = 0; i < 5; i += 1) {
    const reservation = service.reserve({ scope: "chaos", key: "retryable-op" });
    attempts.push(reservation.ok);
    if (reservation.ok) {
      service.commit({ composite: reservation.composite, payload: { completed: true } });
    }
  }

  assert.equal(attempts.filter(Boolean).length, 1);
});
