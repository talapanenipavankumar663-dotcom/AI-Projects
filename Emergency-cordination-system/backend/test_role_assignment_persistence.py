import unittest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.auth import create_access_token
from app import models

client = TestClient(app)

class TestRoleAssignmentPersistence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.admin_token = create_access_token({"sub": "admin@test.com"})
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    def test_role_assignment_and_login_reflection(self):
        unique_id = int(time.time())
        email = f"assigned_user_{unique_id}@test.com"
        phone = f"+9197{unique_id % 100000000:08d}"
        password = "Password123"

        # 1. Create a plain user
        signup_res = client.post("/users/", json={
            "first_name": "RoleTest",
            "last_name": "User",
            "email": email,
            "phone": phone,
            "password": password
        })
        self.assertEqual(signup_res.status_code, 200)
        user_id = signup_res.json()["id"]

        # 2. Admin assigns role 'Volunteer' via PUT /users/{user_id}
        put_res = client.put(f"/users/{user_id}", json={"role": "Volunteer"}, headers=self.admin_headers)
        self.assertEqual(put_res.status_code, 200)
        updated_data = put_res.json()
        self.assertTrue(any("volunteer" in r.lower() for r in updated_data.get("roles", [])))

        # 3. Log in as the newly assigned user
        login_res = client.post("/auth/login", json={"email": email, "password": password})
        self.assertEqual(login_res.status_code, 200)
        user_token = login_res.json()["access_token"]

        # 4. Fetch /users/me and verify assigned role is 'Volunteer'
        me_res = client.get("/users/me", headers={"Authorization": f"Bearer {user_token}"})
        self.assertEqual(me_res.status_code, 200)
        me_roles = me_res.json().get("roles", [])
        self.assertTrue(any("volunteer" in r.lower() for r in me_roles), f"User should have Volunteer role, got {me_roles}")

        # 5. Clean up
        client.delete(f"/users/{user_id}", headers=self.admin_headers)

if __name__ == "__main__":
    unittest.main()
