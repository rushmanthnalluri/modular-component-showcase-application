# Enterprise Hardening Guide

This document captures the hardening controls implemented in this repository and how to verify them.

## Implemented Controls

1. Route authorization hardening
- `/tutorials/manage` is protected by both authenticated and admin guards.
- `/admin/sql` remains protected by both authenticated and admin guards.
- Non-admin access attempts produce a warning toast and are redirected safely.

2. Explicit degraded-mode signaling
- Local fallback flows now emit a browser event and a toast notification:
  - captcha fallback in `authAccess`
  - local favorites fallback in `favoritesService`
  - local ratings/reviews/discussions fallback in `componentEngagementService`
  - tutorial content fallback in `contentService`

3. Degraded-mode telemetry
- Frontend sends best-effort telemetry to `/api/mongo/logs` using event type `CLIENT_DEGRADED_MODE`.
- Failures in telemetry submission are intentionally non-blocking.

4. Backend startup validation
- In production, backend startup now requires:
  - `MONGODB_URI`
  - `DATABASE_URL`
  - `JWT_SECRET` (minimum 32 characters)
  - configured CORS origins

5. Discussion sync correctness
- Discussion creation now syncs SQL using the public component id when available.
- Regression test added to lock this behavior.

6. CI quality hardening
- GitHub Actions CI uses Node 20 LTS.
- CI runs lint, backend tests, frontend tests, and build.

7. Compose resilience hardening
- Added health checks for frontend, backend, and mongo.
- Added `restart: unless-stopped` to core services.
- Backend waits for healthy postgres and mongo before startup.

## Validation Commands

Run from repository root:

```bash
npm run lint
npm run test
npm run test:ui
npm run build
```

Expected outcome: all commands pass.

## Notes

- Degraded mode is visible to users by design to avoid silent behavior changes.
- Fallback behavior remains available to preserve continuity when backend services are unavailable.
- Gateway runtime and env wiring were removed because the app now uses the direct backend path exclusively.
