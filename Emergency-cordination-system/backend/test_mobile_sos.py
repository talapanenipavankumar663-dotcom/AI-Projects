from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_mobile_api_sos():
    # Ensure resident exists
    client.post("/users/", json={
        "first_name": "Sarah",
        "last_name": "Connor",
        "email": "newresident700@example.com",
        "phone": "+1555700800",
        "password": "password123"
    })

    # Login as resident
    login_data = {"username": "newresident700@example.com", "password": "password123"}
    resp = client.post("/auth/login", data=login_data)
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # Post to /api/sos/ (used by mobile app)
    mobile_sos_url = "/api/sos/"
    payload = {
        "emergency_type": "Fire Hazard",
        "remarks": "Smoke coming from kitchen window",
        "flat_no": "Flat A101",
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    sos_resp = client.post(mobile_sos_url, json=payload, headers=headers)
    print(f"Mobile SOS Status: {sos_resp.status_code}")
    print(f"Mobile SOS Output: {sos_resp.json()}")

if __name__ == "__main__":
    test_mobile_api_sos()
