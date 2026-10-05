import sys
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token
from app import crud, models, schemas
from app.database import SessionLocal

client = TestClient(app, raise_server_exceptions=False)
db = SessionLocal()

# Setup test user tokens
admin_token = create_access_token({"sub": "admin@test.com"})
resident_token = create_access_token({"sub": "resident@test.com"})
volunteer_token = create_access_token({"sub": "volunteer@test.com"})

admin_headers = {"Authorization": f"Bearer {admin_token}"}
resident_headers = {"Authorization": f"Bearer {resident_token}"}
volunteer_headers = {"Authorization": f"Bearer {volunteer_token}"}

endpoints = [
    ("GET", "/health", None, None),
    ("GET", "/api/incidents/summary/", admin_headers, None),
    ("GET", "/api/incidents/active/", admin_headers, None),
    ("GET", "/api/incidents/", admin_headers, None),
    ("GET", "/api/incidents/history/", admin_headers, None),
    ("GET", "/api/sos/", resident_headers, None),
    ("GET", "/api/notifications/", resident_headers, None),
    ("GET", "/api/volunteers/availability/", volunteer_headers, None),
    ("POST", "/api/sos/", resident_headers, {
        "emergency_type": "Medical Emergency",
        "emergency_message": "Test SOS",
        "latitude": 12.97,
        "longitude": 77.59
    }),
]

print("--- TESTING ENDPOINTS FOR 500 ERRORS ---")
for method, url, headers, json_data in endpoints:
    if method == "GET":
        res = client.get(url, headers=headers)
    elif method == "POST":
        res = client.post(url, headers=headers, json=json_data)
    
    print(f"[{res.status_code}] {method} {url}")
    if res.status_code == 500:
        print(f"   => 500 ERROR DETAILS: {res.text}\n")
