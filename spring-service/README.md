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

## Docker

```bash
docker build -t showcase-spring-service .
docker run -p 8081:8081 --env DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/modular_component_showcase_application showcase-spring-service
```

## Verification Notes

- Test profile settings live in `src/test/resources/application-test.properties`.
- Smoke and contract coverage now includes actuator, Prometheus, auth token issuance, and runtime OpenAPI validation.
- JaCoCo HTML output is written to `target/site/jacoco/index.html`.
- CI uses `./mvnw` in `.github/workflows/ci.yml`, so Spring verification does not depend on a runner-level Maven install.
