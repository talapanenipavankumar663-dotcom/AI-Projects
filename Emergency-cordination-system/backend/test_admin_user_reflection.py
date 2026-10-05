import unittest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.auth import create_access_token
from app import models, crud

client = TestClient(app)

class TestAdminUserReflection(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.admin_token = create_access_token({"sub": "admin@test.com"})
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    def test_user_creation_reflects_in_admin_users_endpoint(self):
        unique_id = int(time.time())
        email = f"adminreflect_{unique_id}@test.com"
        phone = f"+9199{unique_id % 100000000:08d}"

        # 1. Create a new user via POST /users/ (Signup)
        user_payload = {
            "first_name": "AdminReflect",
            "last_name": "User",
            "email": email,
            "phone": phone,
            "password": "Password123"
        }
        res = client.post("/users/", json=user_payload)
        self.assertEqual(res.status_code, 200)
        created_user = res.json()
        self.assertEqual(created_user["email"], email)

        # 2. Fetch all users via GET /users/ (Admin endpoint)
        get_res = client.get("/users/", headers=self.admin_headers)
        self.assertEqual(get_res.status_code, 200)
        all_users = get_res.json()

        # 3. Verify newly created user is present in the admin list
        user_emails = [u["email"] for u in all_users]
        self.assertIn(email, user_emails)

        # 4. Clean up created test user
        client.delete(f"/users/{created_user['id']}", headers=self.admin_headers)

if __name__ == "__main__":
    unittest.main()
