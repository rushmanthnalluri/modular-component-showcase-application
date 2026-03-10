# Modular Component Showcase Application

A full-stack React + Express application for discovering reusable UI components, viewing code examples, and contributing new components through authenticated developer workflows.

## Live URLs

- Frontend: https://rushmanthnalluri.github.io/modular-component-showcase-application/
- API base: https://modular-component-showcase-application.onrender.com/api
- API health: https://modular-component-showcase-application.onrender.com/health

## What This Project Includes

- Component browsing with search and category filters
- Detail and protected code-view pages per component
- Auth flows: register, login, forgot-password reset
- Role-aware component submission (`developer` or `admin` access)
- Toast notifications and theme context support
- SEO assets in `public/robots.txt` and `public/sitemap.xml`
- Verification scripts for frontend/backend connectivity and protected API flow

## Tech Stack

- Frontend: React 18, Vite, React Router
- Backend: Express 5, Mongoose, JWT, bcrypt
- Security and API hardening: CORS, Helmet, express-rate-limit
- Database strategy: MongoDB Atlas with optional in-memory fallback for local resilience
- Hosting: GitHub Pages (frontend), Render (backend)

## Project Structure

```text
.
|- src/
|  |- components/       # UI building blocks
|  |- context/          # Theme/context providers
|  |- data/             # Local seed/static showcase data
|  |- pages/            # Route-level screens
|  |- services/         # API/auth/storage helpers
|  |- App.jsx           # Main route configuration
|  `- main.jsx          # App bootstrap
|- backend/
|  |- app.js            # Express app, auth, components APIs
|  |- controller/       # Captcha and email endpoints
|  `- model/            # Captcha and email manager utilities
|- scripts/
|  |- verify-connection.mjs
|  |- verify-connection-auto.mjs
|  `- verify-all.mjs
|- render.yaml          # Render service config
`- package.json         # Root scripts and frontend deps
```

## Local Development

### 1. Prerequisites

- Node.js 20+
- npm 9+

### 2. Install dependencies

From project root:

```bash
npm install
```

Note: root `postinstall` also installs backend dependencies.

### 3. Configure environment variables

### Frontend (`.env` at project root)

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)

Create from template:

```powershell
Copy-Item backend/.env.example backend/.env
```

```bash
cp backend/.env.example backend/.env
```

Recommended values:

- `PORT=5000`
- `MONGODB_URI=<your_atlas_connection_string>`
- `JWT_SECRET=<long_random_secret>`
- `FRONTEND_ORIGINS=http://localhost:5173,http://localhost:8080,http://localhost:8081`
- `ALLOW_MEMORY_FALLBACK=true` (use `false` in production)

### 4. Start frontend and backend

Frontend (root):

```bash
npm run dev
```

Backend (root):

```bash
npm run start
```

Optional backend watch mode:

```bash
npm --prefix backend run dev
```

## NPM Scripts

Root scripts:

- `npm run dev` - Start Vite dev server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production frontend build
- `npm run lint` - Run ESLint
- `npm run start` - Start backend (`backend/app.js`)
- `npm run verify:connection` - Verify frontend reachability + API auth/component flow
- `npm run verify:connection:auto` - Auto-detect frontend URL then run verification
- `npm run verify:all` - Start backend + frontend and run full verification

Backend scripts:

- `npm --prefix backend run start` - Start backend server
- `npm --prefix backend run dev` - Start backend with nodemon

## API Endpoints

Health:

- `GET /health`

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`

Components:

- `GET /api/components`
- `POST /api/components` (requires bearer token and developer/admin access)

Other routers:

- `/captcha` and `/api/captcha`
- `/api/email`

## Frontend Routes

- `/`
- `/component/:id`
- `/component/:id/code` (protected)
- `/add-component` (protected)
- `/contact`, `/about`, `/privacy`, `/terms`, `/help`
- `/login`, `/register`

## Deployment Notes

### Backend (Render)

- Service definition exists in `render.yaml`
- Runtime: Node 20
- Root dir: `backend`
- Health check: `/health`
- Required env vars on Render: `MONGODB_URI`, `FRONTEND_ORIGINS`, `JWT_SECRET`

### Frontend (GitHub Pages)

- Deploy from built Vite assets
- Ensure frontend is configured with the correct backend API base URL
- Keep `FRONTEND_ORIGINS` in backend aligned with deployed frontend origin(s)

## Verification Checklist

Run before release:

```bash
npm run lint
npm run build
npm run verify:all
```

## Troubleshooting

Auth requests fail:

- Check backend health at `/health`
- Confirm current frontend origin is listed in `FRONTEND_ORIGINS`
- Verify frontend `VITE_API_BASE_URL` target

No components returned:

- Confirm `GET /api/components` works directly
- Check backend DB mode in `/health` response (`atlas`, `memory`, or reconnecting states)

Forgot password fails:

- Ensure email exists and phone matches stored account phone
- Confirm backend includes `POST /api/auth/forgot-password`

---

Maintained as a modular UI showcase platform with practical full-stack auth and deployment workflows.

