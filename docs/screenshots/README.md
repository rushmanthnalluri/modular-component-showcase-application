# Screenshot Placeholder Index

This directory is the faculty-evidence drop zone for final screenshots that cannot be captured from source code alone.

## Manifests

- `atlas/README.md`: Atlas Search and Vector Search live UI evidence.
- `database/README.md`: SQL execution plans, lock behavior, and index-usage captures.
- `vector/README.md`: semantic retrieval, ANN diagrams, and vector benchmark captures.
- `api/README.md`: response schema, tracing, JWT, RBAC, and resilience captures.
- `multi-framework/README.md`: Spring UI, Spring Security, and Actuator captures.
- `microservices/README.md`: service dependency, tracing, saga, and token-forwarding captures.
- `deployment/README.md`: Prometheus, Grafana, Jaeger, CI/CD, Docker, Kubernetes, and Render captures.

## Naming Rule

Capture the final screenshot using the exact filename listed in each manifest. That keeps CI artifact uploads and viva references stable.
