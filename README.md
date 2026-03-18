# Modular Component Showcase Application

## Description

A SPA designed to demonstrate reusable UI components, their interactions, and behavior under different configurations. Focus is on component modularity, controlled state variations, prop-driven rendering, routing, and performance optimization. This is a meta-engineering project, ideal for practicing engineering concepts across all COs.

## Key Architecture Goals

- Modular component library with reusable and configurable UI elements.
- Controlled state and props to manage dynamic behavior.
- Route-based organization of component categories or demos.
- Asynchronous simulation of interactions or dynamic data updates.
- Performance optimization for multiple interactive components.
- Conditional rendering to demonstrate different component states.
- Accessibility-ready components with keyboard and focus handling.

## Major Features

- Library of reusable UI components (buttons, cards, tables, charts).
- Interactive demos showcasing controlled state and prop variations.
- Route-based navigation across component categories.
- Async simulation of interactions or data feeding.
- Conditional rendering for different component states and variants.
- Performance-optimized rendering for multiple interactive demos.
- Accessible demos with focus management and keyboard support.

This implementation is delivered as a full-stack React + Express application for discovering reusable UI components, previewing source code, and contributing custom components through authenticated workflows.

## Live URLs

- Frontend: https://rushmanthnalluri.github.io/modular-component-showcase-application/
- Backend API: https://modular-component-showcase-application.onrender.com/api
- Health check: https://modular-component-showcase-application.onrender.com/health

## Implementation Highlights

- Component gallery with search and category filters.
- Component detail pages with protected code-view route.
- Auth system: register, login, forgot-password reset.
- Session auth via secure `httpOnly` cookie with CSRF protection for cookie-authenticated writes.
- Role-based component submission (developer/admin or verified developer).
- Owner/admin component deletion.
- Contact page support ticket flow via backend email API (with mailto fallback).
- Captcha endpoint support.
- Theme + toast support and SEO assets (`public/robots.txt`, `public/sitemap.xml`).
- Verification scripts for frontend/backend connectivity and protected API flows.

## Tech Stack

- Frontend: React 18, Vite, React Router, Radix Toast, Lucide.
- Backend: Express 5, Mongoose, JWT, bcryptjs, Nodemailer.
- Security: CORS, Helmet, express-rate-limit.
- Data: MongoDB Atlas with optional in-memory fallback for local development.
- Deploy: GitHub Pages (frontend), Render (backend).

## Project Structure

```text
.
|- src/
|  |- components/
|  |- context/
|  |- data/
|  |- pages/
|  |- services/
|  |- App.jsx
|  `- main.jsx
|- backend/
|  |- src/
|  |  |- app.js
|  |  |- controller/
|  |  |- middleware/
|  |  |- model/
|  |  |- routes/
|  |  `- utils/
|  `- tests/
|- scripts/
|  |- verify-connection.mjs
|  |- verify-connection-auto.mjs
|  `- verify-all.mjs
|- render.yaml
`- package.json
```

## Getting Started

### 1. Prerequisites

- Node.js 20+
- npm 9+

### 2. Install dependencies

Run from this folder:

```bash
npm install
```

Note: root `postinstall` runs `npm --prefix backend install`.

### 3. Configure environment variables

Create a frontend `.env` at project root:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
# Optional: base backend origin used by src/lib.js
# VITE_API_URL=http://localhost:5000
```

Create backend env file:

```powershell
Copy-Item backend/.env.example backend/.env
```

Or:

```bash
cp backend/.env.example backend/.env
```

Recommended `backend/.env` values:

- `PORT=5000`
- `MONGODB_URI=<your_atlas_connection_string>`
- `JWT_SECRET=<long_random_secret>`
- `FRONTEND_ORIGINS=http://localhost:8080,http://localhost:8081,http://localhost:5173,https://rushmanthnalluri.github.io`
- `ALLOW_MEMORY_FALLBACK=true` (non-production only)
- `SMTP_USER=<smtp_username>` (optional)
- `SMTP_PASS=<smtp_password>` (optional)
- `SMTP_FROM=no-reply@yourdomain.com` (optional)

