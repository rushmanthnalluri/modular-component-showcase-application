# Deployment Proof Pack

## Evidence Sources

- CI workflows: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/workflows/security.yml`
- Container and platform configs: `docker-compose.yml`, `render.yaml`, `k8s/`, `deploy/helm/modular-showcase/`
- Ops docs: `docs/deployment-guide.md`, `docs/deployment-checklist.md`, `docs/blue-green-deployment.md`, `docs/distributed-tracing-and-observability.md`, `docs/owasp-top10-mapping.md`, `docs/slo-sla-error-budget.md`

## Screenshot Placeholders

Reserved filenames live in `docs/screenshots/deployment/README.md`.

## OWASP Evidence Table

| OWASP concern | Repo evidence |
|---|---|
| A01 Broken Access Control | JWT/RBAC tests in gateway and Spring |
| A02 Cryptographic Failures | JWT secret handling and secure token flow docs |
| A05 Security Misconfiguration | security workflow, Docker health checks, Render env blueprint |
| A06 Vulnerable Components | dependency audit, pip-audit, CodeQL, Trivy |
| A09 Logging and Monitoring Failures | Prometheus, Grafana, Jaeger, OTEL collector configs |

## SLO/SLA Matrix

| Metric | Target |
|---|---|
| Gateway and backend health probes | healthy before traffic cutover |
| Spring health probe | `GET /actuator/health` returns `UP` |
| Error budget review | tracked through `docs/slo-sla-error-budget.md` |
| Rollback readiness | previous good image/chart/deployment available |

## Rollback Proof

Use one of the following for final viva evidence:

- Helm rollback command and release history
- Render deployment history with previous healthy deploy
- Blue-green deployment checklist from `docs/blue-green-deployment.md`
- Docker Compose revert to previous tagged image set
