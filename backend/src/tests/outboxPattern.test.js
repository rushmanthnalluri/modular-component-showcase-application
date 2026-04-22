import assert from "node:assert/strict";
import test from "node:test";
import { publishOutboxEvent, subscribeOutbox } from "../services/outboxPublisher.js";

test("outbox publisher emits events to subscribers", async () => {
  const captured = [];
  const unsubscribe = subscribeOutbox((event) => captured.push(event));
  const published = publishOutboxEvent({ type: "component.created", payload: { id: "c1" } });

  unsubscribe();

  assert.equal(captured.length, 1);
  assert.equal(captured[0].id, published.id);
  assert.equal(captured[0].type, "component.created");
});
