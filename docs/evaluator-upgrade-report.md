# Evaluator Upgrade Report

This document records the implementation evidence after the production-readiness upgrade.

## Fixed Build And Auth Issues

- Spring JWT parsing now uses the JJWT 0.12 API in `JwtTokenProvider`.
- Spring auth issues access and refresh tokens through `/spring/auth/token` and `/spring/auth/refresh`.
- Spring secrets are validated for minimum signing length.
- Node and gateway auth now agree on the backend cookie names: `auth_token` and `refresh_token`.
- Gateway access checks reject refresh tokens for protected access routes.

## Vector Search

- PostgreSQL pgvector table and HNSW index are defined in:
  - `backend/src/sql/initSchema.js`
  - `sql/postgres_schema.sql`
  - `springboot/src/main/resources/db/migration/V5__component_vector_embeddings.sql`
- Runtime query logic is implemented in `backend/src/services/pgVectorSearchService.js`.
- `POST /api/vector/search/semantic` uses pgvector first and falls back to MongoDB exact scoring only when pgvector is unavailable.
- The embedding seeder persists generated 128-dimensional embeddings to both MongoDB and pgvector when configured.

## Database Integrity

- PostgreSQL mirror tables now support nullable relational `component_id` foreign keys in addition to existing public Mongo component IDs.
- The sync layer detects whether migrated columns are available and safely falls back on older local databases.
- Outbox events are still emitted in memory for local subscribers and are also persisted to `service_outbox` when PostgreSQL is configured.

## Docker And CI

- Frontend Docker image now builds static production assets and serves them with Nginx on port 8080.
- Docker Compose uses `pgvector/pgvector:pg16`, health checks, shared JWT env propagation, and no required local `.env` files.
- Gateway tests run deterministically via `gateway/pytest.ini`.
- CI validates backend, frontend, gateway, Spring, Docker builds, Trivy HIGH/CRITICAL scans, CodeQL, npm audit, pip-audit, and Maven dependency-check.

## Security

- Runtime `.env` files remain ignored and are not deleted.
- Committed env examples use placeholders instead of real secrets.
- Production startup checks enforce JWT secret length in backend and gateway.
- Gateway uses route-aware protection: public reads/search are allowed, private writes remain protected.

## Verification Commands

Latest local verification:

```bash
npm run lint --workspace backend
npm test --workspace backend
npm run lint --workspace frontend
npm test --workspace frontend
npm run build --workspace frontend
py -m pytest gateway\tests -q
py -m pytest tests\verification -q
cd springboot && .\mvnw.cmd test
docker compose config --quiet
```

Docker image build note: local Docker Desktop was not running during final verification, so `docker build -f frontend/Dockerfile ...` could not connect to the Docker daemon. Compose configuration validation passed.
