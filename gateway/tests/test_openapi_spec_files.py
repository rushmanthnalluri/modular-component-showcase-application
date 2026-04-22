from pathlib import Path

import yaml


def test_contract_files_parse_and_contain_core_paths():
    repo_root = Path(__file__).resolve().parents[2]
    expected = {
        "openapi-backend.yaml": ["/components", "/vector/search/hybrid", "/reconciliation/status"],
        "openapi-gateway.yaml": ["/health", "/readyz", "/livez", "/api/{full_path}"],
        "openapi-spring.yaml": ["/health", "/components", "/components/search"],
    }

    for filename, required_paths in expected.items():
        document = yaml.safe_load((repo_root / "contracts" / filename).read_text(encoding="utf-8"))
        paths = document.get("paths", {})
        for path in required_paths:
            assert path in paths
