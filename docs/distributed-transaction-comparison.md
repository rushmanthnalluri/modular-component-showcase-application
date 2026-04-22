# Distributed Transaction Comparison

## 2PC
- Strong consistency but higher coordination overhead and lower availability under partition.

## Saga
- Eventual consistency with compensating actions.
- Better fit for independently deployable services.

## Recommendation for This Repository
- Prefer saga + outbox + idempotency.
- Avoid cross-service 2PC in runtime path.
