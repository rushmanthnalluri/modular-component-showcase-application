import assert from "node:assert/strict";
import test from "node:test";
import { createIdempotencyService } from "../services/idempotencyService.js";

test("idempotency service reuses committed payloads", () => {
  const service = createIdempotencyService({ ttlMs: 1000 });
  const reserve = service.reserve({ scope: "test", key: "abc" });
  assert.equal(reserve.ok, true);

  service.commit({ composite: reserve.composite, payload: { ok: true }, statusCode: 201 });

  const secondReserve = service.reserve({ scope: "test", key: "abc" });
  assert.equal(secondReserve.ok, false);
  assert.deepEqual(secondReserve.cached, { ok: true });
});
