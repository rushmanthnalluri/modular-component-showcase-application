# Modular Component Showcase Application

A full-stack component showcase platform built with React and Vite, with authentication, protected actions, and backend API integration.

## Overview

This project provides a catalog of reusable UI components with:

- Component discovery (search, category filtering, detail/code views)
- User authentication (register/login)
- Protected component submission for authorized users
- Theme persistence and toast notifications

## Tech Stack

- Frontend: React 18, React Router, Vite
- Backend: Node.js, Express, MongoDB (Atlas with memory fallback)
- Tooling: ESLint, GitHub Actions, Render

## Project Structure

```text
src/
  components/        # Reusable UI components
  context/           # Theme and shared context
  data/              # Local component data
  pages/             # Route-level pages
  services/          # API/auth/component data access
  App.jsx
  main.jsx
backend/
  app.js             # API server
  package.json
scripts/
  verify-connection.mjs
  verify-connection-auto.mjs
  verify-all.mjs
```

## Local Development

1. Create frontend env file:

```bash
# .env
VITE_API_BASE_URL=http://localhost:5000/api
```

2. Create backend env file from `backend/.env.example` and set required values.

3. Install and run:

```bash
npm install
npm run dev
```

Backend only:

```bash
npm --prefix backend install
npm --prefix backend run start
```

## Available Scripts

- `npm run dev` - start frontend dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run lint checks
- `npm run verify:connection` - verify frontend-backend connectivity
- `npm run verify:connection:auto` - auto-detect frontend URL and verify connectivity
- `npm run verify:all` - start services and run end-to-end verification

## Deployment

### Backend (Render)

- Service configuration is defined in `render.yaml`.
- Required environment variables:
  - `MONGODB_URI`
  - `FRONTEND_ORIGINS`
  - `JWT_SECRET` (or allow generated value where applicable)

### Frontend (GitHub Pages)

- GitHub Actions workflow: `.github/workflows/deploy-pages.yml`
- Set repository variable/secret:
  - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`

## Notes

- API health endpoint: `/health`
- Large bundle chunk warnings can be improved later with route-level code splitting.

