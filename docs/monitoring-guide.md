# Monitoring Guide

## Health Endpoints

- Backend: `/health`
- Gateway: `/health`

## Metrics Endpoints

- Backend Prometheus text metrics: `/metrics`
- Gateway JSON metrics: `/metrics`

## What to Alert On

- Health status not `ok` / `healthy`
- Sustained increase in `app_errors_total`
- Spikes in `app_rate_limited_total`
- Gateway downstream service availability reported as `down`
- P95 latency above acceptable threshold

## Logging

- Backend uses structured JSON logs (Winston).
- Include and propagate `x-request-id` to correlate requests.
- Capture logs centrally in your deployment platform.

## Suggested Dashboards

- Request volume (per minute)
- Error rate (5xx)
- Rate-limited requests
- Health status by dependency (mongo, postgres, backend, gateway)
- Top slow endpoints