SMTP credentials are optional. If omitted, support ticket creation still works but email delivery is skipped.

### 4. Run the app (two terminals)

Terminal 1 (backend):

```bash
npm run start
```

Terminal 2 (frontend):

```bash
npm run dev
```

Defaults:

- Frontend: `http://localhost:8080` (from `vite.config.js`)
- Backend: `http://localhost:5000`

Optional backend watch mode:

```bash
npm --prefix backend run dev
```

## Scripts

Root scripts:

- `npm run dev` - Start Vite dev server.
- `npm run build` - Build frontend.
- `npm run preview` - Preview built frontend.
- `npm run lint` - Run ESLint.
- `npm run test:frontend` - Run Vitest frontend unit tests.
- `npm run test` - Run frontend and backend tests.
- `npm run start` - Start backend (`backend/src/app.js`).
- `npm run verify:connection` - Verify frontend + backend + auth + create/list component flow.
- `npm run verify:connection:auto` - Detect a live local frontend URL, then verify.
- `npm run verify:all` - Start backend and frontend, wait for readiness, then verify.
- `npm run review:smoke` - Start backend and frontend, smoke-check key SPA routes, then run verify flow.
- `npm run cleanup:verifier` - Remove persisted verifier components from MongoDB.

Backend scripts:

- `npm --prefix backend run start`
- `npm --prefix backend run dev`
- `npm --prefix backend run cleanup:verifier -- --dry-run`

## API Overview

Health:

- `GET /health`

Authentication:

- `GET /api/auth/csrf`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password` (email + phone + newPassword)

Components:

- `GET /api/components`
- `POST /api/components` (auth required + developer/admin)
- `DELETE /api/components/:id` (auth required + owner/admin)

Captcha:

- `GET /captcha/getcaptcha/:length`
- `GET /api/captcha/getcaptcha/:length`

Support ticket email:

- `POST /api/email/send`

Security note:

- Cookie-authenticated write requests require `X-CSRF-Token` with the token from `/api/auth/csrf`.
- Bearer-token requests are still supported for verification tooling.

## Frontend Routes

- `/`
- `/category/:categoryId`
- `/component/:id`
- `/component/:id/code` (protected)
- `/add-component` (protected)
- `/contact`
- `/about`
- `/privacy`
- `/terms`
- `/help`
- `/login`
- `/register`

## Deployment

### Backend (Render)

`render.yaml` config:

- Runtime: Node 20
- Root dir: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`
- Required env vars: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_ORIGINS`

### Frontend (GitHub Pages)

- Build with Vite.
- `vite.config.js` sets `base` from `GITHUB_REPOSITORY` in production builds.
- Ensure deployed frontend origin is included in backend `FRONTEND_ORIGINS`.
- Ensure frontend API env points to deployed backend.

## Verification

Recommended pre-release checks:

```bash
npm run lint
npm run test
npm run build
npm run verify:all
```

If you run `verify:connection` directly while frontend is on port `8080`, set:

```powershell
$env:VERIFY_FRONTEND_URL="http://localhost:8080"; npm run verify:connection
```

```bash
VERIFY_FRONTEND_URL=http://localhost:8080 npm run verify:connection
```

## Troubleshooting

### CORS errors

- Check backend `FRONTEND_ORIGINS`.
- Confirm your current frontend origin is allowed.
- Verify backend health at `/health`.

### 401 / auth issues

- Re-login to refresh token.
- Verify `JWT_SECRET` is stable across backend restarts.

### No cloud components returned

- Check `GET /api/components`.
- Check `/health` response `mode` (`atlas`, `memory`, `atlas-reconnecting`, `memory-bootstrap`).
- If API is unavailable, only local seed components will render.

### Support ticket mail not delivered

- Verify `SMTP_USER` and `SMTP_PASS`.
- Without SMTP credentials, ticket creation returns success but skips email delivery by design.

