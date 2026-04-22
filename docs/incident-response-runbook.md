# Incident Response Runbook

## Severity Levels
- SEV1: Complete outage or data integrity risk.
- SEV2: Major degraded functionality.
- SEV3: Partial service degradation.

## First 15 Minutes
1. Confirm blast radius via health endpoints and logs.
2. Freeze risky deployments.
3. Assign incident commander, communications lead, and ops lead.

## Recovery Steps
1. Roll back to last known good deployment.
2. Restore database if integrity compromised.
3. Reconcile mirrored data stores.

## Post-Incident
- Produce timeline and root cause analysis.
- Add preventative tests and monitoring alerts.
