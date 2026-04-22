# Blue-Green Deployment

## Strategy
- Blue = current production stack.
- Green = candidate release stack.
- Route traffic to green after health and smoke verification.

## Cutover Steps
1. Deploy green environment.
2. Run health checks and k6 smoke tests.
3. Shift traffic gradually via platform routing.
4. Monitor error and latency for 15 minutes.

## Rollback
- Immediate traffic switch back to blue if thresholds breached.
