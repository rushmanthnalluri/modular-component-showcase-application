# Multi-Framework Proof Pack

## Framework Roles

| Framework | Role in repo |
|---|---|
| Node.js + Express | primary domain API, persistence orchestration, hybrid search |
| FastAPI | gateway ingress, proxying, rate limiting, resilience, metrics |
| Spring Boot | enterprise Java CRUD, JWT security, Actuator, OpenAPI, Prometheus |

## Node vs Spring vs FastAPI Comparison Matrix

| Concern | Node.js | Spring Boot | FastAPI |
|---|---|---|---|
| Main responsibility | domain APIs and data workflows | enterprise service layer | ingress and gateway orchestration |
| Validation style | custom validators and route guards | Jakarta validation on DTOs | Pydantic request/response models |
| Security | JWT middleware and route checks | Spring Security + method auth | gateway authz and forwarding rules |
| Observability | custom health and metrics | Actuator + Micrometer | FastAPI health/metrics middleware |

## DTO Parity Proof

Representative parity for component listing:

| Surface | Evidence |
|---|---|
| Spring | `ComponentResponse`, `/spring/components`, `contracts/openapi-spring.yaml` |
| Backend | component routes and `contracts/openapi-backend.yaml` |
| Gateway | forwards and validates ingress path behavior in `contracts/openapi-gateway.yaml` |

## Validation Parity Proof

| Validation concern | Spring | Backend | Gateway |
|---|---|---|---|
| required auth fields | `AuthRequest` with Bean Validation | login route validation | proxy contract and gateway checks |
| protected CRUD routes | `@PreAuthorize` | JWT/auth middleware | gateway RBAC and forwarding tests |
| health and readiness | `/actuator/health` | `/health` | `/health`, `/readyz`, `/livez` |

## Spring Screenshot Placeholders

Reserved filenames live in `docs/screenshots/multi-framework/README.md`.
