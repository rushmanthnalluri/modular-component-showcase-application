from pathlib import Path

import yaml


REPO_ROOT = Path(__file__).resolve().parents[2]


def _load_yaml(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def test_docker_compose_contains_all_runtime_services_and_healthchecks():
    compose = _load_yaml(REPO_ROOT / "docker-compose.yml")
    services = compose.get("services", {})

    for service_name in ["frontend", "backend", "gateway", "springboot", "prometheus", "grafana", "jaeger"]:
        assert service_name in services

    assert "healthcheck" in services["backend"]
    assert "healthcheck" in services["gateway"]
    assert "healthcheck" in services["springboot"]


def test_render_blueprint_covers_all_deployed_web_surfaces():
    render_blueprint = _load_yaml(REPO_ROOT / "render.yaml")
    service_names = {entry["name"] for entry in render_blueprint.get("services", [])}

    assert "modular-component-showcase-frontend" in service_names
    assert "modular-component-showcase-backend" in service_names
    assert "modular-component-showcase-gateway" in service_names
    assert "modular-component-showcase-springboot" in service_names


def test_kubernetes_and_helm_descriptors_exist_for_release_smoke():
    required_paths = [
        REPO_ROOT / "k8s" / "backend-deployment.yaml",
        REPO_ROOT / "k8s" / "gateway-deployment.yaml",
        REPO_ROOT / "k8s" / "namespace.yaml",
        REPO_ROOT / "deploy" / "helm" / "modular-showcase" / "Chart.yaml",
        REPO_ROOT / "deploy" / "helm" / "modular-showcase" / "values.yaml",
    ]

    for path in required_paths:
        assert path.exists(), f"missing deployment artifact: {path}"
