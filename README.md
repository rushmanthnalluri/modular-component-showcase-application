# Modular Component Showcase Application

## Description

A SPA designed to demonstrate reusable UI components, their interactions, and behavior under different configurations. Focus is on component modularity, controlled state variations, prop-driven rendering, routing, and performance optimization. This is a meta-engineering project, ideal for practicing engineering concepts.

## Key Architecture Goals

- Modular component library with reusable and configurable UI elements.
- Controlled state and props to manage dynamic behavior.
- Route-based organization of component categories or demos.
- Asynchronous simulation of interactions or dynamic data updates.
- Performance optimization for multiple interactive components.
- Conditional rendering to demonstrate different component states.
- Accessibility-ready components with keyboard and focus handling.

## Major Features

- Library of reusable UI components (buttons, cards, data displays).
- Interactive demos showcasing controlled state and prop variations.
- Route-based navigation across component categories.
- Async simulation of data feeding and interactions.
- Conditional rendering for different component states and variants.
- Performance-optimized rendering for interactive demos.
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
- Role-based component submission (developer/admin).
- Owner/admin component deletion.
- Contact page support ticket flow via backend email API (with mailto fallback).
- Captcha endpoint support.
- Theme + toast support and SEO assets.

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
```

Create backend env file:

```bash
cp backend/.env.example backend/.env
```

Recommended `backend/.env` values:

- `PORT=5000`
- `MONGODB_URI=<your_atlas_connection_string>`
- `JWT_SECRET=<long_random_secret>`
- `FRONTEND_ORIGINS=http://localhost:8080,http://localhost:8081,http://localhost:5173,https://rushmanthnalluri.github.io`
- `ALLOW_MEMORY_FALLBACK=true` (non-production only)

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

## Scripts

- `npm run dev` - Start Vite dev server.
- `npm run build` - Build frontend.
- `npm run preview` - Preview built frontend.
- `npm run lint` - Run ESLint.
- `npm run test` - Run all frontend and backend tests.
- `npm run start` - Start backend application.

## API Overview

Health:
- `GET /health`

Authentication:
- `GET /api/auth/csrf`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`

Components:
- `GET /api/components`
- `POST /api/components` (Auth required)
- `DELETE /api/components/:id` (Auth required + Owner/Admin)

Support:
- `POST /api/email/send`
- `GET /api/captcha/getcaptcha/:length`

## Troubleshooting

### CORS errors
- Check backend `FRONTEND_ORIGINS`.
- Confirm your current frontend origin is allowed.

### Auth issues
- Re-login to refresh token.
- Verify `JWT_SECRET` is stable across backend restarts.
