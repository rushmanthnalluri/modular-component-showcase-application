# Backend and Data Architecture

## Runtime Services

- React frontend (`src`)
- Express backend (`backend/src`)
- PostgreSQL catalog storage (`users`, `categories`, `components`)
- MongoDB interaction storage (`reviews`, `discussions`, `usage_logs`, `embeddings`)

## API Surface

- Core API: `/api/*`
- SQL catalog API: `/api/sql/*`
- Mongo utility/search API: `/api/mongo/*`
- Top-level aliases: `/api/search`, `/api/embeddings`, `/api/logs`, `/api/reviews`, `/api/discussions`

## Data Ownership

### PostgreSQL

Relational data with constraints and joins:

- `users`
- `categories`
- `components`

Files:

- `backend/src/sql/db.js`
- `backend/src/sql/initSchema.js`
- `backend/src/services/sqlCatalogService.js`
- `backend/src/routes/sqlRoutes.js`

### MongoDB

Document and activity data:

- component descriptions
- semantic embeddings
- usage logs
- reviews
- discussions

Files:

- `backend/src/models/appModels.js`
- `backend/src/routes/mongoRoutes.js`
- `backend/src/routes/reviewsRoutes.js`
- `backend/src/routes/discussionsRoutes.js`
- `backend/src/services/vectorSearchService.js`

## Health Behavior

`GET /health` returns:

- `status`
- `mongo` (boolean)
- `postgres` (boolean)
- `mode`

## Local Verification

- Backend tests: `cd backend && npm test`
- Root lint: `npm run lint`
- Frontend build: `npm run build`
