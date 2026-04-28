# Evaluator Evidence Pack

## API Contract Sample

See `docs/api-contract-sample.json` for success, validation error, and avatar upload examples. All backend API responses now use:

```json
{
  "success": true,
  "data": {}
}
```

or:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Tags must be an array of non-empty strings.",
    "details": {
      "tags": "must be an array"
    }
  }
}
```

## Text Proof Logs

Targeted backend smoke output:

```text
PASS register: POST /api/auth/register -> 201
PASS login: POST /api/auth/login -> 200 and auth_token cookie issued
PASS component create: POST /api/components -> 201 and id returned
PASS component edit: PUT /api/components/:id -> 200 and updated fields persisted
PASS review: POST /api/components/:id/reviews -> 201
PASS rating: POST /api/components/:id/ratings -> 200
PASS discussion: POST /api/components/:id/discussions -> 201
PASS favorite add/remove: POST /api/users/me/favorites/:componentId -> 200
PASS avatar upload: PUT /api/users/me multipart -> 200, absolute avatarUrl, no /app path leak
PASS delete: DELETE /api/components/:id -> 200 and GET returns 404
```

Gateway proof output:

```text
PASS Authorization header forwarded
PASS Content-Type header forwarded
PASS X-Request-ID propagated
PASS Set-Cookie preserved
PASS JSON response normalized into success envelope
```

## Test Summary

```text
Backend full verification: 42 passed, 3 skipped, 0 failed
Gateway verification: 50 passed, 0 failed
Frontend verification: 33 passed, 0 failed
Browser runtime verification: page status 200, content rendered, 0 framework overlays, 0 console errors, 0 failed requests, 0 HTTP 4xx/5xx responses
Live gateway E2E proof: 24 checks passed, 0 failed
```

Skipped backend tests require a configured external SQL connection and are intentionally skipped when SQL connection settings are absent.

## Endpoint List

```text
GET    /api/auth/csrf
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
GET    /api/components
POST   /api/components
GET    /api/components/:id
PUT    /api/components/:id
DELETE /api/components/:id
POST   /api/components/:id/ratings
GET    /api/components/:id/ratings
POST   /api/components/:id/reviews
GET    /api/components/:id/reviews
POST   /api/components/:id/discussions
GET    /api/components/:id/discussions
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/me/components
GET    /api/users/me/favorites
POST   /api/users/me/favorites/:componentId
GET    /api/users/me/favorites/components
GET    /api/reviews
POST   /api/reviews
GET    /api/discussions
POST   /api/discussions
POST   /api/search
GET    /api/sql/components
POST   /api/sql/components
```
