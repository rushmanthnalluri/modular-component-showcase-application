# Distributed Tracing and Observability

## Flow
```text
Browser -> Gateway -> Backend / Spring
Gateway + Backend + Spring -> OTEL Collector -> Jaeger / Prometheus / Grafana
```

## Evidence
- gateway trace propagation middleware
- backend metrics endpoint
- Spring actuator prometheus endpoint
- Prometheus scrape config
- Grafana dashboard JSON
- Jaeger exporter via OTEL collector

## Screenshot Placeholders
- `[Placeholder] Prometheus targets healthy`
- `[Placeholder] Grafana dashboard`
- `[Placeholder] Jaeger trace waterfall`
