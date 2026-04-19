# Performance Tuning Guide

## Frontend

- Keep route-level lazy loading enabled.
- Avoid refetching unchanged resource lists.
- Prefer memoized derived state for heavy page filters.

## Backend

- Tune Postgres pool variables:
  - `PG_POOL_MAX`
  - `PG_IDLE_TIMEOUT_MS`
  - `PG_CONNECT_TIMEOUT_MS`
- Ensure indexes cover common list/filter routes.
- Monitor Mongo query latency for semantic search and logs.

## Gateway

- Set `REQUEST_TIMEOUT_SECONDS` to realistic upstream SLA.
- Keep `REQUEST_MAX_RETRIES` low (2-3) to avoid cascading pressure.
- Use health checks to prevent routing to unhealthy instances.

## Docker

- Keep images minimal and deterministic (`npm ci --omit=dev`).
- Use health checks and readiness controls.

## Validation Workflow

- Baseline before optimization:
  - endpoint latency
  - 95th percentile
  - error rate
- Apply one change at a time.
- Compare metrics after each change.
