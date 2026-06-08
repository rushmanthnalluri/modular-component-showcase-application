# Deployment Checklist

## Pre-Deploy
- CI passing for frontend, backend, gateway, Spring, contracts, and security.
- `docker compose config` valid.
- Helm lint and Kubernetes manifest validation green.
- environment variables loaded for all services.
- Atlas Search and Vector Search indexes created or fallback accepted.

## Image Validation
- build frontend image
- build backend image
- build gateway image
- build springboot image

## Health and Metrics
- backend `/health` and `/metrics`
- gateway `/health`, `/readyz`, `/livez`, `/metrics?format=prometheus`
- Spring `/actuator/health` and `/actuator/prometheus`
- Prometheus targets healthy
- Grafana dashboard loading

## Functional Smoke
- auth flow
- component listing and details
- favorites/reviews/discussions
- Spring demo
- vector semantic search
- hybrid search
- reconciliation status

## Rollback Trigger
- error rate > 5% for 10 minutes
- repeated health failure across replicas
- severe search/index regression

## Screenshot Placeholders
- `[Placeholder] Render deployment success`
- `[Placeholder] Prometheus targets healthy`
- `[Placeholder] Grafana dashboard`
