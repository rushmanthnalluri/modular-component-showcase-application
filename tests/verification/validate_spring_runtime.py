import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import yaml


BASE_URL = "http://127.0.0.1:8081"
REPO_ROOT = Path(__file__).resolve().parents[2]


def fetch_text(path: str) -> str:
    with urllib.request.urlopen(f"{BASE_URL}{path}", timeout=10) as response:
        return response.read().decode("utf-8")


def wait_for_health(timeout_seconds: int = 90) -> None:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            payload = json.loads(fetch_text("/actuator/health"))
            if payload.get("status") == "UP":
                return
        except (urllib.error.URLError, json.JSONDecodeError):
            time.sleep(2)
            continue
        time.sleep(2)

    raise RuntimeError("Spring runtime did not become healthy before timeout.")


def main() -> int:
    wait_for_health()

    openapi_payload = json.loads(fetch_text("/v3/api-docs"))
    metrics_payload = json.loads(fetch_text("/actuator/metrics/jvm.threads.live"))
    contract = yaml.safe_load((REPO_ROOT / "contracts" / "openapi-spring.yaml").read_text(encoding="utf-8"))

    runtime_paths = set(openapi_payload.get("paths", {}).keys())
    normalized_runtime_paths = {
        path[len("/spring") :] if path.startswith("/spring/") else path for path in runtime_paths
    }
    contract_paths = set(contract.get("paths", {}).keys())

    missing_paths = sorted(contract_paths - normalized_runtime_paths)
    if missing_paths:
        raise AssertionError(f"runtime openapi missing contract paths: {missing_paths}")

    security_schemes = openapi_payload.get("components", {}).get("securitySchemes", {})
    if "bearerAuth" not in security_schemes:
        raise AssertionError("runtime openapi is missing bearerAuth security scheme")

    if metrics_payload.get("name") != "jvm.threads.live":
        raise AssertionError("actuator metrics endpoint did not expose jvm.threads.live")

    print("Spring runtime verification passed")
    print(f"Validated paths: {', '.join(sorted(contract_paths))}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # pragma: no cover - CI failure path
        print(f"Spring runtime verification failed: {exc}", file=sys.stderr)
        raise
