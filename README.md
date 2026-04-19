# Modular Component Showcase Application

A full-stack React and Node.js platform for exploring reusable UI components, seeding them into MongoDB/PostgreSQL, and supporting authenticated feedback workflows.

The project combines a curated showcase with backend-backed features such as favorites, ratings, reviews, discussions, semantic search, and an admin SQL view.

## Academic Context

This repository is our full-stack implementation for the modular component showcase problem statement.

It is designed to satisfy two subject tracks at once:

- Front-End Engineering & Framework Design: component thinking, state management, routing, forms, accessibility, performance, testing, and deployment.
- Database / Backend Engineering: relational modelling, normalization, MongoDB document design, polyglot persistence, API design, vector search, testing, and container-ready delivery.

The README focuses on the actual code in this repository while also making the academic mapping explicit for faculty review.

## Problem Statement

Design a system that showcases reusable UI components and allows users to explore, test, and interact with them.

The system must support:

- Display of modular components
- Categorization and organization
- Interactive previews
- Documentation for each component
- Intelligent search based on functionality and use case

## Common Project Requirements Mapping

The implementation follows the expected project sequence:

1. Problem understanding
	- Identify the component showcase workflow, user actions, and data entities.
2. Initial data modeling
	- Model showcase components with reusable metadata, preview details, engagement data, and admin content.
3. Database classification
	- PostgreSQL stores structured relational records.
	- MongoDB stores document content, logs, and embeddings.
4. Normalization
	- Relational data is normalized into catalog tables for users, categories, and components.
5. Database implementation
	- SQL tables, keys, constraints, and indexes are implemented alongside MongoDB collections.
6. Backend development
	- The Express backend exposes REST APIs for catalogue, engagement, search, and utility flows.
7. Vector search implementation
	- Embeddings are stored in MongoDB and retrieved through semantic search logic.
8. API integration
	- The frontend consumes APIs through a FastAPI gateway (default) with direct backend fallback.
9. Deployment
	- The app is prepared for GitHub Pages and Render.
10. Testing
	- Backend integration tests and frontend/unit tests validate the implementation.
11. Documentation
	- This README and the database architecture notes document the design decisions.

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

## Course Outcome Alignment

### Front-End Engineering & Framework Design

#### CO1: Foundations of Front-End Engineering & Framework Design

- Uses a component-driven UI to show how reusable building blocks solve complexity in a large interface.
- Demonstrates unidirectional data flow through React state, props, and service-based data access.
- Applies rendering and reconciliation concepts through reusable components, route views, and controlled refresh patterns.

#### CO2: JavaScript & TypeScript Engineering for Frameworks

- Uses ES6+ modules, async/await, closures, and functional UI logic across the frontend and service layer.
- Organizes the application into pages, services, hooks, context, and shared components.
- Uses clear module boundaries to keep UI logic, state logic, and API logic separate.

#### CO3: React Component Model

- Treats components as deterministic UI functions with props as configuration and state as runtime data.
- Uses composition for cards, layout, forms, search, and engagement flows.
- Reinforces reusable component design through the showcase gallery itself.

#### CO4: State Architecture, Async Data Engineering & API Integration

- Uses service layers for API requests instead of placing all logic inside components.
- Handles async data for reviews, discussions, search, and favorites through controlled loading and error flows.
- Demonstrates derived state, co-located state, and global auth/theme state where appropriate.

#### CO5: Routing, Forms, Accessibility & Performance Engineering

- Uses SPA routing for public pages, auth pages, detail pages, and admin views.
- Implements controlled forms, validation, keyboard-friendly UI patterns, and accessible interaction states.
- Uses performance-conscious patterns such as modular routes, data wrappers, and route-based loading.

#### CO6: Build Systems, Testing, CI/CD & Deployment Engineering

- Uses Vite for frontend development and build output.
- Uses linting and automated backend/frontend tests.
- Deploys the frontend to GitHub Pages and the backend to Render.

