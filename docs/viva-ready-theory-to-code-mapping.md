# Viva-Ready Theory-to-Code Mapping

## CO1
| Theory | Code / artifact |
|---|---|
| ER modelling | `docs/er-model-and-cardinality.md` |
| normalization | `docs/relational-mapping-and-normalization-proof.md` |
| ACID / isolation / MVCC | `docs/sql-transactions-acid-isolation-mvcc.md` |
| query planning | `backend/sql/query_optimization_examples.sql`, `docs/query-plan-analysis.md` |

## CO2
| Theory | Code / artifact |
|---|---|
| CAP / consistency | `docs/sql-vs-nosql-cap-analysis.md` |
| vector search / ANN | `docs/vector-search-ann-design.md` |
| hybrid search | `docs/hybrid-search-and-rag.md` |
| outbox / idempotency / reconciliation | backend services and tests |

## CO3
| Theory | Code / artifact |
|---|---|
| FastAPI DI | `gateway/dependencies/` |
| middleware architecture | `gateway/middleware/` |
| tracing / retries | `gateway/main.py`, `gateway/services/httpClient.py` |

## CO4
| Theory | Code / artifact |
|---|---|
| Spring hardening | `docs/spring-enterprise-hardening.md` |
| validation parity | contracts + DTOs + Pydantic schemas |
| multi-framework comparison | `docs/multi-framework-comparison-node-fastapi-spring-aspnet.md` |

## CO5
| Theory | Code / artifact |
|---|---|
| bounded contexts | `docs/microservice-boundaries-and-bounded-contexts.md` |
| saga vs 2PC | `docs/distributed-transaction-comparison.md`, `docs/saga-and-compensation-design.md` |
| resilience | gateway tests + circuit breaker |

## CO6
| Theory | Code / artifact |
|---|---|
| observability | `observability/`, `docs/distributed-tracing-and-observability.md` |
| deployment | `docker-compose.yml`, `k8s/`, `deploy/helm/`, `render.yaml` |
| CI/CD | `.github/workflows/` |
