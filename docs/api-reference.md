# API Reference

## Overview

- Base backend URL: `/api`
- Base gateway URL: `/api` (proxied through gateway)
- Auth mode: JWT access/refresh tokens in secure cookies
- CSRF: required for state-changing routes (`POST`, `PUT`, `PATCH`, `DELETE`) unless using `Authorization: Bearer`

## Health and Metrics

### `GET /health`
Returns service health and dependency status.

### `GET /metrics`
Prometheus-style metrics from backend.

### `GET /api`
API index with endpoint groups.

## Authentication

### `GET /api/auth/csrf`
Returns CSRF token payload:

```json
{ "csrfToken": "..." }
```

### `POST /api/auth/register`
Creates a new user account.

Body fields:
- `fullName`
- `email`
- `phone`
- `password`
- `role` (`user` or `developer`)

### `POST /api/auth/login`
Authenticates a user and issues `auth_token` + `refresh_token` cookies.

### `POST /api/auth/refresh`
Refreshes the access token using `refresh_token` cookie.

### `POST /api/auth/logout`
Clears auth cookies.

### `POST /api/auth/forgot-password`
Resets password with phone verification.

## Components

### `GET /api/components`
List components (supports category/filter query params).

### `GET /api/components/:id`
Fetch component details.

### `POST /api/components`
Create component (developer/admin).

### `PUT /api/components/:id`
Update component.

### `DELETE /api/components/:id`
Delete component.

### `GET /api/components/stats/most-viewed`
Top viewed components.

### `GET /api/components/stats/top-rated`
Top rated components.

## User

### `GET /api/users/me`
Current authenticated user profile.

### `PUT /api/users/me`
Update current user profile.

### `GET /api/users/me/components`
User-created components.

### `GET /api/users/me/submission-history`
Submission history.

### `GET /api/users/me/favorites`
Current favorite ids.

### `POST /api/users/me/favorites/:componentId`
Toggle favorite.

### `GET /api/users/me/favorites/components`
Favorite component details.

## Reviews and Discussions

### `GET /api/reviews`
List reviews.

### `POST /api/reviews`
Create review.

### `GET /api/discussions`
List discussions.

### `POST /api/discussions`
Create discussion.

## SQL Catalog

### `GET /api/sql/users`
List SQL users.

### `GET /api/sql/categories`
List SQL categories.

### `GET /api/sql/components`
List SQL components.

### `POST /api/sql/components`
Create SQL component.

### `PUT /api/sql/components/:componentId`
Update SQL component.

### `DELETE /api/sql/components/:componentId`
Delete SQL component.

## Content and Tutorials

### `GET /api/content/tutorials`
Published tutorial summaries.

### `GET /api/content/tutorials/:slug`
Published tutorial detail.

### `POST /api/content/tutorials`
Create tutorial (admin).

### `PUT /api/content/tutorials/:slug`
Update tutorial (admin).

### `DELETE /api/content/tutorials/:slug`
Delete tutorial (admin).

## Admin

### `GET /api/admin/rate-limits`
Rate-limit counters (admin).

### `GET /api/admin/dashboard`
Aggregated dashboard counts, top viewed/rated components, and rate-limit snapshots (admin).
