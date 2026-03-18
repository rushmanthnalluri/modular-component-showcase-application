# Modular Component Showcase Application

A full-stack React + Express application for discovering reusable UI components, previewing source code, and contributing custom components through authenticated workflows.

## Live URLs

- Frontend: https://rushmanthnalluri.github.io/modular-component-showcase-application/
- Backend API: https://modular-component-showcase-application.onrender.com/api
- Health check: https://modular-component-showcase-application.onrender.com/health

## Features

- Component gallery with search and category filters.
- Component detail pages with protected code-view route.
- Auth system: register, login, forgot-password reset.
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
|  |- app.js
|  |- controller/
|  `- model/
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
- `npm run start` - Start backend (`backend/app.js`).
- `npm run verify:connection` - Verify frontend + backend + auth + create/list component flow.
- `npm run verify:connection:auto` - Detect a live local frontend URL, then verify.
- `npm run verify:all` - Start backend and frontend, wait for readiness, then verify.

Backend scripts:

- `npm --prefix backend run start`
- `npm --prefix backend run dev`

## API Overview

Health:

- `GET /health`

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
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

## Frontend Routes

- `/`
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

