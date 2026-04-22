import { publishOutboxEvent } from "../services/outboxPublisher.js";
import { EVENT_TYPES } from "../events/eventCatalog.js";

export function publishComponentCreated(payload) {
  return publishOutboxEvent({
    type: EVENT_TYPES.COMPONENT_CREATED,
    source: "backend.components",
    payload,
  });
}

export function publishComponentUpdated(payload) {
  return publishOutboxEvent({
    type: EVENT_TYPES.COMPONENT_UPDATED,
    source: "backend.components",
    payload,
  });
}

export function publishComponentDeleted(payload) {
  return publishOutboxEvent({
    type: EVENT_TYPES.COMPONENT_DELETED,
    source: "backend.components",
    payload,
  });
}

export function publishVectorEmbeddingUpserted(payload) {
  return publishOutboxEvent({
    type: EVENT_TYPES.VECTOR_EMBEDDING_UPSERTED,
    source: "backend.vector",
    payload,
  });
}
