import unittest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestAdminLogin(unittest.TestCase):
    def test_admin_login_credentials(self):
        # Test admin@example.com
        res1 = client.post("/auth/login", json={"email": "admin@example.com", "password": "password123"})
        self.assertEqual(res1.status_code, 200, f"admin@example.com login failed: {res1.text}")
        self.assertIn("access_token", res1.json())

        # Test admin@test.com
        res2 = client.post("/auth/login", json={"email": "admin@test.com", "password": "Admin@123"})
        self.assertEqual(res2.status_code, 200, f"admin@test.com login failed: {res2.text}")
        self.assertIn("access_token", res2.json())

if __name__ == "__main__":
    unittest.main()
