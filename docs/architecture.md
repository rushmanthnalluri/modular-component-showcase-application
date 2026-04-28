# Architecture

This project is a polyglot component showcase with a React client, a FastAPI gateway, a Node.js application backend, a Spring Boot service, PostgreSQL, and MongoDB. The diagrams below are written to be usable in an academic viva: they show structure, flow, and the reason each layer exists.

## 1. System Architecture

```mermaid
flowchart LR
  U[User] --> R[React Frontend]
  R --> G[FastAPI Gateway]
  G --> N[Node.js Backend]
  G --> S[Spring Boot Service]

  N --> PG[(PostgreSQL)]
  S --> PG
  N --> MG[(MongoDB)]

  G -->|health, auth, search, component APIs| N
  G -->|latency logs, retries, headers| N
```

ASCII fallback:

```text
User -> React Frontend -> FastAPI Gateway -> Node.js Backend -> Spring Boot Service
                                           |-> PostgreSQL
                                           |-> MongoDB
```

## 2. Data Flow Diagram

```mermaid
flowchart TD
  A[User enters query or opens component page] --> B[React state and route update]
  B --> C[Gateway request forwarding]
  C --> D[Node.js search or CRUD handler]
  D --> E[PostgreSQL for transactional data]
  D --> F[MongoDB for embeddings, descriptions, logs]
  E --> G[Response composition]
  F --> G
  G --> H[Gateway response normalization and timing log]
  H --> I[React renders cards, details, or search matches]
```

## 3. Request Lifecycle

```mermaid
sequenceDiagram
  autonumber
  participant User
  participant Frontend as React Frontend
  participant Gateway as FastAPI Gateway
  participant Backend as Node.js Backend
  participant PG as PostgreSQL
  participant MG as MongoDB

  User->>Frontend: Search or browse components
  Frontend->>Gateway: GET /api/search?q=form%20validation
  Gateway->>Backend: Forward request with auth, request id, and timeout
  Backend->>MG: Fetch embeddings / metadata
  Backend->>PG: Load persisted component and review data when needed
  MG-->>Backend: Ranked candidates and scores
  PG-->>Backend: Transactional rows
  Backend-->>Gateway: JSON response with matching components
  Gateway-->>Frontend: Timed response + normalized status
  Frontend-->>User: Render ranked component cards
```

## 4. Microservice Interaction Map

| Service | Responsibility | Primary data |
|---|---|---|
| React frontend | Presentation, routing, evaluator demo flow | Browser state |
| FastAPI gateway | Single entry point, auth propagation, request timing, security headers | No durable data |
| Node.js backend | Component catalog, reviews, ratings, discussions, search orchestration | PostgreSQL + MongoDB |
| Spring Boot service | Enterprise-style comparison service and supporting domain logic | PostgreSQL |
| PostgreSQL | Source of truth for transactional entities and relationships | Structured relational data |
| MongoDB | Flexible descriptions, embeddings, logs, and semantic search payloads | Semi-structured and vector data |

## 5. Why This Layout Scores Well Academically

- It separates presentation, gateway, orchestration, and persistence concerns.
- It makes the gateway visible as an architectural control point instead of a hidden proxy.
- It uses PostgreSQL for invariants and MongoDB for flexible search artifacts, which is easier to defend in a viva.
- It supports measurable proof because every hop can be timed and explained.

## 6. Related Evidence

- [Database design proof](database-design.md)
- [Vector search proof](vector-search.md)
- [Security model](security.md)
- [Performance report](performance-report.md)