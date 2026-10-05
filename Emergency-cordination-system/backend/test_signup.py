from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_signup():
    url = "/users/"
    data = {
        "first_name": "Test",
        "last_name": "User",
        "email": "testuser99@example.com",
        "phone": "+1555999000",
        "password": "password123"
    }
    response = client.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    test_signup()
