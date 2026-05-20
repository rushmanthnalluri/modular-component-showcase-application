# TODO — Fix distributed stack 404s

## Step 1: Trace + fix frontend gateway base URL
- [x] Edit `frontend/src/services/apiClient.js` to eliminate double `/api/api` and missing `/api` issues.
- [ ] Ensure production build never calls localhost.
- [ ] Validate by searching built assets (after build) for `localhost` and `/api/api`.

## Step 2: Fix FastAPI gateway routing for expected frontend endpoints
- [x] Add explicit gateway routes/aliases for:
  - [x] `GET/PUT /api/profile`
  - [x] `GET /api/dashboard`
  - [x] `GET /api/admin/sql/*` (via `/api/admin/sql/{full_path}`)
- [ ] Forward these routes to the correct upstream service URLs.
- [ ] Ensure JWT/cookie verification works (or is bypassed for public where required).

## Step 3: Add regression tests
- [ ] Add/extend `gateway/tests` to assert 200/forwarding for the above paths.


## Step 4: Spring Boot endpoint audit (only after routing works)
- [ ] Confirm Spring Boot controller mappings for `/profile`, `/dashboard`, `/admin/sql/*`.
- [ ] Confirm Spring Security rules for roles.

## Step 5: Database connectivity validation (only after routing works)
- [ ] Validate NeonDB JDBC + SSL config and schema existence.
- [ ] Validate Mongo Atlas URI and semantic search collections.

## Step 6: End-to-end validation
- [ ] Login works
- [ ] Profile loads
- [ ] Developer dashboard loads
- [ ] SQL admin loads
- [ ] Components + semantic search + favorites work

## Step 7: Hardening
- [ ] No localhost URLs remain
- [ ] No secrets overwritten
- [ ] Commit with: `fix(production): repair distributed backend routing and deployment`

