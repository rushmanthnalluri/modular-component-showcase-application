# Modular Component Showcase Application

<div align="center">

### A production-style full-stack platform for discovering, previewing, reviewing, and managing reusable UI components

Modern monorepo architecture built with **React + Vite**, **Node.js + Express**, and an optional **FastAPI gateway**, backed by **Neon PostgreSQL** and **MongoDB Atlas**, containerized with **Docker**, and deployment-ready for **Render** with **GitHub Actions CI/CD**.

[![CI](https://img.shields.io/github/actions/workflow/status/rushmanthnalluri/modular-component-showcase-application/ci.yml?branch=main&label=CI&logo=githubactions)](https://github.com/rushmanthnalluri/modular-component-showcase-application/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/rushmanthnalluri/modular-component-showcase-application/deploy-pages.yml?branch=main&label=GitHub%20Pages&logo=githubactions)](https://github.com/rushmanthnalluri/modular-component-showcase-application/actions/workflows/deploy-pages.yml)
[![License](https://img.shields.io/github/license/rushmanthnalluri/modular-component-showcase-application?color=2563eb)](#license)
[![Last Commit](https://img.shields.io/github/last-commit/rushmanthnalluri/modular-component-showcase-application)](https://github.com/rushmanthnalluri/modular-component-showcase-application/commits/main)
[![Repo Size](https://img.shields.io/github/repo-size/rushmanthnalluri/modular-component-showcase-application)](https://github.com/rushmanthnalluri/modular-component-showcase-application)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Gateway-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=black)](https://render.com/)
[![Docker](https://img.shields.io/badge/Containerized-Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

</div>

## Overview

The **Modular Component Showcase Application** is a full-stack showcase platform designed to present reusable UI patterns in a product-grade environment. It combines interactive component browsing, authentication, reviews, ratings, favorites, discussions, profile management, and deployment-ready infrastructure in a single monorepo.

This repository is intentionally structured to feel closer to a real SaaS codebase than a classroom submission. It demonstrates frontend craftsmanship, backend API design, gateway-based service routing, hybrid persistence, Docker-based development, and CI/CD automation in one cohesive project.

## Built For

This project is especially useful for:

- **Recruiters** evaluating engineering maturity beyond a single-page frontend demo
- **Frontend portfolios** that need stronger full-stack depth and real product structure
- **Internship applications** that benefit from clear architecture and production awareness
- **Full-stack demonstrations** involving authentication, APIs, databases, deployment, and CI/CD

## Why This Project Matters

- It shows how a **React UI** can be paired with a **secure Node/Express API** and an optional **FastAPI gateway** in a realistic delivery model.
- It demonstrates **polyglot persistence** using **Neon PostgreSQL** for normalized relational data and **MongoDB Atlas** for document-oriented workloads.
- It includes **production-oriented concerns** such as CSRF, rate limiting, containerization, health checks, linting, testing, CI/CD, and Render deployment.
- It highlights both **developer experience** and **user experience**, from local Docker setup to responsive UI, theme switching, and interactive component previews.

<details>
<summary>Quick Table of Contents</summary>

- [Live Demo](#live-demo)
- [Features](#features)
- [UI Highlights](#ui-highlights)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Configuration Notes](#configuration-notes)
- [Local Development Setup](#local-development-setup)
- [API Documentation](#api-documentation)
- [Database Schema Overview](#database-schema-overview)
- [Deployment](#deployment)
- [Production Readiness](#production-readiness)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Author](#author)
- [License](#license)
- [Quick Repository Navigation](#quick-repository-navigation)

</details>

## Live Demo

| Surface | Purpose | URL / Access |
|---|---|---|
| Frontend | Public client application | https://rushmanthnalluri.github.io/modular-component-showcase-application/ |
| Backend API | Express API service | https://modular-component-showcase-application.onrender.com/api |
| Gateway | FastAPI proxy/gateway layer |https://modular-component-showcase-application-ve5e.onrender.com |
| Database Layer | Neon PostgreSQL + MongoDB Atlas | Privately managed services by Rushmanth Nalluri |

> Render free services may spin down after inactivity, so the backend or gateway may take a short time to respond on first request.
>
> If a public frontend or gateway URL changes, replace the placeholder values above with the current deployment links.

## Features

### Authentication & Security

- **Authentication flows** for registration, login, logout, token refresh, and forgot-password handling
- **Captcha verification** to reduce abuse during auth-related actions
- **CSRF protection** for state-changing requests
- **Secure session behavior** using cookie-based auth flows with JWT handling
- **Rate limiting and security headers** through `express-rate-limit` and `helmet`

### Component Showcase

- **Component gallery** with category filtering and search-driven discovery
- **Component detail pages** with preview-driven exploration of each UI pattern
- **Live component previews** that help users evaluate behavior visually
- **Code presentation tabs** for JSX, CSS, and generated code
- **Category-backed catalog design** that supports structured browsing and scaling

### Community Features

- **Ratings system** for component feedback and scoring
- **Reviews system** for more detailed opinions and commentary
- **Favorites support** so users can build a personal shortlist of saved components
- **Discussion threads** attached to component pages for conversation and follow-up
- **User submissions and contribution flows** for showcase expansion

### User Experience

- **Responsive design** across desktop and mobile layouts
- **Dark/light theme switching** for more polished visual usability
- **Profile dashboard** with editable user data and profile image support
- **Clean navigation and card-based layouts** built for portfolio-quality presentation
- **Readable visual hierarchy** focused on browsing, previews, and engagement flows

### Infrastructure & Deployment

- **Monorepo organization** separating frontend, backend, and gateway concerns
- **Dockerized setup** for local parity and repeatable onboarding
- **Render-ready deployment** for frontend, backend, and gateway services
- **GitHub Actions CI/CD** for linting, tests, build validation, and deployment automation
- **Hybrid database architecture** using Neon PostgreSQL and MongoDB Atlas

## UI Highlights

- Clean **card-based layout** for component discovery and presentation
- Built-in **dark/light mode support**
- Visual emphasis through **gradient buttons** and polished interaction cues
- **Responsive design** tuned for desktop and mobile usage
- **Interactive preview panels** for component exploration
- **Modern code tabs** for JSX, CSS, and generated code output
- Dedicated **rating and discussion sections** on component detail flows
- Stronger **visual hierarchy** for content scanning and navigation
- More refined **typography and spacing** than a standard demo-style README project

## Architecture

The application is organized as a monorepo so the frontend, backend, and gateway can evolve independently while still being delivered as one cohesive system.

### Request Flow

```text
Browser / Client
    |
    v
Frontend (React + Vite)
    |
    v
Gateway (FastAPI, optional)
    |
    v
Backend (Node.js + Express)
    |
    +--> Neon PostgreSQL
    |
    +--> MongoDB Atlas
```

### System Layers

| Layer | Responsibility |
|---|---|
| Frontend | React + Vite UI for routing, stateful UX, showcase pages, previews, profile flows, and API consumption |
| Backend | Node.js + Express service for authentication, component management, reviews, ratings, favorites, discussions, and profile operations |
| Gateway | FastAPI proxy layer that provides a stable entry point for `/api` traffic and deployment flexibility |
| PostgreSQL | Neon-hosted relational source of truth for normalized user, category, component, review, rating, discussion, and favorites data |
| MongoDB Atlas | Document-oriented storage for legacy support, search-oriented data, content payloads, logs, embeddings, and discussion-linked records |
| Docker | Containerized development and deployment parity through dedicated service definitions |
| Render | Hosting platform for frontend, backend, and gateway services |
| GitHub Actions | Continuous integration and deployment workflows for validation and release automation |

### Monorepo Folder Tree

```text
ModularComponentShowcaseApplication/
|-- frontend/
|   |-- src/
|   |-- public/
|   |-- tests/
|   |-- package.json
|   |-- vite.config.js
|   `-- eslint.config.js
|-- backend/
|   |-- src/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- scripts/
|   |   |-- seeds/
|   |   |-- services/
|   |   |-- sql/
|   |   |-- tests/
|   |   `-- utils/
|   `-- Dockerfile
|-- gateway/
|-- docs/
|-- .github/
|-- docker-compose.yml
|-- render.yaml
|-- package.json
`-- README.md
```

### Directory Responsibilities

| Directory | Responsibility |
|---|---|
| `frontend/` | React + Vite client application, pages, reusable UI, preview components, tests, and styling |
| `backend/` | Express API, auth middleware, controllers, data models, service logic, SQL helpers, tests, and seed scripts |
| `gateway/` | FastAPI gateway, proxy routing, gateway services, health endpoints, and Python test coverage |
| `docs/` | Architecture, deployment, environment, database, monitoring, and troubleshooting documentation |
| `.github/` | CI/CD workflows for code quality validation and GitHub Pages deployment |

<details>
<summary>How the architecture works</summary>

The frontend consumes API requests through a configurable base URL and can route traffic through the FastAPI gateway or connect directly to the backend API. The backend owns business logic, validation, persistence, authentication, and synchronization into Neon PostgreSQL. MongoDB Atlas stores document-heavy and search-oriented data, while PostgreSQL stores the normalized relational layer for users, categories, components, reviews, ratings, discussions, and favorites.

</details>

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Lucide React
- CSS modules and global styles
- Custom toast and layout components

### Backend

- Node.js
- Express
- Mongoose
- bcryptjs
- JSON Web Tokens
- Cookie-based auth sessions
- Helmet
- express-rate-limit
- Nodemailer

### Gateway

- FastAPI
- Python 3.x
- HTTP proxying for API requests
- Environment-based routing configuration

### Database

- Neon PostgreSQL
- MongoDB Atlas
- `pg`
- SQL schema initialization scripts
- MongoDB models and collections

### DevOps

- Docker
- Docker Compose
- Render
- GitHub Actions
- ESLint
- Vitest
- Node test runner
- Pytest

## Configuration Notes

Frontend, backend, and gateway configuration are each documented separately in the repository. The public README intentionally omits raw environment variable listings.

Use the following references when setting up local or production configuration:

- [.env.example](.env.example)
- [docs/environment-guide.md](docs/environment-guide.md)
- [render.yaml](render.yaml)

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/rushmanthnalluri/modular-component-showcase-application.git
cd modular-component-showcase-application
```

### 2. Install dependencies

Install workspace dependencies from the repository root:

```bash
npm install
```

If you need to reinstall workspace packages explicitly:

```bash
npm install --workspaces
```

### 3. Start the application locally

Run frontend and backend together from the repository root:

```bash
npm run dev
```

Start services individually when needed:

```bash
npm run dev:frontend
npm run dev:backend
```

Start the FastAPI gateway separately:

```bash
cd gateway
uvicorn app.main:app --reload --port 8000
```

### 4. Run with Docker

Use Docker Compose for a full local stack including PostgreSQL, MongoDB, pgAdmin, frontend, backend, and gateway:

```bash
docker compose up --build
```

Common service ports:

| Service | Local URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:5000 |
| Gateway | http://localhost:8000 |
| PostgreSQL | localhost:5432 |
| MongoDB | localhost:27017 |
| pgAdmin | http://localhost:5050 |

### 5. Run tests

From the repository root:

```bash
npm run test:frontend
npm run test:backend
```

Run gateway tests:

```bash
cd gateway
pytest -q
```

### 6. Run linting

```bash
npm run lint --workspace frontend
```

### 7. Seed demo data

```bash
npm run seed:showcase
```

### Production Deployment Checklist

- Confirm frontend builds successfully with `npm run build --workspace frontend`
- Confirm backend tests pass with `npm run test:backend`
- Confirm frontend tests pass with `npm run test:frontend`
- Confirm gateway tests pass with `pytest -q` inside `gateway/`
- Validate `docker compose config`
- Verify Render services, Neon PostgreSQL, and MongoDB Atlas connectivity
- Update live URLs in this README after deployment

## API Documentation

Base backend URL: `/api`  
Base gateway URL: `/api` via FastAPI proxy  
Auth mode: JWT access and refresh tokens in secure cookies  
CSRF: required for state-changing routes unless `Authorization: Bearer` is used

### Health

Health, metrics, and service-level readiness endpoints.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Backend health check for service, database connectivity, and readiness |
| GET | `/metrics` | Prometheus-style backend metrics |
| GET | `/api` | API index with endpoint groups |

### Authentication

Authentication and session lifecycle endpoints.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/csrf` | Returns a CSRF token for state-changing requests |
| POST | `/api/auth/register` | Creates a new user account |
| POST | `/api/auth/login` | Authenticates a user and issues auth cookies/tokens |
| POST | `/api/auth/refresh` | Refreshes the access token using the refresh cookie |
| POST | `/api/auth/logout` | Clears the user session |
| POST | `/api/auth/forgot-password` | Password reset flow with phone verification |

### Captcha

Captcha support for abuse-resistant auth flows.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/captcha/getcaptcha/6` | Returns a captcha challenge |
| GET | `/captcha/getcaptcha/6` | Direct backend captcha route |

### Components

Catalog, detail, and component management endpoints.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/components` | List showcase components |
| GET | `/api/components/:id` | Get component details |
| POST | `/api/components` | Create a new component |
| PUT | `/api/components/:id` | Update an existing component |
| DELETE | `/api/components/:id` | Delete a component |
| GET | `/api/components/stats/most-viewed` | Return top viewed components |
| GET | `/api/components/stats/top-rated` | Return top rated components |
| POST | `/api/components/:id/dependencies` | Create or update component dependency metadata |
| GET | `/api/components/:id/dependencies` | List component dependency metadata |
| GET | `/api/components/:id/export` | Export component payload/code |

### Reviews

Review creation and retrieval endpoints for component feedback.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reviews` | List reviews |
| POST | `/api/reviews` | Create a review |
| GET | `/api/components/:id/reviews` | List reviews for a component |
| POST | `/api/components/:id/reviews` | Add a review for a component |
| POST | `/api/components/:componentId/reviews/:reviewId/helpful` | Mark review feedback as helpful or unhelpful |
| PUT | `/api/reviews/:reviewId` | Update a review |
| DELETE | `/api/reviews/:reviewId` | Delete a review |

### Ratings

Rating endpoints for scoring components.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/components/:id/ratings` | Get component ratings |
| POST | `/api/components/:id/ratings` | Submit or update a rating |
| GET | `/api/ratings/:componentId` | Get component ratings |
| POST | `/api/ratings/:componentId` | Submit or update a rating |

### Favorites

Favorite management for authenticated users.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me/favorites` | List favorite component IDs |
| GET | `/api/users/me/favorites/components` | List favorite components with details |
| POST | `/api/users/me/favorites/:componentId` | Toggle a favorite component |

### Discussions

Discussion endpoints for component-centric conversations.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/discussions` | List discussions |
| POST | `/api/discussions` | Create a discussion |
| GET | `/api/components/:id/discussions` | List discussions for a component |
| POST | `/api/components/:id/discussions` | Create a discussion for a component |
| PATCH | `/api/components/:id/discussions/:discussionId` | Update a component discussion entry |

### User Profile

Authenticated user profile and account activity endpoints.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get the current user profile |
| PUT | `/api/users/me` | Update profile fields and preferences |
| GET | `/api/users/me/components` | List components submitted by the current user |
| GET | `/api/users/me/submission-history` | Get submission history |

### SQL Catalog

SQL-backed catalog and relational data inspection endpoints.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sql/users` | List SQL users |
| GET | `/api/sql/categories` | List SQL categories |
| GET | `/api/sql/components` | List SQL components |
| POST | `/api/sql/components` | Create a SQL component |
| PUT | `/api/sql/components/:componentId` | Update a SQL component |
| DELETE | `/api/sql/components/:componentId` | Delete a SQL component |

### Admin

Operational and admin-only visibility endpoints.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/rate-limits` | View rate-limit counters and blocked totals |
| GET | `/api/admin/dashboard` | View aggregate dashboard metrics and top components |

## Database Schema Overview

The PostgreSQL schema is designed around a normalized relational model. The current core tables include:

| Table | Stores |
|---|---|
| `users` | User identities, account metadata, roles, profile data, avatar details, social links, and user-level stats |
| `categories` | Normalized component categories used for browsing and catalog organization |
| `components` | The primary component catalog, including component names, descriptions, authorship, and category relationships |
| `discussions` | Relational discussion records tied to users and component-linked Mongo identifiers |
| `ratings` | User-submitted rating values for components |
| `reviews` | Structured review content including rating, comment, title, status, and feedback counts |
| `user_favorites` | User-to-component favorite relationships for saved components |

The schema is initialized from [`backend/sql/postgres_schema.sql`](backend/sql/postgres_schema.sql) and is designed to work alongside MongoDB Atlas for document-heavy and search-oriented storage needs.

## Deployment

### Render

- Frontend is deployed as a **static site** or web target depending on the delivery setup.
- Backend is deployed as a **Node.js web service** with `/health` as the health check path.
- Gateway is deployed as a separate **Python/FastAPI web service** when used in production.
- `render.yaml` provides service definitions for frontend, backend, and gateway deployment.

### Neon PostgreSQL

- Neon hosts the **relational data layer** for users, categories, components, reviews, ratings, discussions, and favorites.
- The backend supports **schema initialization** on startup through SQL migration logic.
- PostgreSQL serves as the **normalized source of truth** for core platform entities.

### MongoDB Atlas

- MongoDB Atlas stores **document-heavy and search-oriented data**, including logs, descriptions, embeddings, and legacy-compatible records.
- The backend includes **SRV fallback logic** to improve reliability when DNS SRV resolution is unstable.
- Atlas complements PostgreSQL by handling less rigid, document-structured workloads.

### Docker

- Docker Compose runs the full local stack with frontend, backend, gateway, PostgreSQL, MongoDB, and pgAdmin.
- Containerized development improves **environment consistency** and reduces onboarding friction.
- Each service can be built and operated independently while still working as a coordinated stack.

### GitHub Actions CI/CD

- CI validates frontend linting, backend tests, frontend unit tests, frontend builds, Docker Compose config, and gateway tests.
- GitHub Pages deployment is automated for the frontend through a separate workflow.
- This structure supports **continuous validation before deployment** and better release confidence.

### Deployment Notes & Best Practices

- Keep Render service configuration aligned with `render.yaml`
- Use managed database credentials from Neon and MongoDB Atlas rather than embedding secrets in source
- Verify `/health` and `/metrics` endpoints after each backend deployment
- Test signup, login, favorites, reviews, discussions, and profile flows after each release
- Replace placeholder demo URLs and screenshots once production deployments are finalized

## Production Readiness

### Security

- [x] Authentication and session handling
- [x] CSRF protection for state-changing requests
- [x] Captcha integration for auth-related flows
- [x] Rate limiting on critical request paths
- [x] Helmet-based security headers
- [x] Cookie-aware auth flow design

### Performance

- [x] Split frontend and backend services for cleaner scaling boundaries
- [x] Vite-powered frontend build pipeline
- [x] Optional FastAPI gateway for request routing flexibility
- [x] SQL indexes defined for key relational access paths
- [x] Docker-based parity for local performance validation

### Testing

- [x] Frontend unit testing with Vitest
- [x] Backend tests with the Node test runner
- [x] Gateway tests with Pytest
- [x] Health checks for backend and gateway
- [x] Manual QA support for responsive and auth flows

### CI/CD

- [x] GitHub Actions CI workflow
- [x] Automated frontend build validation
- [x] Docker Compose configuration validation
- [x] GitHub Pages deployment workflow
- [x] Render-ready repository structure

### Monitoring & Operations

- [x] Health endpoint for service readiness
- [x] Metrics endpoint for backend observability
- [x] Request logging and request ID support
- [x] Admin dashboard and rate-limit insight endpoints
- [ ] External alerting and uptime monitoring
- [ ] Dedicated production incident runbooks

### Database Reliability

- [x] Neon PostgreSQL support
- [x] MongoDB Atlas support
- [x] SQL schema initialization support
- [x] MongoDB Atlas SRV fallback handling
- [x] Dockerized local database stack
- [ ] Managed backup verification and restore drills

<details>
<summary>Operational considerations</summary>

- Add external monitoring and uptime alerts for production services
- Configure backup and restore policies for Neon and MongoDB Atlas
- Rotate authentication secrets periodically
- Keep Render service configuration synchronized with deployed branches
- Capture screenshots and smoke-test the application after deploys

</details>

## Testing & Quality Assurance

- Frontend tests validate routing, protected flows, and error boundaries
- Backend tests validate API behavior, schema helpers, auth flows, health checks, and CSRF behavior
- Gateway tests validate routing, proxy behavior, health handling, and request forwarding
- Manual QA should cover login, registration, profile edits, favorites, reviews, discussions, search, and responsive behavior
- Docker-based smoke testing is recommended before release

## Author

| Field | Value |
|---|---|
| Name | Rushmanth Nalluri |
| GitHub | https://github.com/rushmanthnalluri |
| LinkedIn | https://www.linkedin.com/in/rushmanthnalluri/ |
| Email | rushmanth21@gmail.com |

## License

This project is released under the **MIT License**.

<details>
<summary>View license text</summary>

```text
MIT License

Copyright (c) 2026 Rushmanth Nalluri

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

</details>

## Quick Repository Navigation

- [frontend/](frontend/)
- [backend/](backend/)
- [gateway/](gateway/)
- [README.md](README.md)
- [docs/api-reference.md](docs/api-reference.md)
- [docs/deployment-guide.md](docs/deployment-guide.md)
- [docs/environment-guide.md](docs/environment-guide.md)

