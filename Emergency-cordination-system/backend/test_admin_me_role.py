import unittest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestAdminMeRole(unittest.TestCase):
    def test_admin_me_endpoint_returns_admin_role(self):
        # 1. Login as admin@example.com
        login_res = client.post("/auth/login", json={"email": "admin@example.com", "password": "password123"})
        self.assertEqual(login_res.status_code, 200)
        token = login_res.json()["access_token"]

        # 2. Call GET /users/me
        headers = {"Authorization": f"Bearer {token}"}
        me_res = client.get("/users/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        user_data = me_res.json()

        # 3. Assert roles contains 'Admin' or 'ADMIN'
        roles = user_data.get("roles", [])
        self.assertTrue(any("admin" in r.lower() for r in roles), f"User admin@example.com roles should contain Admin, got: {roles}")

if __name__ == "__main__":
    unittest.main()
