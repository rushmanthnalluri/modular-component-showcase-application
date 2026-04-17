# Modular Component Showcase Application

A full-stack React and Node.js platform for exploring reusable UI components, seeding them into MongoDB/PostgreSQL, and supporting authenticated feedback workflows.

The project combines a curated showcase with backend-backed features such as favorites, ratings, reviews, discussions, semantic search, and an admin SQL view.

## Live URLs

- Frontend: https://rushmanthnalluri.github.io/modular-component-showcase-application/
- Backend API: https://modular-component-showcase-application.onrender.com/api
- Health endpoint: https://modular-component-showcase-application.onrender.com/health

## What This Project Does

- Displays a curated component showcase with search and category filtering
- Shows component details with preview, code, and responsive/accessibility notes
- Supports favorites, ratings, reviews, and discussions for authenticated users
- Syncs selected user interactions into PostgreSQL for reporting and admin views
- Supports semantic search and Mongo-backed content utilities
- Includes SQL admin pages and backend seeding for showcase data
- Provides captcha-protected support/email flows

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Lucide React
- Radix Toast
- React Syntax Highlighter

### Backend
- Express 5
- MongoDB + Mongoose
- PostgreSQL + `pg`
- JWT auth with cookie sessions
- bcryptjs
- Nodemailer
- express-rate-limit

### Security and Reliability
- CSRF protection for state-changing `/api` requests
- CORS allowlist for local and production origins
- Helmet hardening
- Route-level rate limiting
- Mongo SRV fallback for environments where DNS SRV lookup fails

## Repository Layout

```text
.
├─ src/
│  ├─ components/
│  ├─ context/
│  ├─ demos/
│  ├─ hooks/
│  ├─ pages/
│  ├─ services/
│  ├─ styles/
│  ├─ tests/
│  ├─ App.jsx
│  └─ main.jsx
├─ backend/
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ scripts/
│  │  ├─ seeds/
│  │  ├─ services/
│  │  ├─ sql/
│  │  ├─ tests/
│  │  └─ utils/
│  └─ Dockerfile
├─ docs/
├─ public/
├─ .github/workflows/
└─ README.md
```

## Local Setup

### 1) Install dependencies

```bash
npm install
```

The root install also installs backend dependencies through `postinstall`.

### 2) Configure frontend env

Create a root `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3) Configure backend env

Create `backend/.env`:

```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/modular_components
SQL_AUTO_MIGRATE=true
JWT_SECRET=your_secure_jwt_secret
FRONTEND_ORIGINS=http://localhost:8080,http://localhost:5173
ALLOW_MEMORY_FALLBACK=true
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=modular_components
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

### 5) Seed showcase data

```bash
npm --prefix backend run seed:showcase
```

This seeds the curated showcase components into MongoDB and PostgreSQL.

## Scripts

Root:

- `npm run dev`: start the Vite frontend dev server
- `npm run start`: start the backend server through the root package
- `npm run build`: build the frontend for production
- `npm run preview`: preview the production frontend build
- `npm run lint`: run ESLint
- `npm run test`: run backend tests
- `npm run test:ui`: run frontend tests
- `npm run test:all`: run backend and frontend tests
- `npm run predeploy`: create the production frontend build for Pages
- `npm run deploy`: publish `dist` to GitHub Pages

Backend:

- `npm --prefix backend run start`: start the Express API
- `npm --prefix backend run dev`: start the backend with nodemon
- `npm --prefix backend run test`: run backend integration/unit tests
- `npm --prefix backend run seed:showcase`: seed showcase components into MongoDB and PostgreSQL

## API Overview

### System
- `GET /health`

### Authentication and Users
- `GET /api/auth/csrf`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users/me/favorites`
- `POST /api/users/me/favorites/:componentId`

### Components and Engagement
- `GET /api/components`
- `GET /api/components/:id`
- `POST /api/components`
- `PUT /api/components/:id`
- `DELETE /api/components/:id`
- `GET /api/components/:id/reviews`
- `POST /api/components/:id/reviews`
- `GET /api/components/:id/discussions`
- `POST /api/components/:id/discussions`
- `POST /api/components/:id/ratings`

### SQL and Mongo Utilities
- `GET /api/sql/users`
- `GET /api/sql/categories`
- `GET /api/sql/components`
- `POST /api/sql/components`
- `PUT /api/sql/components/:id`
- `DELETE /api/sql/components/:id`
- `GET /api/reviews`
- `POST /api/reviews`
- `GET /api/discussions`
- `POST /api/discussions`
- `POST /api/search`
- `GET /api/logs`
- `POST /api/embeddings`

### Content and Support
- `GET /api/content/tutorials`
- `GET /api/content/tutorials/:slug`
- `POST /api/email/send`
- `GET /captcha/getcaptcha/:length`

## Deployment Notes

- GitHub Pages hosts the frontend.
- Render hosts the backend API.
- Frontend base path is configured for `/modular-component-showcase-application/`.
- The backend accepts `MONGODB_URI`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGINS`, and `SQL_AUTO_MIGRATE` in production.
- If using MongoDB Atlas, provide an SRV connection string and allow Render access in the Atlas network rules.

## Architecture Notes

- Backend/data architecture: [docs/database-layer-extension.md](docs/database-layer-extension.md)

## Author

Rushmanth Nalluri
