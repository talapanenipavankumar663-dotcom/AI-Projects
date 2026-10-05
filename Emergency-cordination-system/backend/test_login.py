from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

url = "/auth/login"
payload = {
    "username": "resident@test.com",
    "password": "Resident@123"
}

resp = client.post(url, data=payload)
print("Status Code:", resp.status_code)
print("Response:", resp.text)
