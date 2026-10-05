import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token
from app import crud, models, schemas
from app.database import SessionLocal

client = TestClient(app)

class TestEscalationAndVolunteers(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        
        # Ensure test resident exists
        res_user = crud.get_user_by_email(cls.db, "alice.smith@example.com")
        if not res_user:
            res_user = crud.create_user(cls.db, schemas.UserCreate(
                first_name="Alice", last_name="Smith", email="alice.smith@example.com", phone="+1999000111", password="password123"
            ))
        cls.resident_token = create_access_token({"sub": res_user.email})
        cls.resident_headers = {"Authorization": f"Bearer {cls.resident_token}"}

        # Ensure test volunteer exists with Volunteer role
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

        # Fetch or create society, block, flat
        soc = cls.db.query(models.Society).first()
        if not soc:
            soc = models.Society(society_name="Green Valley", address="123 St", city="City", state="State", pincode="10001")
            cls.db.add(soc)
            cls.db.commit()
            cls.db.refresh(soc)
        cls.soc_id = soc.id

        blk = cls.db.query(models.Block).filter(models.Block.society_id == cls.soc_id).first()
        if not blk:
            blk = models.Block(society_id=cls.soc_id, block_name="Block A", description="Desc")
            cls.db.add(blk)
            cls.db.commit()
            cls.db.refresh(blk)
        cls.block_id = blk.id

        flt = cls.db.query(models.Flat).filter(models.Flat.block_id == cls.block_id).first()
        if not flt:
            flt = models.Flat(block_id=cls.block_id, flat_number="101", floor_number=1)
            cls.db.add(flt)
            cls.db.commit()
            cls.db.refresh(flt)
        cls.flat_id = flt.id

    def test_01_volunteer_availability_toggle(self):
        # Set to ONLINE
        res1 = client.post("/api/volunteers/availability/", json={"is_available": True}, headers=self.volunteer_headers)
        self.assertEqual(res1.status_code, 200)
        self.assertTrue(res1.json()["is_available"])

        # Fetch status
        res2 = client.get("/api/volunteers/availability/", headers=self.volunteer_headers)
        self.assertEqual(res2.status_code, 200)
        self.assertTrue(res2.json()["is_available"])

        # Set to OFFLINE
        res3 = client.post("/api/volunteers/availability/", json={"is_available": False}, headers=self.volunteer_headers)
        self.assertEqual(res3.status_code, 200)
        self.assertFalse(res3.json()["is_available"])

    def test_02_incident_accept_and_responder_assignment(self):
        # Raise SOS alert
        sos_payload = {
            "emergency_type": "Medical Emergency",
            "emergency_message": "Need urgent medical support in Flat 101",
            "flat_no": "101",
            "block": "Block A",
            "society": "Green Valley Apartments",
            "flat_id": self.flat_id,
            "society_id": self.soc_id,
            "latitude": 12.9716,
            "longitude": 77.5946
        }
        sos_res = client.post("/api/sos/", json=sos_payload, headers=self.resident_headers)
        self.assertEqual(sos_res.status_code, 201)
        alert_id = sos_res.json()["id"]

        # Volunteer accepts incident
        accept_res = client.post(f"/api/incidents/{alert_id}/accept/", headers=self.volunteer_headers)
        self.assertEqual(accept_res.status_code, 200)
        data = accept_res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["incident_id"], alert_id)
        self.assertIn("Clara", data["assigned_to"])

        # Create second volunteer to test duplicate assignment blocking
        vol2_user = crud.get_user_by_email(self.db, "second.vol@example.com")
        if not vol2_user:
            vol2_user = crud.create_user(self.db, schemas.UserCreate(
                first_name="Second", last_name="Responder", email="second.vol@example.com", phone="+1999000333", password="password123"
            ))
        vol2_token = create_access_token({"sub": vol2_user.email})
        vol2_headers = {"Authorization": f"Bearer {vol2_token}"}

        # Verify second accept attempt by DIFFERENT user is blocked with 400
        dup_res = client.post(f"/api/incidents/{alert_id}/accept/", headers=vol2_headers)
        self.assertEqual(dup_res.status_code, 400)
        self.assertIn("already been accepted", dup_res.json()["detail"])

        # Verify escalation logs endpoint
        logs_res = client.get(f"/api/incidents/{alert_id}/escalation-logs/", headers=self.volunteer_headers)
        self.assertEqual(logs_res.status_code, 200)
        self.assertIsInstance(logs_res.json(), list)

if __name__ == "__main__":
    unittest.main()
