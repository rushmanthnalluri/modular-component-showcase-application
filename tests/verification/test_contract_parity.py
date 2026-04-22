from pathlib import Path

import yaml


REPO_ROOT = Path(__file__).resolve().parents[2]


def _load_contract(name: str):
    return yaml.safe_load((REPO_ROOT / "contracts" / name).read_text(encoding="utf-8"))


def test_backend_and_spring_contracts_share_component_listing_surface():
    backend_contract = _load_contract("openapi-backend.yaml")
    spring_contract = _load_contract("openapi-spring.yaml")

    assert "/components" in backend_contract["paths"]
    assert "/components" in spring_contract["paths"]
    assert "get" in backend_contract["paths"]["/components"]
    assert "get" in spring_contract["paths"]["/components"]


def test_spring_contract_documents_authentication_and_bearer_security():
    spring_contract = _load_contract("openapi-spring.yaml")

    assert "/auth/token" in spring_contract["paths"]
    assert "bearerAuth" in spring_contract.get("components", {}).get("securitySchemes", {})


def test_backend_contract_keeps_semantic_and_hybrid_search_routes():
    backend_contract = _load_contract("openapi-backend.yaml")

    assert "/vector/search/hybrid" in backend_contract["paths"]
    assert "/vector/search/semantic" in backend_contract["paths"]
    assert "/vector/providers/capabilities" in backend_contract["paths"]
