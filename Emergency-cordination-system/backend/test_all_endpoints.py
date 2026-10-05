import sys
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token
from app import crud, models, schemas
from app.database import SessionLocal

client = TestClient(app, raise_server_exceptions=False)
db = SessionLocal()

# Setup tokens for different roles
resident_user = crud.get_user_by_email(db, "alice.smith@example.com") or crud.get_users(db)[0]
resident_token = create_access_token({"sub": resident_user.email})

admin_user = crud.get_user_by_email(db, "admin@test.com") or resident_user
admin_token = create_access_token({"sub": admin_user.email})

volunteer_user = crud.get_user_by_email(db, "clara.o@example.com") or resident_user
volunteer_token = create_access_token({"sub": volunteer_user.email})

headers_map = {
    "Resident": {"Authorization": f"Bearer {resident_token}"},
    "Admin": {"Authorization": f"Bearer {admin_token}"},
    "Volunteer": {"Authorization": f"Bearer {volunteer_token}"},
}

def extract_routes(app_obj):
    routes = []
    for route in app_obj.router.routes:
        if hasattr(route, "original_router"):
            for r in route.original_router.routes:
                prefix = getattr(route, "prefix", "")
                full_path = prefix + r.path if prefix else r.path
                for m in getattr(r, "methods", []):
                    if m in ["GET", "POST", "PATCH", "PUT"]:
                        routes.append((m, full_path))
        elif hasattr(route, "methods") and hasattr(route, "path"):
            for m in route.methods:
                if m in ["GET", "POST", "PATCH", "PUT"]:
                    routes.append((m, route.path))
    return routes

all_routes = list(set(extract_routes(app)))

print(f"--- AUDITING {len(all_routes)} ENDPOINTS FOR 500 ERRORS ---")

errors_found = []

for method, path in all_routes:
    if path in ["/docs", "/openapi.json", "/redoc", "/favicon.ico", "/"]:
        continue

    # Substitute path parameters with sample ID 1
    test_path = (
        path.replace("{id}", "1")
        .replace("{contact_id}", "1")
        .replace("{alert_id}", "1")
        .replace("{user_id}", "1")
        .replace("{society_id}", "1")
        .replace("{block_id}", "1")
    )

    for role_name, headers in headers_map.items():
        try:
            if method == "GET":
                res = client.get(test_path, headers=headers)
            elif method == "POST":
                res = client.post(test_path, headers=headers, json={})
            elif method == "PATCH":
                res = client.patch(test_path, headers=headers, json={})
            elif method == "PUT":
                res = client.put(test_path, headers=headers, json={})

            if res.status_code == 500:
                print(f"[500 ERROR] [{role_name}] {method} {test_path}")
                print(f"   Details: {res.text[:300]}\n")
                errors_found.append((role_name, method, test_path, res.text))
        except Exception as exc:
            print(f"[EXCEPTION] [{role_name}] {method} {test_path}: {exc}")
            errors_found.append((role_name, method, test_path, str(exc)))

if not errors_found:
    print("[SUCCESS] ALL ENDPOINTS TESTED. NO 500 ERRORS FOUND!")
else:
    print(f"[WARNING] FOUND {len(errors_found)} 500 INTERNAL SERVER ERRORS:")
    for role, m, p, detail in errors_found:
        print(f"- [{role}] {m} {p} => {detail[:200]}")
