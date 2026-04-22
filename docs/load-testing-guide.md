# Load Testing Guide

## Tooling
- k6 script: tests/load/k6-smoke.js

## Local Run
k6 run tests/load/k6-smoke.js

## CI Integration
- Run in non-blocking stage first.
- Promote to blocking gate after baseline stabilization.

## Metrics to Capture
- p50/p95 latency
- Error rate
- Throughput
- Saturation indicators (CPU, memory, DB connections)
