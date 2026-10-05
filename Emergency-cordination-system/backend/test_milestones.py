import sys
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.auth import create_access_token

client = TestClient(app)

class TestMilestones(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.resident_token = create_access_token({"sub": "resident@test.com"})
        cls.admin_token = create_access_token({"sub": "admin@test.com"})
        cls.security_token = create_access_token({"sub": "security@test.com"})
        cls.volunteer_token = create_access_token({"sub": "volunteer@test.com"})
        
        cls.resident_headers = {"Authorization": f"Bearer {cls.resident_token}"}
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}
        cls.security_headers = {"Authorization": f"Bearer {cls.security_token}"}
        cls.volunteer_headers = {"Authorization": f"Bearer {cls.volunteer_token}"}

    def test_01_health(self):
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json().get("status"), "Server is running")

    def test_02_societies_blocks_flats(self):
        # List societies
        res = client.get("/societies/", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        societies = res.json()
        self.assertGreater(len(societies), 0)
        soc_id = societies[0]["id"]

        # List blocks under society
        res = client.get(f"/blocks/society/{soc_id}", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        blocks = res.json()
        self.assertGreater(len(blocks), 0)

        # List flats under block
        block_id = blocks[0]["id"]
        res = client.get(f"/flats/block/{block_id}", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)

    def test_03_emergency_contacts_and_verification(self):
        # Add emergency contact
        contact_payload = {
            "name": "Test Father",
            "relationship": "Father",
            "phone_number": "+1999888777",
            "email": "father@test.com",
            "priority": 2
        }
        res = client.post("/contacts/", json=contact_payload, headers=self.resident_headers)
        self.assertEqual(res.status_code, 201)
        contact = res.json()
        contact_id = contact["id"]

        # Generate OTP
        res = client.post(f"/contacts/{contact_id}/generate-otp", headers=self.resident_headers)
        self.assertEqual(res.status_code, 200)
        otp = res.json().get("otp")
        self.assertIsNotNone(otp)

        # Verify OTP
        res = client.post(f"/contacts/{contact_id}/verify", json={"otp": otp}, headers=self.resident_headers)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json().get("success"))

    def test_04_sos_alert_creation_and_routing(self):
        sos_payload = {
            "emergency_type": "Medical Emergency",
            "emergency_message": "Need immediate medical help in Flat A-101!",
            "latitude": 12.9716,
            "longitude": 77.5946
        }
        res = client.post("/api/sos/", json=sos_payload, headers=self.resident_headers)
        self.assertEqual(res.status_code, 201)
        sos_data = res.json()
        self.assertEqual(sos_data["status"], "Open")
        self.assertEqual(sos_data["emergency_type"], "Medical Emergency")
        self.assertEqual(sos_data["latitude"], 12.9716)

        sos_id = sos_data["id"]

        # Verify Notifications created for Security / Guardian
        res = client.get(f"/api/incidents/{sos_id}", headers=self.security_headers)
        self.assertEqual(res.status_code, 200)

    def test_05_incident_tracking_and_accept(self):
        # List active incidents
        res = client.get("/api/incidents/active/", headers=self.security_headers)
        self.assertEqual(res.status_code, 200)
        incidents = res.json()
        self.assertGreater(len(incidents), 0)
        sos_id = incidents[0]["id"]

        # Security accepts incident
        res = client.post(f"/api/sos/{sos_id}/accept", headers=self.security_headers)
        self.assertEqual(res.status_code, 200)

        # Verify incident status updated to Response Assigned or Assigned
        res = client.get(f"/api/incidents/{sos_id}", headers=self.security_headers)
        self.assertEqual(res.status_code, 200)
        inc_detail = res.json()
        self.assertIn(inc_detail["status"], ["Response Assigned", "Assigned", "In Progress"])

        # Admin resolves incident
        res = client.patch(f"/api/sos/{sos_id}/status/", json={"status": "Resolved"}, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "Resolved")

    def test_06_admin_dashboard_summary(self):
        res = client.get("/api/incidents/summary/", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        summary = res.json()
        self.assertIn("total_incidents", summary)
        self.assertIn("active_incidents", summary)
        self.assertIn("resolved_incidents", summary)

if __name__ == "__main__":
    unittest.main()
