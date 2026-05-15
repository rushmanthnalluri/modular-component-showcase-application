import pytest
import httpx
import uuid
import base64
import os

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8000")

@pytest.fixture
def client():
    return httpx.Client(base_url=GATEWAY_URL, follow_redirects=True)


def require_live_gateway(client):
    try:
        response = client.get("/livez", timeout=2)
    except httpx.HTTPError as exc:
        pytest.skip(f"Live gateway is not available at {GATEWAY_URL}: {exc}")

    if response.status_code != 200:
        pytest.skip(f"Live gateway is not healthy at {GATEWAY_URL}: {response.status_code}")

def test_full_e2e_flow(client):
    require_live_gateway(client)
    checks = []

    def record(name, condition, details=""):
        checks.append({"name": name, "passed": bool(condition), "details": details})
        assert condition, details or name

    # 1. CSRF Fetch
    resp = client.get("/api/auth/csrf")
    record("csrf status", resp.status_code == 200, resp.text)
    csrf_token = resp.json().get("csrfToken") or resp.json().get("data", {}).get("csrfToken")
    record("csrf token issued", csrf_token is not None)
    
    headers = {"x-csrf-token": csrf_token}
    
    # 2. Register
    email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    reg_payload = {
        "fullName": "Test User",
        "email": email,
        "password": "password123",
        "phone": "1234567890",
        "role": "developer"
    }
    resp = client.post("/api/auth/register", json=reg_payload, headers=headers)
    record("register status", resp.status_code == 201, resp.text)
    record("register envelope", resp.json().get("success") is True, resp.text)
    
    # 3. Login
    login_payload = {
        "email": email,
        "password": "password123"
    }
    resp = client.post("/api/auth/login", json=login_payload, headers=headers)
    record("login status", resp.status_code == 200, resp.text)
    login_data = resp.json().get("data") or resp.json()
    token = login_data.get("token") or login_data.get("accessToken")
    record("login token", bool(token), resp.text)
    record("auth session established", any(cookie.name == "auth_token" for cookie in client.cookies.jar) or bool(token))
    auth_headers = {**headers, "Authorization": f"Bearer {token}"}
    
    # 4. Create Component
    comp_payload = {
        "name": f"Test Component {uuid.uuid4().hex[:4]}",
        "description": "A component created by E2E test",
        "category": "buttons",
        "jsxCode": "<button>Test</button>",
        "tags": ["test", "e2e"],
        "thumbnail": "https://example.com/thumb.png",
    }
    resp = client.post("/api/components", json=comp_payload, headers=auth_headers)
    record("create component status", resp.status_code == 201, resp.text)
    comp_data = resp.json().get("data") or resp.json()
    comp_id = comp_data.get("id")
    record("component id returned", comp_id is not None, resp.text)

    resp = client.get(f"/api/components/{comp_id}", headers=auth_headers)
    record("component persisted", resp.status_code == 200 and (resp.json().get("data") or resp.json()).get("id") == comp_id, resp.text)
    
    # 5. Edit Component
    edit_payload = {
        "description": "Updated description by E2E test",
        "jsxCode": "<button>Updated Test</button>"
    }
    resp = client.put(f"/api/components/{comp_id}", json=edit_payload, headers=auth_headers)
    record("edit component status", resp.status_code == 200, resp.text)
    edited_data = resp.json().get("data") or resp.json()
    record("edit component persisted", edited_data.get("description") == "Updated description by E2E test", resp.text)
    
    # 6. Add Review + Rating
    review_payload = {
        "rating": 5,
        "title": "Great component",
        "comment": "Works as expected"
    }
    resp = client.post(f"/api/components/{comp_id}/reviews", json=review_payload, headers=auth_headers)
    record("review status", resp.status_code == 201, resp.text)
    
    rating_payload = {"rating": 4}
    resp = client.post(f"/api/components/{comp_id}/ratings", json=rating_payload, headers=auth_headers)
    record("rating status", resp.status_code == 200, resp.text)
    
    # 7. Add Discussion
    disc_payload = {
        "message": "Is this component responsive?"
    }
    resp = client.post(f"/api/components/{comp_id}/discussions", json=disc_payload, headers=auth_headers)
    record("discussion status", resp.status_code == 201, resp.text)
    
    # 8. Favorite Toggle
    resp = client.post(f"/api/users/me/favorites/{comp_id}", headers=auth_headers)
    record("favorite add status", resp.status_code == 200, resp.text)
    fav_data = resp.json().get("data") or resp.json()
    record("favorite added", comp_id in fav_data.get("favorites", []), resp.text)

    resp = client.post(f"/api/users/me/favorites/{comp_id}", headers=auth_headers)
    record("favorite remove status", resp.status_code == 200, resp.text)
    fav_data = resp.json().get("data") or resp.json()
    record("favorite removed", comp_id not in fav_data.get("favorites", []), resp.text)
    
    # 9. Avatar Upload
    png_bytes = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
    )
    files = {"avatar": ("test.png", png_bytes, "image/png")}
    data = {"fullName": "Test User", "email": email, "phone": "1234567890"}
    resp = client.put("/api/users/me", files=files, data=data, headers=auth_headers)
    record("avatar upload status", resp.status_code == 200, resp.text)
    user_data = (resp.json().get("data") or resp.json()).get("user", {})
    record("avatar public url", str(user_data.get("avatarUrl", "")).startswith("http"), resp.text)
    record("avatar path no app leak", "/app/" not in str(user_data.get("avatarPath", "")), resp.text)
    
    # 10. Delete Component
    resp = client.delete(f"/api/components/{comp_id}", headers=auth_headers)
    record("delete component status", resp.status_code == 200, resp.text)

    resp = client.get(f"/api/components/{comp_id}", headers=auth_headers)
    record("delete component persisted", resp.status_code == 404, resp.text)

    passed = sum(1 for item in checks if item["passed"])
    failed = len(checks) - passed
    print(f"\n[E2E Proof] user={email} component={comp_id} passed={passed} failed={failed}")
    for item in checks:
        print(f"[E2E Proof] {'PASS' if item['passed'] else 'FAIL'} - {item['name']}")

if __name__ == "__main__":
    # If run directly
    import sys
    pytest.main([__file__])
