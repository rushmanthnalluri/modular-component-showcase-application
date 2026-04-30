FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /workspace

# Resolve deps separately for Docker layer caching
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ── Layered JAR extraction ───────────────────────────────────────────────────
FROM eclipse-temurin:21-jre AS extractor
WORKDIR /extract
COPY --from=builder /workspace/target/spring-service-0.1.0.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

# ── Final minimal image ──────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

# Copy layered JAR layers (ordered by change frequency for optimal caching)
COPY --from=extractor /extract/dependencies/ ./
COPY --from=extractor /extract/spring-boot-loader/ ./
COPY --from=extractor /extract/snapshot-dependencies/ ./
COPY --from=extractor /extract/application/ ./

RUN chown -R appuser:appgroup /app
USER appuser

ENV PORT=8081
EXPOSE 8081

# Health check
HEALTHCHECK --interval=20s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:${PORT}/actuator/health > /dev/null || exit 1

# JVM tuning: container-aware memory, use G1GC, reduce startup time
ENTRYPOINT ["sh", "-c", \
  "java \
    -Dserver.port=${PORT} \
    -XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+UseG1GC \
    -XX:+ExitOnOutOfMemoryError \
    -Djava.security.egd=file:/dev/./urandom \
    org.springframework.boot.loader.launch.JarLauncher"]
    
