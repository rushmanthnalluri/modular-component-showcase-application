# Modular Component Showcase Application

<div align="center">

### A production-style full-stack platform for discovering, previewing, reviewing, and managing reusable UI components

Modern monorepo architecture built with **React + Vite**, **Node.js + Express**, **FastAPI gateway**, and **Spring Boot microservice**, backed by **Neon PostgreSQL** and **MongoDB Atlas**, containerized with **Docker**, and deployment-ready for **Render** with **GitHub Actions CI/CD**.

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
    +--> Spring Service (Spring Boot)
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
|-- spring-service/
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
| `spring-service/` | Spring Boot microservice with JWT auth, JPA CRUD APIs, role-based access, actuator health, and Swagger |
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

### Spring Service

- Spring Boot 3 (Java 21)
- Spring Data JPA + PostgreSQL
- Spring Security + JWT
- Actuator + OpenAPI (Swagger)

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

Frontend, backend, gateway, and Spring service configuration are documented separately so local development, Docker, and CI can share the same defaults without committing secrets.

Use these references when setting up configuration:

- [.env.example](.env.example) for workspace-level Docker defaults
- [frontend/.env.example](frontend/.env.example)
- [backend/.env.example](backend/.env.example)
- [gateway/.env.example](gateway/.env.example)
- [spring-service/.env.example](spring-service/.env.example)
- [docs/environment-guide.md](docs/environment-guide.md)
- [render.yaml](render.yaml)

GitHub Actions now generates runtime `.env` files from the examples before launching Docker Compose, so CI does not depend on local developer files. In production, inject real secrets through GitHub Secrets or your deployment platform instead of committing `.env` files.

## Enterprise Proof Pack

- [docs/final-verification-report.md](docs/final-verification-report.md)
- [docs/viva-ready-theory-to-code-mapping.md](docs/viva-ready-theory-to-code-mapping.md)
- [docs/testing-and-quality-proof.md](docs/testing-and-quality-proof.md)
- [docs/security-hardening-proof.md](docs/security-hardening-proof.md)
- [docs/production-readiness-proof.md](docs/production-readiness-proof.md)
- [docs/vector-search-verification.md](docs/vector-search-verification.md)

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

If you want the full Docker stack to pick up local overrides, copy the example files first:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
cp gateway/.env.example gateway/.env
cp spring-service/.env.example spring-service/.env
```

### 4. Run with Docker

Use Docker Compose for a full local stack including PostgreSQL, MongoDB, pgAdmin, frontend, backend, gateway, and spring-service:

```bash
docker compose up --build
```

The compose file now works even when the service-specific `.env` files are absent. When those files are present, they override the built-in safe defaults.

Common service ports:

| Service | Local URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:5000 |
| Gateway | http://localhost:8000 |
| Spring Service | http://localhost:8081 |
| PostgreSQL | localhost:5432 |
| MongoDB | localhost:27017 |
| pgAdmin | http://localhost:5050 |

### 5. Run tests

From the repository root:

```bash
npm run test:frontend
npm run test:backend
cd gateway && pytest
```

---

## Validation & CI troubleshooting

When running in restricted/cloud execution environments (GitHub Actions hosted runners, some container sandboxes, or CI sandboxes) you may encounter limitations: Docker Engine may be unavailable, nested containerization blocked, or /var/run/docker.sock inaccessible. These restrictions prevent the runner from launching containers locally.

What CI does in this repository:
- The workflow runs `python scripts/prepare-ci-env.py` to generate runtime `.env` files from the `.env.example` files so CI does not rely on untracked local files.
- The integration job then invokes `docker compose up -d --build ...` on runners that have Docker available.

If Docker is not available in your environment, run the following locally on a machine with Docker Desktop / Engine installed to validate:

```bash
# Validate compose interpolation and structure
docker compose config

# Bring up core services (build images)
docker compose up -d --build postgres mongo backend spring-service gateway

# Inspect running services
docker compose ps

# Stream logs for troubleshooting
docker compose logs -f backend gateway spring-service
```

If CI fails with "env file ... not found" or undefined interpolation warnings:
- Ensure the repository contains the `.env.example` files (this repo includes root and per-service examples).
- The GitHub Actions workflow runs `scripts/prepare-ci-env.py` automatically; confirm that step succeeded in the job logs and that the `.env` files were written in the workspace before `docker compose up` runs.
- If you need to provide secrets to CI, add them to the repository secrets as `CI_JWT_SECRET` or `CI_SPRING_JWT_SECRET`. If absent, the prepare script generates ephemeral secrets for the run.

CI Runners without Docker:
- GitHub-hosted runners may or may not allow `docker compose up` depending on the job configuration. If your runner does not support Docker (error shows unable to connect to Docker daemon), push the branch/PR and inspect Actions logs on GitHub where runners with Docker (or configured self-hosted runners) can run the integration job.


## Observability

- OpenTelemetry for tracing
- Prometheus for metrics
- Grafana for dashboards
- Jaeger for trace inspection

The goal is simple: one request can be traced from the browser through the gateway to the backend and database layers.

---

## Project Structure

```text
ModularComponentShowcaseApplication/
├── frontend/
├── backend/
├── gateway/
├── spring-service/
├── docs/
├── contracts/
├── docker-compose.yml
└── README.md
```

---

## Academic Alignment

This repository maps directly to the 25CS1302E evaluation goals:

- **SQL normalization:** PostgreSQL schema is normalized and constrained
- **NoSQL usage:** MongoDB stores embeddings, logs, and flexible documents
- **Vector search:** Semantic retrieval uses cosine similarity over embeddings
- **API Gateway:** FastAPI provides a dedicated routing and control layer
- **Microservices:** Frontend, backend, gateway, and Spring service are separated by responsibility

Reference documentation:

- [Architecture](docs/architecture.md)
- [Database design](docs/database-design.md)
- [Security](docs/security.md)
- [Hybrid search](docs/hybrid-search-and-rag.md)
- [Performance](docs/performance-report.md)

---

## Future Improvements

- ANN / pgvector for faster vector search
- CI/CD hardening and deployment automation
- Load testing and performance regression checks
- Additional cache layers for repeated search queries

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make focused changes
4. Run tests
5. Open a pull request

Keep changes small, documented, and aligned with the existing architecture.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).