### Database / Backend Engineering

#### CO1: Relational Database Engineering

- Uses PostgreSQL for structured entities such as users, categories, and components.
- Applies schema design, normalization, primary/foreign keys, constraints, and indexes.
- Documents the database layer and the catalog model in the architecture notes.

#### CO2: Database Engineering

- Uses MongoDB for component descriptions, embeddings, logs, reviews, and discussions.
- Demonstrates SQL vs NoSQL classification based on structure, update patterns, and retrieval needs.
- Shows polyglot persistence by syncing selected user and engagement data to PostgreSQL.

#### CO3: Backend API Engineering

- Implements REST endpoints, validation, authentication, rate limiting, and route layering in Express.
- Exposes clean API contracts for components, reviews, discussions, search, SQL admin, and content.
- Supports semantic retrieval over MongoDB-stored embeddings.

#### CO4: Multi-Framework Backend Engineering

- Uses Node.js and Express as the backend implementation in this repository.
- Applies middleware, modular routing, database services, and security layers in a layered backend structure.
- Demonstrates the same architectural concerns expected in multi-framework backend design: service boundaries, data access layers, and request handling.

#### CO5: Microservices Engineering

- Separates frontend, backend API, SQL catalog logic, and MongoDB utility logic into distinct layers.
- Uses API boundaries to isolate stateful content, search, and relational catalogue operations.
- Prepares the project for containerized deployment and independent backend hosting.

#### CO6: Deployment, Observability & Delivery

- Uses Docker-ready backend structure and production deployment targets.
- Includes health checks, rate limiting, security headers, and test coverage.
- Provides documentation for setup, verification, and architecture review.

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
- Access/refresh token lifecycle with `/api/auth/refresh`
- Mongo SRV fallback for environments where DNS SRV lookup fails

## Gateway Integration

- Frontend defaults to gateway routing when `VITE_USE_GATEWAY=true`.
- Gateway forwards `/api/*` traffic to backend while preserving cookies and query params.
- This keeps client code stable and enables service-layer observability in one entry point.

## Data Design Summary

### SQL (PostgreSQL)

Structured relational data:

- `users`
- `categories`
- `components`

Why SQL:

- These entities have stable relationships and benefit from keys, constraints, joins, and normalization.
- They represent the catalog and account data that must stay consistent across the app.

### MongoDB

Document and search-oriented data:

- `component_descriptions`
- `component_embeddings`
- `usage_logs`
- reviews and discussions

Why MongoDB:

- These records are flexible, text-heavy, and evolve more frequently than the normalized catalog.
- Embeddings and log-style records are better stored as documents for semantic search and activity history.

### Normalization Notes

- The SQL layer is normalized so that repeated component metadata is not duplicated across the database.
- Foreign keys keep component/category/user relationships explicit.
- Indexes support lookup, filtering, and admin operations.

## Vector Search

- Embeddings are stored in MongoDB collections.
- Semantic search compares query vectors against stored embeddings to return relevant components.
- The app supports both keyword search and semantic retrieval so users can find components by intent, not only by exact name.

## Repository Layout

```text
.
├─ frontend/
│  ├─ src/
│  ├─ public/
│  ├─ tests/
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ vite.config.js
│  ├─ eslint.config.js
│  ├─ jsconfig.json
│  ├─ index.html
│  ├─ .env
│  └─ .env.example
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
├─ docker/
├─ scripts/
├─ .github/workflows/
├─ render.yaml
├─ docker-compose.yml
├─ .gitignore
├─ .env.example
└─ README.md
```

## Local Setup

### 1) Install dependencies

```bash
npm install
cd frontend && npm install
```

Frontend dependencies live under `frontend/`; backend and gateway dependencies are installed separately.

### 2) Configure frontend env

Create `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GATEWAY_URL=http://localhost:8000
VITE_USE_GATEWAY=true
```

### 3) Configure backend and gateway env

