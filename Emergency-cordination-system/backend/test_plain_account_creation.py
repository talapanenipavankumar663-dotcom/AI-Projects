import unittest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.auth import create_access_token
from app import models

client = TestClient(app)

class TestPlainAccountCreation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.admin_token = create_access_token({"sub": "admin@test.com"})
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    def test_plain_account_creation_and_admin_role_assignment(self):
        unique_id = int(time.time())
        email = f"plain_user_{unique_id}@test.com"
        phone = f"+9198{unique_id % 100000000:08d}"

        # 1. Create a plain account (signup)
        signup_payload = {
            "first_name": "Plain",
            "last_name": "Account",
            "email": email,
            "phone": phone,
            "password": "Password123"
        }
        res = client.post("/users/", json=signup_payload)
        self.assertEqual(res.status_code, 200)
        user_data = res.json()
        user_id = user_data["id"]

        # 2. Verify account is created plain (no role pre-assigned)
        user_roles_db = self.db.query(models.UserRole).filter(models.UserRole.user_id == user_id).all()
        self.assertEqual(len(user_roles_db), 0, "Newly created account should be plain without pre-assigned roles")

        # 3. Admin assigns role 'Security' via PUT /users/{user_id}
        update_payload = {"role": "Security"}
        update_res = client.put(f"/users/{user_id}", json=update_payload, headers=self.admin_headers)
        self.assertEqual(update_res.status_code, 200)

        # 4. Verify role 'Security' is now assigned to the user
        roles_after = self.db.query(models.Role.role_name).join(models.UserRole).filter(
            models.UserRole.user_id == user_id
        ).all()
        assigned_roles = [r[0].capitalize() for r in roles_after]
        self.assertIn("Security", assigned_roles)

        # 5. Clean up
        client.delete(f"/users/{user_id}", headers=self.admin_headers)

if __name__ == "__main__":
    unittest.main()
