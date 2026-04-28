# Final Rubric Proof

This file maps the implementation to the rubric so the evaluator can see where each outcome is proven.

| CO | What is implemented | Evidence locations |
|---|---|---|
| CO1 | Database design, normalization, integrity constraints, and relational justification | [docs/database-design.md](database-design.md), [backend/src/sql/initSchema.js](../backend/src/sql/initSchema.js), [docs/database-proof-pack.md](database-proof-pack.md) |
| CO2 | SQL vs MongoDB split, vector embeddings, semantic retrieval, and similarity scoring | [docs/database-design.md](database-design.md), [docs/vector-search.md](vector-search.md), [backend/src/routes/mongoRoutes.js](../backend/src/routes/mongoRoutes.js), [backend/src/services/vectorSearchService.js](../backend/src/services/vectorSearchService.js) |
| CO3 | FastAPI gateway, JWT flow, CSRF, rate limiting, secure headers, and cookie handling | [docs/security.md](security.md), [docs/gateway-security-model.md](gateway-security-model.md), [gateway/main.py](../gateway/main.py), [backend/src/middleware/csrf.js](../backend/src/middleware/csrf.js) |
| CO4 | Node.js backend orchestration and Spring Boot service presence | [backend/src/app.js](../backend/src/app.js), [spring-service/README.md](../spring-service/README.md), [docs/spring-verification-report.md](spring-verification-report.md) |
| CO5 | Microservice decomposition, gateway routing, and request lifecycle | [docs/architecture.md](architecture.md), [docs/gateway-architecture.md](gateway-architecture.md), [docs/microservices-proof-pack.md](microservices-proof-pack.md) |
| CO6 | Docker, CI/CD, deployment support, and repeatable validation | [docker-compose.yml](../docker-compose.yml), [render.yaml](../render.yaml), [deploy/helm](../deploy/helm), [docs/deployment-guide.md](deployment-guide.md) |

## What The Evaluator Can Verify Quickly

- The architecture is documented with request flow and service boundaries.
- The database split is justified by workload type.
- Vector search is visible in the UI and accessible via `GET /api/search?q=...`.
- Security controls are documented and linked to code.
- A concrete benchmark report is available.
- A demo script walks through the exact marks-friendly story.
