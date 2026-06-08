"""Create runtime .env files for CI from the repository examples."""

from __future__ import annotations

import os
import secrets
from pathlib import Path


def parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip()

    return values


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    ci_jwt_secret = os.getenv("CI_JWT_SECRET", secrets.token_urlsafe(48))
    ci_spring_jwt_secret = os.getenv("CI_SPRING_JWT_SECRET", secrets.token_urlsafe(48))

    examples = {
        root / ".env": root / ".env.example",
        root / "backend/.env": root / "backend/.env.example",
        root / "frontend/.env": root / "frontend/.env.example",
        root / "gateway/.env": root / "gateway/.env.example",
        root / "springboot/.env": root / "springboot/.env.example",
    }

    overrides = {
        root / ".env": {
            "JWT_SECRET": ci_jwt_secret,
            "SPRING_JWT_SECRET": ci_spring_jwt_secret,
            "BACKEND_URL": "http://backend:5000",
            "SPRING_SERVICE_URL": "http://springboot:8081",
        },
        root / "backend/.env": {
            "PORT": "5000",
            "NODE_ENV": "development",
            "MONGODB_URI": "mongodb://mongo:27017/modular_components",
            "DATABASE_URL": "postgresql://postgres:postgres@postgres:5432/modular_component_showcase_application",
            "JWT_SECRET": ci_jwt_secret,
            "FRONTEND_ORIGINS": "http://localhost:8080,http://localhost:5173",
            "SQL_AUTO_MIGRATE": "true",
            "OTEL_EXPORTER_OTLP_ENDPOINT": "http://otel-collector:4318",
        },
        root / "frontend/.env": {
            "VITE_GATEWAY_URL": "http://localhost:8000",
            "VITE_USE_GATEWAY": "true",
        },
        root / "gateway/.env": {
            "BACKEND_URL": "http://backend:5000",
            "SPRING_SERVICE_URL": "http://springboot:8081",
            "FRONTEND_URL": "http://localhost:8080",
            "GATEWAY_PORT": "8000",
            "REQUEST_TIMEOUT_SECONDS": "20",
            "REQUEST_MAX_RETRIES": "2",
            "JWT_SECRET": ci_jwt_secret,
            "OTEL_EXPORTER_OTLP_ENDPOINT": "http://otel-collector:4318",
        },
        root / "springboot/.env": {
            "PORT": "8081",
            "SPRING_DATASOURCE_URL": "jdbc:postgresql://postgres:5432/modular_component_showcase_application",
            "SPRING_DATASOURCE_USERNAME": "postgres",
            "SPRING_DATASOURCE_PASSWORD": "postgres",
            "SPRING_JWT_SECRET": ci_spring_jwt_secret,
            "SPRING_ALLOWED_ORIGINS": "http://localhost:8080,http://localhost:5173,http://localhost:8000",
            "OTEL_EXPORTER_OTLP_ENDPOINT": "http://otel-collector:4318",
        },
    }

    for target, example in examples.items():
        values = parse_env_file(example)
        values.update(overrides.get(target, {}))
        target.write_text("\n".join(f"{key}={value}" for key, value in values.items()) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
