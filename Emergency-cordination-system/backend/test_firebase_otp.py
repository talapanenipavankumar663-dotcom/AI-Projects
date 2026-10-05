import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.auth import create_access_token
from app import models

client = TestClient(app)

class TestFirebaseOtpVerification(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.resident_token = create_access_token({"sub": "resident@test.com"})
        cls.resident_headers = {"Authorization": f"Bearer {cls.resident_token}"}
        cls.user = cls.db.query(models.User).filter_by(email="resident@test.com").first()

    def test_firebase_token_verification(self):
        # 1. Create emergency contact
        contact_payload = {
            "name": "Firebase Contact",
            "relationship": "Sister",
            "phone_number": "+919876543210",
            "priority": 3
        }
        res = client.post("/contacts/", json=contact_payload, headers=self.resident_headers)
        self.assertEqual(res.status_code, 201)
        contact_id = res.json()["id"]

        # 2. Verify via Firebase ID Token (Dev/Mock or Real Token format)
        firebase_payload = {
            "firebase_id_token": "DEV_MOCK_TOKEN_+919876543210"
        }
        res = client.post(f"/contacts/{contact_id}/verify", json=firebase_payload, headers=self.resident_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("Firebase", data.get("message", ""))

        # 3. Verify database status
        contact_db = self.db.query(models.EmergencyContact).filter_by(id=contact_id).first()
        self.assertTrue(contact_db.is_verified)
        self.assertEqual(contact_db.verification_method, "FIREBASE")

        # 4. Clean up
        client.delete(f"/contacts/{contact_id}", headers=self.resident_headers)

if __name__ == "__main__":
    unittest.main()
