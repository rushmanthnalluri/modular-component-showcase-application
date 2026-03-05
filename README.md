# Modular Component Showcase Application

A professional full-stack platform for browsing, previewing, and contributing reusable UI components.

## Live Access

- App: https://rushmanthnalluri.github.io/modular-component-showcase-application/
- API Base: https://modular-component-showcase-application.onrender.com/api
- API Health: https://modular-component-showcase-application.onrender.com/health

## Highlights

- Discover components with search and category filters
- Share discovery links using query-based URLs (for example `?q=button&category=forms`)
- View component details and code examples
- Register and login with role-based access controls
- Add custom components through protected workflows
- Reset passwords through a working forgot-password flow
- Support dark/light theme preferences and toast notifications
- SEO-ready metadata, robots policy, and sitemap for better global discoverability

## Architecture

### Frontend

- React 18 + Vite
- React Router for route-level pages
- Service layer for API/auth abstraction

### Backend

- Node.js + Express
- MongoDB (Atlas) with safe fallback behavior
- JWT-based authentication and protected endpoints
- CORS, Helmet, and rate limiting for API hardening

### Delivery

- GitHub Pages for frontend hosting
- Render for backend hosting
- GitHub Actions for automated frontend deployment

## Repository Structure

```text
src/
  components/          reusable UI components
  context/             app-level context providers
  data/                static component dataset
  pages/               route pages
  services/            API and auth integration
backend/
  app.js               Express server and routes
scripts/
  verify-connection.mjs
  verify-connection-auto.mjs
  verify-all.mjs
```

## Local Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure frontend environment

Create a `.env` file at the project root:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3) Configure backend environment

Copy `backend/.env.example` to `backend/.env` and provide values.

Recommended:

- `PORT=5000`
- `MONGODB_URI=<your_mongodb_connection_string>`
- `JWT_SECRET=<long_random_secret>`
- `FRONTEND_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:8081`
- `ALLOW_MEMORY_FALLBACK=true` (local only; set to `false` in production)

### 4) Run the app

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm --prefix backend run start
```

## NPM Scripts

- `npm run dev` — run Vite development server
- `npm run build` — build production frontend bundle
- `npm run preview` — preview production build
- `npm run lint` — run ESLint
- `npm run start` — start backend via root script
- `npm run verify:connection` — verify API connectivity
- `npm run verify:connection:auto` — auto-detect frontend URL and verify
- `npm run verify:all` — end-to-end local verification flow

## API Summary

### Health

- `GET /health`

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`

### Components

- `GET /api/components`
- `POST /api/components` (authenticated + authorized)

## Deployment

### Backend (Render)

- Render service config is defined in `render.yaml`
- Ensure environment variables are configured:
  - `MONGODB_URI`
  - `FRONTEND_ORIGINS` (include your GitHub Pages domain)
  - `JWT_SECRET` (recommended for token continuity)

### Frontend (GitHub Pages)

- Workflow file: `.github/workflows/deploy-pages.yml`
- The workflow supports:
  - Manual `api_base_url` override via workflow dispatch
  - Fallback API URL when no override is supplied
- SEO/discovery assets are served from `public/robots.txt` and `public/sitemap.xml`

## Quality and Verification

Run these checks before deployment:

```bash
npm run lint
npm run build
npm run verify:all
```

## Troubleshooting

### Register/Login fails in browser

- Verify backend is healthy at `/health`
- Confirm `FRONTEND_ORIGINS` includes your frontend origin
- Ensure deployed frontend points to the correct backend API URL

### Forgot password fails

- Confirm backend deployment includes `POST /api/auth/forgot-password`
- Validate email + phone combination matches an existing account

### Components appear empty

- Verify `GET /api/components` responds successfully
- Confirm frontend API base URL is set correctly

---

Maintained as a production-oriented learning and showcase platform for modular UI development.

