from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_user_flow():
    # 1. Signup
    signup_url = "/users/"
    signup_data = {
        "first_name": "Sarah",
        "last_name": "Connor",
        "email": "newresident700@example.com",
        "phone": "+1555700800",
        "password": "password123"
    }
    resp = client.post(signup_url, json=signup_data)
    print(f"Signup Status: {resp.status_code}")
    print(f"Signup Data: {resp.json()}")

    # 2. Login
    login_url = "/auth/login"
    login_data = {"username": "newresident700@example.com", "password": "password123"}
    login_resp = client.post(login_url, data=login_data)
    print(f"Login Status: {login_resp.status_code}")
    token = login_resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # 3. Raise SOS
    sos_url = "/sos/raise"
    sos_resp = client.post(sos_url, headers=headers)
    print(f"SOS Raise Status: {sos_resp.status_code}")
    print(f"SOS Response Text: {sos_resp.text}")

if __name__ == "__main__":
    test_full_user_flow()
