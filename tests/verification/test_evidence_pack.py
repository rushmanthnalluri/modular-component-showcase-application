from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def test_required_proof_pack_documents_exist():
    required_docs = [
        "docs/spring-verification-report.md",
        "docs/atlas-live-verification.md",
        "docs/database-proof-pack.md",
        "docs/vector-proof-pack.md",
        "docs/api-proof-pack.md",
        "docs/multi-framework-proof-pack.md",
        "docs/microservices-proof-pack.md",
        "docs/deployment-proof-pack.md",
    ]

    for relative_path in required_docs:
        target = REPO_ROOT / relative_path
        assert target.exists(), f"missing proof document: {relative_path}"
        assert target.read_text(encoding="utf-8").strip()


def test_screenshot_manifest_directories_exist():
    required_manifests = [
        "docs/screenshots/README.md",
        "docs/screenshots/atlas/README.md",
        "docs/screenshots/database/README.md",
        "docs/screenshots/vector/README.md",
        "docs/screenshots/api/README.md",
        "docs/screenshots/multi-framework/README.md",
        "docs/screenshots/microservices/README.md",
        "docs/screenshots/deployment/README.md",
    ]

    for relative_path in required_manifests:
        target = REPO_ROOT / relative_path
        assert target.exists(), f"missing screenshot manifest: {relative_path}"
        assert target.read_text(encoding="utf-8").strip()
