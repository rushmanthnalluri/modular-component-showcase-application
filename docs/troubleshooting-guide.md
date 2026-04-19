# Troubleshooting Guide

## Common Startup Issues

## Frontend cannot call API

- Verify `VITE_USE_GATEWAY` and `VITE_GATEWAY_URL` in `.env`.
- Check gateway health at `http://localhost:8000/health`.
- If gateway is disabled, verify backend at `http://localhost:5000/health`.

## CSRF errors on POST/PUT/DELETE

- Ensure client fetches `/api/auth/csrf` before first state-changing request.
- Confirm cookies are enabled in browser.

## JWT authentication failures

- Ensure `JWT_SECRET` is set and stable.
- Use `/api/auth/refresh` to recover expired access tokens.
- Logout/login to rotate both tokens.

## Database connectivity failures

- Verify MongoDB URI and Postgres `DATABASE_URL`.
- In local Docker, use service names (`mongo`, `postgres`) from compose.

## Docker compose fails validation

- Run `docker compose config` and fix YAML syntax first.
- Confirm all required env variables are present.

## Gateway 5xx errors

- Inspect gateway logs for downstream timeout messages.
- Tune `REQUEST_TIMEOUT_SECONDS` and `REQUEST_MAX_RETRIES`.

## CI failures

- Run local parity checks:
  - `npm run lint`
  - `npm run test`
  - `npm run test:ui`
  - `npm run build`
  - `docker compose config`
