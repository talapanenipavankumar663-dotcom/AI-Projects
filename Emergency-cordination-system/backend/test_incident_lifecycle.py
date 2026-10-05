import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token
from app import crud, models, schemas
from app.database import SessionLocal

client = TestClient(app)

class TestIncidentLifecycle(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()

        # Resident
        res_user = crud.get_user_by_email(cls.db, "alice.smith@example.com")
        if not res_user:
            res_user = crud.create_user(cls.db, schemas.UserCreate(
                first_name="Alice", last_name="Smith", email="alice.smith@example.com", phone="+1999000111", password="password123"
            ))
        cls.resident_token = create_access_token({"sub": res_user.email})
        cls.resident_headers = {"Authorization": f"Bearer {cls.resident_token}"}

        # Responder / Volunteer
        vol_user = crud.get_user_by_email(cls.db, "clara.o@example.com")
        if not vol_user:
            vol_user = crud.create_user(cls.db, schemas.UserCreate(
                first_name="Clara", last_name="Oswald", email="clara.o@example.com", phone="+1999000222", password="password123"
            ))
        vol_role = crud.get_role_by_name(cls.db, "Volunteer")
        if vol_role:
            existing_ur = cls.db.query(models.UserRole).filter_by(user_id=vol_user.id, role_id=vol_role.id).first()
            if not existing_ur:
                cls.db.add(models.UserRole(user_id=vol_user.id, role_id=vol_role.id))
                cls.db.commit()
        cls.volunteer_token = create_access_token({"sub": vol_user.email})
        cls.volunteer_headers = {"Authorization": f"Bearer {cls.volunteer_token}"}

        # Fetch society, block, flat
        soc = cls.db.query(models.Society).first()
        cls.soc_id = soc.id
        blk = cls.db.query(models.Block).filter(models.Block.society_id == cls.soc_id).first()
        cls.block_id = blk.id
        flt = cls.db.query(models.Flat).filter(models.Flat.block_id == cls.block_id).first()
        cls.flat_id = flt.id

    def test_full_incident_lifecycle_and_timeline(self):
        # 1. SOS Created (Open)
        sos_payload = {
            "emergency_type": "Medical Emergency",
            "emergency_message": "Medical support required",
            "flat_no": "101",
            "block": "Block A",
            "society": "Green Valley",
            "flat_id": self.flat_id,
            "society_id": self.soc_id
        }
        sos_res = client.post("/api/sos/", json=sos_payload, headers=self.resident_headers)
        self.assertEqual(sos_res.status_code, 201)
        alert_id = sos_res.json()["id"]

        # 2. Responder Accepts (Assigned)
        accept_res = client.post(f"/api/incidents/{alert_id}/accept/", headers=self.volunteer_headers)
        self.assertEqual(accept_res.status_code, 200)

        # 3. Status Update -> Reached Location
        st1_res = client.patch(f"/api/incidents/{alert_id}/status/", json={"status": "Reached Location"}, headers=self.volunteer_headers)
        self.assertEqual(st1_res.status_code, 200)

        # 4. Status Update -> Assistance Started
        st2_res = client.patch(f"/api/incidents/{alert_id}/status/", json={"status": "Assistance Started"}, headers=self.volunteer_headers)
        self.assertEqual(st2_res.status_code, 200)

        # 5. Status Update -> Resolved
        st3_res = client.patch(f"/api/incidents/{alert_id}/status/", json={"status": "Resolved"}, headers=self.volunteer_headers)
        self.assertEqual(st3_res.status_code, 200)

        # 6. Close Incident with Documentation (Closed)
        close_payload = {
            "resolution_summary": "First aid administered. Patient is stable and resting.",
            "remarks": "No hospital transfer required."
        }
        close_res = client.post(f"/api/incidents/{alert_id}/close/", json=close_payload, headers=self.volunteer_headers)
        self.assertEqual(close_res.status_code, 200)
        self.assertTrue(close_res.json()["success"])
        self.assertEqual(close_res.json()["status"], "Closed")

        # 7. Verify Timeline Events Logged
        timeline_res = client.get(f"/api/incidents/{alert_id}/timeline/", headers=self.volunteer_headers)
        self.assertEqual(timeline_res.status_code, 200)
        timeline_events = timeline_res.json()
        self.assertGreaterEqual(len(timeline_events), 4)

        actions = [ev["action"] for ev in timeline_events]
        self.assertIn("SOS Created", actions)
        self.assertIn("Volunteer Accepted Incident", actions)
        self.assertIn("Status Updated: Reached Location", actions)
        self.assertIn("Incident Closed & Documented", actions)

if __name__ == "__main__":
    unittest.main()
