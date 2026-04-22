import logger from "../utils/logger.js";
import { acknowledgeOutboxEvent, failOutboxEvent, subscribeOutbox } from "../services/outboxPublisher.js";

let unsubscribe = null;

export function startAuditEventConsumer() {
  if (unsubscribe) {
    return unsubscribe;
  }

  unsubscribe = subscribeOutbox((event) => {
    try {
      logger.info("outbox_event_received", {
        eventType: event.type,
        source: event.source,
        eventId: event.id,
      });
      acknowledgeOutboxEvent(event.id);
    } catch (error) {
      failOutboxEvent(event.id, error?.message || error);
    }
  });

  return unsubscribe;
}

export function stopAuditEventConsumer() {
  if (!unsubscribe) {
    return;
  }

  unsubscribe();
  unsubscribe = null;
}
