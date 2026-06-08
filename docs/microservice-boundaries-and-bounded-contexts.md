# Microservice Boundaries and Bounded Contexts

## Context Map
| Context | Responsibility | Primary repo area |
|---|---|---|
| Frontend | UX, routing, API consumption | `frontend/` |
| Gateway | ingress, policy, tracing, retries | `gateway/` |
| Backend | business workflows, Mongo + SQL sync, vector search | `backend/` |
| Spring | enterprise Java CRUD parity and metrics | `springboot/` |
| Observability | scrape, dashboards, tracing | `observability/` |

## Boundary Rules
1. Gateway owns ingress policy, not business persistence.
2. Backend owns cross-store sync and reconciliation.
3. Spring owns only its published Java service surface.
4. Contracts are the public integration boundary.

## Service Ownership Matrix
| Capability | Gateway | Backend | Spring |
|---|---|---|---|
| Trace propagation | A | C | C |
| Business writes | - | A | A on Spring routes |
| Vector search | C | A | - |
| SQL proof features | - | A | C |
| Metrics | A | A | A |

## Saga Over 2PC
The repo prefers saga, outbox, idempotency, and reconciliation over distributed 2PC because the system spans heterogeneous stores and independent services.

## Failure Modes
- downstream timeout -> gateway retry/circuit breaker
- duplicate retry -> idempotency fingerprint
- drift between Mongo and SQL -> reconciliation endpoint

## Message Broker Roadmap
Current proof uses an in-process outbox publisher/consumer. Production upgrade path can move this to RabbitMQ or Kafka without redesigning the domain.
