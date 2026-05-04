# Modular Component Showcase Application

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-blue)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)

> A production-grade polyglot distributed system for showcasing reusable UI components with semantic search, normalized relational data, and built-in observability.

---

## Overview

Most component libraries are easy to browse and hard to search. This project solves that by combining a modular UI showcase with metadata, reviews, ratings, discussions, and semantic retrieval.

It matters because it demonstrates a realistic full-stack architecture: React for the UI, Node.js for application logic, FastAPI as the gateway, Spring Boot for a separate service boundary, PostgreSQL for transactional integrity, and MongoDB for embeddings and logs.

Target users include recruiters, academic evaluators, and frontend teams that want a clear example of a production-oriented distributed system.

---

## System Architecture

```text
User
  ↓
React Frontend
  ↓
FastAPI Gateway
  ↓
Node.js Backend ─────→ PostgreSQL
  ↓
Spring Boot Service ─→ MongoDB
```

The system is intentionally split into microservices so each layer owns a narrow responsibility. The gateway acts as the control point for routing, validation, and request handling. The backend services are polyglot by design, which makes the architecture easier to defend in an evaluation and easier to extend in production.

### Service Roles

| Layer | Responsibility |
|---|---|
| React | Browse components, search, and user interaction |
| FastAPI gateway | API routing, validation, request control |
| Node.js backend | Auth, CRUD, reviews, ratings, discussions, search |
| Spring Boot service | Independent domain service and Java-based backend logic |
| PostgreSQL | Normalized transactional source of truth |
| MongoDB | Embeddings, logs, and flexible document data |

---

## Database Design

### Why PostgreSQL + MongoDB

- PostgreSQL stores the relational core: users, components, reviews, ratings, discussions, and favorites.
- The schema is normalized to **3NF/BCNF** to reduce redundancy and prevent update anomalies.
- MongoDB stores flexible data: embeddings, descriptions, and logs.
- This hybrid persistence model keeps transactional data strict while allowing search data to evolve quickly.

### Summary

| Store | Best for |
|---|---|
| PostgreSQL | Normalized relational entities, constraints, joins, ACID writes |
| MongoDB | Embeddings, search payloads, logs, document-style content |

---

## Tech Stack

- **Frontend:** React, Vite, React Router, Radix UI, Lucide
- **Backend:** Node.js, Express, pg, Mongoose, bcryptjs, jsonwebtoken, helmet, express-rate-limit
- **Gateway:** FastAPI, Uvicorn, httpx, PyJWT, Pydantic
- **Service Layer:** Spring Boot 3.5, Java 21, Spring Data JPA, Spring Security, Flyway, Caffeine, Prometheus
- **Databases:** PostgreSQL 16, MongoDB
- **DevOps:** Docker, Docker Compose, Helm

---

## Features

- Component catalog with category browsing
- Reviews, ratings, discussions, and favorites
- Semantic search using vector embeddings
- Hybrid search that blends lexical and semantic ranking
- JWT authentication with browser-safe cookie handling
- CSRF protection for unsafe requests
- API gateway routing and request normalization
- Rate limiting and security headers
- Health checks, metrics, and tracing
- Dockerized local development

---

## Vector Search

The current semantic search path uses **brute-force cosine similarity** over stored embeddings. That is straightforward, accurate for the current scale, and easy to validate.

The next optimization path is **ANN / pgvector** or another approximate vector index so search scales beyond the current brute-force approach.

---

## Security

- JWT-based authentication across the stack
- CSRF protection on state-changing operations
- Rate limiting on sensitive endpoints
- Input validation before persistence or forwarding
- Secure headers via Helmet

**Spring Boot CSRF is disabled intentionally due to stateless JWT architecture.**

---

## Docker Setup

```bash
docker-compose up -d --build
```

Included services:

- React frontend
- Node.js backend
- FastAPI gateway
- Spring Boot service
- PostgreSQL
- MongoDB
- pgAdmin

Useful ports:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:5000`
- Gateway: `http://localhost:8000`
- Spring service: `http://localhost:8081`
- pgAdmin: `http://localhost:5050`

---

## Getting Started

### Install

```bash
npm install
```

### Run local services

```bash
npm run dev
```

### Run services individually

```bash
npm run dev:frontend
npm run dev:backend
cd gateway && python run.py
cd spring-service && ./mvnw spring-boot:run
```

---

## Testing

- Frontend tests: Vitest
- Backend tests: Node.js test runner
- Gateway tests: Pytest
- Spring service tests: Maven / JUnit

CI-ready test flow:

```bash
npm run test:frontend
npm run test:backend
cd gateway && pytest
```

---

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