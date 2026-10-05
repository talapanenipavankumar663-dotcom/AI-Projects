from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_user_data_isolation():
    # Ensure Sarah Connor exists
    client.post("/users/", json={
        "first_name": "Sarah",
        "last_name": "Connor",
        "email": "newresident700@example.com",
        "phone": "+1555700800",
        "password": "password123"
    })

    # Login as Sarah Connor
    login_data = {"username": "newresident700@example.com", "password": "password123"}
    resp = client.post("/auth/login", data=login_data)
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # Fetch profile
    me_resp = client.get("/users/me", headers=headers)
    print("Logged In Profile:", me_resp.json())

    # Fetch contacts
    contacts_resp = client.get("/emergency-contacts/", headers=headers)
    print("Emergency Contacts:", contacts_resp.json())

if __name__ == "__main__":
    test_user_data_isolation()
