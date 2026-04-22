# Microservices Proof Pack

## Service Boundaries

| Bounded context | Owning surface |
|---|---|
| Frontend UX and composition | `frontend/` |
| Ingress, rate limiting, resilience | `gateway/` |
| Domain operations and persistence orchestration | `backend/` |
| Enterprise Java service path | `spring-service/` |
| Observability pipeline | `observability/` |

## Dependency Graph Placeholders

Reserved filenames live in `docs/screenshots/microservices/README.md`.

## Saga Flow Diagram Placeholder

Reserved filename: `docs/screenshots/microservices/saga-flow-diagram.png`

Suggested flow to show:

```text
Client action -> backend command -> SQL write -> outbox event -> search/index update -> reconciliation or compensation on failure
```

## Failure Mode Matrix

| Failure mode | Mitigation already in repo |
|---|---|
| backend timeout | gateway retry and circuit breaker tests |
| vector provider unavailable | deterministic embedding fallback |
| SQL drift between stores | reconciliation and outbox patterns |
| partial deployment issue | health checks, blue-green guide, rollback notes |

## Distributed Tracing Placeholders

Reserved filename: `docs/screenshots/microservices/distributed-trace-waterfall.png`

## Token Forwarding Placeholder

Reserved filename: `docs/screenshots/microservices/token-forwarding-proof.png`
