# Spring Service

Spring Boot 3 microservice for Modular Component Showcase.

## Stack

- Java 21
- Spring Boot 3
- Spring Web, Data JPA, Security, Validation
- PostgreSQL (Neon-compatible)
- JWT auth
- OpenAPI/Swagger
- Actuator health checks
- Micrometer Prometheus metrics
- Search/filter/pagination endpoint parity for components
- Normalized SQL discussion mirror for component conversation records

## Architecture Role

This service is the SQL relational layer for PS-30. It owns PostgreSQL-backed
operations that need normalization, constraints, transactions, and enterprise
Spring REST behavior. The Node.js service remains responsible for MongoDB,
document-heavy component workflows, authentication cookies, and vector search.

Request path:

```text
React frontend -> FastAPI Gateway -> springboot -> PostgreSQL
```

## Relational Model

Flyway migrations create normalized tables for:

- `users`
- `categories`
- `components`
- `reviews`
- `ratings`
- `user_favorites`
- `discussions`

The SQL model uses primary keys, foreign keys from component/favorite/review/
rating/discussion rows to `users`, unique constraints for natural identifiers,
check constraints for ratings and discussion likes, and indexes on lookup/filter
columns such as `category_id`, `user_id`, `component_mongo_id`, and status.

The JPA model keeps scalar IDs in DTOs for gateway compatibility while also
declaring `@ManyToOne` relationships for relational integrity and maintainable
domain navigation.

## API Overview

Base path: `/spring`

- `POST /auth/token` issues a JWT for an existing SQL user and persisted role.
- `GET /health` returns lightweight service health.
- `GET /users`, `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}`.
- `GET /components`, `GET /components/search`, component CRUD.
- Review, rating, favorite CRUD under `/reviews`, `/ratings`, `/favorites`.
- Discussion CRUD under `/discussions`, including optional
  `componentMongoId` filtering for component threads.

Security is stateless JWT-based REST. CSRF is disabled intentionally because
the service does not use server-side sessions; authorization is enforced through
Bearer JWTs and method-level RBAC.

## Local Run

1. Copy `.env.example` values into your environment.
2. Start with the Maven Wrapper so a local Maven installation is not required:

```bash
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

Wrapper-based verification commands:

```bash
./mvnw test
./mvnw package -DskipTests
./mvnw jacoco:report
```

3. Swagger UI:

- `/swagger-ui/index.html`

4. Health endpoint:

- `/actuator/health`

5. Prometheus endpoint:

- `/actuator/prometheus`

6. Component search example:

- `/spring/components/search?name=button&page=0&size=10&sortBy=name&direction=asc`

7. Discussion filter example:

- `/spring/discussions?componentMongoId=solid-button`

## Docker

```bash
docker build -t showcase-springboot .
docker run -p 8081:8081 --env DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/modular_component_showcase_application showcase-springboot
```

## Verification Notes

- Test profile settings live in `src/test/resources/application-test.properties`.
- Smoke and contract coverage now includes actuator, Prometheus, auth token issuance, and runtime OpenAPI validation.
- Controller and service tests cover discussion filtering and JWT role-escalation rejection.
- JaCoCo HTML output is written to `target/site/jacoco/index.html`.
- CI uses `./mvnw` in `.github/workflows/ci.yml`, so Spring verification does not depend on a runner-level Maven install.
