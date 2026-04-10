
# Modular Component Showcase Application

A full-stack React and Node.js platform for exploring, previewing, and publishing reusable UI components.

It includes a local curated showcase and cloud-backed custom components, with authentication, role-based actions, favorites, ratings/reviews, and discussion support.

## Live URLs

- Frontend: https://rushmanthnalluri.github.io/modular-component-showcase-application/
- Backend API base: https://modular-component-showcase-application.onrender.com/api
- Health endpoint: https://modular-component-showcase-application.onrender.com/health

## Core Features

- Component gallery with category filtering and search
- Detail page with preview, code blocks, and playground controls
- Custom component submission for developer/admin roles
- Favorites sync for authenticated users
- Ratings and review workflows
- Component discussions
- Tutorial/content endpoints and admin content management
- Contact/support ticket flow with captcha support
- Light/dark theme support and responsive layout

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Radix Toast
- Lucide React
- React Syntax Highlighter

### Backend
- Express 5
- MongoDB + Mongoose
- JWT + cookie-based sessions
- bcryptjs
- Nodemailer

### Security
- CSRF token enforcement for `/api` write operations
- CORS allowlist
- Helmet hardening
- Route-specific rate limiting
- Input validation/sanitization for auth, components, and support payloads

### Deployment
- GitHub Pages (frontend)
- Render (backend)
- GitHub Actions (CI, CodeQL, Pages deploy)

## Project Structure

```text
.
├─ src/
│  ├─ assets/
│  ├─ components/
│  ├─ context/
│  ├─ data/
│  ├─ demos/
│  ├─ hooks/
│  ├─ pages/
│  ├─ services/
│  ├─ App.jsx
│  └─ main.jsx
├─ backend/
│  ├─ src/
│  │  ├─ controller/
│  │  ├─ middleware/
│  │  ├─ model/
│  │  ├─ routes/
│  │  └─ utils/
│  └─ tests/
├─ public/
├─ .github/workflows/
├─ package.json
├─ vite.config.js
└─ README.md
```

## Local Setup

### 1) Install dependencies

```bash
npm install
```

Root install triggers backend install via `postinstall`.

### 2) Configure frontend env

Create `.env` in repo root:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3) Configure backend env

Create `backend/.env`:

```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
FRONTEND_ORIGINS=http://localhost:8080,http://localhost:5173
ALLOW_MEMORY_FALLBACK=true
SMTP_USER=your_email_user
SMTP_PASS=your_email_password
SMTP_FROM=no-reply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### 4) Run locally

Backend:

```bash
npm run start
```

Frontend:

```bash
npm run dev
```

Local URLs:

- Frontend: http://localhost:8080
- Backend: http://localhost:5000

## Scripts

- `npm run dev`: start frontend dev server
- `npm run start`: start backend server (root script proxies to backend)
- `npm run build`: production frontend build
- `npm run preview`: preview built frontend
- `npm run lint`: ESLint
- `npm run test`: backend tests
- `npm run test:ui`: frontend tests
- `npm run test:all`: backend + frontend tests

## API Overview

### System
- `GET /health`

### Auth
- `GET /api/auth/csrf`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`

### Components
- `GET /api/components`
- `GET /api/components/:id`
- `POST /api/components`
- `PUT /api/components/:id`
- `DELETE /api/components/:id`
- `GET /api/components/stats/most-viewed`
- `GET /api/components/stats/top-rated`
- `POST /api/components/:id/ratings`
- `GET /api/components/:id/reviews`
- `POST /api/components/:id/reviews`
- `GET /api/components/:id/discussions`
- `POST /api/components/:id/discussions`

### Users
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users/me/dashboard`
- `GET /api/users/me/favorites`
- `POST /api/users/me/favorites/:componentId`

### Content and Support
- `GET /api/content/tutorials`
- `GET /api/content/tutorials/:slug`
- `POST /api/email/send`
- `GET /api/captcha/getcaptcha/:length`

## Security Notes

- `/api` requests are routed through cookie parsing, CSRF cookie issuance, and CSRF validation before state-changing handlers run.
- Auth, component write, user update, and support endpoints all require token-backed requests from the frontend.
- The repository has had a CodeQL `missing-token-validation` false positive on the middleware chain before; the current `/api` router structure is the intended protection pattern.

## Deployment Notes

- Pushing to `main` triggers CI and frontend deployment workflows.
- Frontend base path is configured for GitHub Pages:
  `/modular-component-showcase-application/`
- Backend runs independently on Render and is consumed by the frontend through API endpoints.

## Author

Rushmanth Nalluri
