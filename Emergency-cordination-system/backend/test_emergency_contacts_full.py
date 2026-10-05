import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app import models, crud

from app.auth import create_access_token

client = TestClient(app)

class TestEmergencyContactsFull(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.resident_token = create_access_token({"sub": "resident@test.com"})
        cls.resident_headers = {"Authorization": f"Bearer {cls.resident_token}"}

    def test_contacts_flow(self):
        # 1. Create contact via POST /contacts/
        payload = {
            "name": "Jane Contact",
            "relationship": "Spouse",
            "phone_number": "+1555019922",
            "priority": 1
        }
        res = client.post("/contacts/", json=payload, headers=self.resident_headers)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["name"], "Jane Contact")
        self.assertEqual(data["phone_number"], "+1555019922")
        contact_id = data["id"]

        # 2. Get contacts via GET /contacts/
        res = client.get("/contacts/", headers=self.resident_headers)
        self.assertEqual(res.status_code, 200)
        contacts = res.json()
        self.assertTrue(any(c["id"] == contact_id for c in contacts))

        # 3. Generate OTP via POST /contacts/{id}/generate-otp
        res = client.post(f"/contacts/{contact_id}/generate-otp", headers=self.resident_headers)
        self.assertEqual(res.status_code, 200)
        otp = res.json().get("otp")
        self.assertIsNotNone(otp)

        # 4. Verify OTP via POST /contacts/{id}/verify
        res = client.post(f"/contacts/{contact_id}/verify", json={"otp": otp}, headers=self.resident_headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json().get("success"))

        # 5. Check alias GET /emergency-contacts/
        res = client.get("/emergency-contacts/", headers=self.resident_headers)
        self.assertEqual(res.status_code, 200)
        contacts_alias = res.json()
        self.assertTrue(any(c["id"] == contact_id for c in contacts_alias))

        # 6. Delete contact via DELETE /contacts/{id}
        res = client.delete(f"/contacts/{contact_id}", headers=self.resident_headers)
        self.assertEqual(res.status_code, 200)

        # 7. Verify deletion
        res = client.get("/contacts/", headers=self.resident_headers)
        self.assertEqual(res.status_code, 200)
        self.assertFalse(any(c["id"] == contact_id for c in res.json()))

if __name__ == "__main__":
    unittest.main()
