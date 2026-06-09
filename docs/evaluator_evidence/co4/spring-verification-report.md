# Spring Verification Report

## What Was Added

- Maven Wrapper scripts: `springboot/mvnw`, `springboot/mvnw.cmd`, and `springboot/.mvn/wrapper/maven-wrapper.properties`
- Dedicated Spring smoke and contract tests for auth, actuator health, Prometheus, and runtime OpenAPI validation
- Stable `application-test.properties` for wrapper-driven local and CI verification
- Wrapper-driven CI steps, JaCoCo reporting, runtime OpenAPI validation, and actuator smoke checks

## Local Verification Without Maven Installed

Run from `springboot/`:

```bash
./mvnw test
./mvnw package -DskipTests
./mvnw jacoco:report
```

Windows PowerShell:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package -DskipTests
.\mvnw.cmd jacoco:report
```

Wrapper-driven runtime smoke with the in-memory test stack:

```bash
SPRING_PROFILES_ACTIVE=test \
SPRING_DATASOURCE_URL='jdbc:h2:mem:springruntime;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE' \
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.h2.Driver \
SPRING_DATASOURCE_USERNAME=sa \
SPRING_FLYWAY_ENABLED=false \
./mvnw -Dspring-boot.run.useTestClasspath=true spring-boot:run
```

## Tests Covering the Final Gap

- `AuthControllerTest`: wrapper-safe auth token smoke coverage
- `ActuatorSmokeIntegrationTest`: `/spring/health`, `/actuator/health`, and `/actuator/prometheus`
- `OpenApiContractValidationTest`: runtime `/v3/api-docs` compared against `contracts/openapi-spring.yaml`
- `ModularShowcaseApplicationTests`: test-profile context load

## OpenAPI Validation Evidence

- Contract source: `contracts/openapi-spring.yaml`
- Runtime validation test: `springboot/src/test/java/com/modularshowcase/OpenApiContractValidationTest.java`
- CI runtime validator: `tests/verification/validate_spring_runtime.py`
- Expected secured runtime paths:
  - `/spring/auth/token`
  - `/spring/health`
  - `/spring/components`
  - `/spring/components/search`

## Actuator Smoke Evidence

Expected manual or CI proof:

- `GET /actuator/health` returns `{"status":"UP"}`
- `GET /actuator/metrics/jvm.threads.live` returns the JVM thread metric payload
- Docker and Render health checks both point at `/actuator/health`

Screenshot placeholders for Spring-specific UI proof are tracked in `docs/screenshots/multi-framework/README.md`.

Prometheus scrape proof remains part of the deployment evidence pack because it depends on the full metrics/export pipeline, not only the local Spring runtime.

## Coverage and Artifacts

- JaCoCo HTML report: `springboot/target/site/jacoco/index.html`
- JaCoCo XML report: `springboot/target/site/jacoco/jacoco.xml`
- Coverage summary artifact: generated in CI after `jacoco:report`
- Spring runtime log artifact: generated in CI during the runtime OpenAPI/Actuator smoke step