Use the service-specific `.env.example` files:

```bash
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/modular_components
SQL_AUTO_MIGRATE=true
JWT_SECRET=your_secure_jwt_secret
FRONTEND_ORIGINS=http://localhost:8080,http://localhost:5173
ALLOW_MEMORY_FALLBACK=true
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
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
BACKEND_URL=http://localhost:5000
GATEWAY_PORT=8000
REQUEST_TIMEOUT_SECONDS=20
REQUEST_MAX_RETRIES=2
```

Root `.env.example` now holds only shared monorepo metadata.

### 4) Run locally

Backend:

```bash
cd backend && npm run start
```

Frontend:

```bash
cd frontend && npm run dev
```

Local URLs:

- Frontend: http://localhost:8080
- Backend: http://localhost:5000
- Gateway: http://localhost:8000

Docker Compose:

```bash
docker compose up --build
```

### 5) Seed showcase data

```bash
npm --prefix backend run seed:showcase
```

This seeds the curated showcase components into MongoDB and PostgreSQL.

## Additional Documentation

- `docs/api-reference.md`
- `docs/troubleshooting-guide.md`
- `docs/database-backup-guide.md`
- `docs/monitoring-guide.md`
- `docs/performance-tuning-guide.md`

## Scripts

Frontend:

- `cd frontend && npm run dev`: start the Vite frontend dev server
- `cd frontend && npm run build`: build the frontend for production
- `cd frontend && npm run preview`: preview the production frontend build
- `cd frontend && npm run lint`: run ESLint
- `cd frontend && npm run test`: run frontend tests
- `cd frontend && npm run test:ui`: run frontend tests
- `cd frontend && npm run predeploy`: create the production frontend build for Pages
- `cd frontend && npm run deploy`: publish `dist` to GitHub Pages

Backend:

- `npm --prefix backend run start`: start the Express API
- `npm --prefix backend run dev`: start the backend with nodemon
- `npm --prefix backend run test`: run backend integration/unit tests
- `npm --prefix backend run seed:showcase`: seed showcase components into MongoDB and PostgreSQL

Gateway:

- `python gateway/run.py`: start the FastAPI gateway
- `uvicorn main:app --reload` from `gateway/`: run the gateway in reload mode

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
- `POST /api/email/send`
- `GET /captcha/getcaptcha/:length`

## Deployment Notes

- GitHub Pages hosts the frontend.
- Render hosts the frontend static build, backend API, and gateway service.
- Frontend base path is configured for `/modular-component-showcase-application/`.
- Frontend Render deployment uses `frontend/` as its root directory.
- Backend Render deployment uses `backend/` as its root directory.
- Gateway Render deployment uses `gateway/` as its root directory.
- The backend accepts `MONGODB_URI`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGINS`, and `SQL_AUTO_MIGRATE` in production.
- If using MongoDB Atlas, provide an SRV connection string and allow Render access in the Atlas network rules.
- Docker Compose builds the frontend, backend, and gateway from their service directories.

## Testing and Verification

- Frontend tests: `cd frontend && npm run test:ui`
- Backend tests: `npm --prefix backend run test`
- Gateway tests: `cd gateway && pytest -q`
- Full test pass: `cd frontend && npm run test:ui` and `npm --prefix backend run test`
- Showcase seed verification: `npm --prefix backend run seed:showcase`

## Architectural Justification

- SQL is used for entities that require relational integrity and reporting.
- MongoDB is used for flexible content, logs, and embeddings.
- The Express backend acts as the integration layer that serves the frontend and coordinates data access.
- The service split keeps UI concerns, catalog concerns, and semantic-search concerns separate.
- The design is intended to demonstrate the engineering tradeoffs described in the course handouts, not just the final UI.

## Architecture Notes

- Backend/data architecture: [docs/database-layer-extension.md](docs/database-layer-extension.md)

## Author

Rushmanth Nalluri
