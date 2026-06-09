# SLO, SLA, and Error Budget

## Service Level Objectives
- Availability SLO: 99.5% monthly for backend and gateway.
- Latency SLO: p95 < 1200ms for core read endpoints.
- Error SLO: < 1% 5xx across rolling 30 days.

## SLA Targets
- Public demo SLA: 99.0% monthly.
- Incident acknowledgment: within 15 minutes for SEV1.

## Error Budget Policy
- Monthly error budget = 0.5% downtime equivalent.
- If budget burn > 50% in first half of month, freeze risky feature releases.
