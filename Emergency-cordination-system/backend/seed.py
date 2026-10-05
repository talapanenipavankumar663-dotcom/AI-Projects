import os
import sys
from dotenv import load_dotenv

# Load env variables
load_dotenv()

from app.database import SessionLocal
from app import models
from app.auth import hash_password

def seed_db():
    db = SessionLocal()
    try:
        # 1. Seed Roles
        role_names = ["ADMIN", "RESIDENT", "SECURITY", "GUARDIAN", "VOLUNTEER", "Admin", "Resident", "Security", "Guardian", "Volunteer"]
        role_map = {}
        for name in role_names:
            r = db.query(models.Role).filter_by(role_name=name).first()
            if not r:
                r = models.Role(role_name=name)
                db.add(r)
                db.commit()
                db.refresh(r)
            role_map[name] = r
        print("Roles created")

        # 2. Seed Users & Assign Roles
        users_to_seed = [
            {
                "email": "admin@test.com",
                "first_name": "System",
                "last_name": "Admin",
                "phone": "000-000-0001",
                "password": "Admin@123",
                "roles": ["ADMIN", "Admin"]
            },
            {
                "email": "admin@example.com",
                "first_name": "System",
                "last_name": "Admin",
                "phone": "000-000-0099",
                "password": "password123",
                "roles": ["ADMIN", "Admin"]
            },
            {
                "email": "resident@test.com",
                "first_name": "Test",
                "last_name": "Resident",
                "phone": "000-000-0002",
                "password": "Resident@123",
                "roles": ["RESIDENT", "Resident"]
            },
            {
                "email": "alice.smith@example.com",
                "first_name": "Alice",
                "last_name": "Smith",
                "phone": "000-000-0010",
                "password": "password123",
                "roles": ["RESIDENT", "Resident"]
            },
            {
                "email": "security@test.com",
                "first_name": "Test",
                "last_name": "Security",
                "phone": "000-000-0003",
                "password": "Security@123",
                "roles": ["SECURITY", "Security"]
            },
            {
                "email": "guard.marcus@example.com",
                "first_name": "Officer",
                "last_name": "Marcus",
                "phone": "000-000-0011",
                "password": "password123",
                "roles": ["SECURITY", "Security"]
            },
            {
                "email": "guardian@test.com",
                "first_name": "Test",
                "last_name": "Guardian",
                "phone": "000-000-0004",
                "password": "Guardian@123",
                "roles": ["GUARDIAN", "Guardian"]
            },
            {
                "email": "volunteer@test.com",
                "first_name": "Test",
                "last_name": "Volunteer",
                "phone": "000-000-0005",
                "password": "Volunteer@123",
                "roles": ["VOLUNTEER", "Volunteer"]
            },
            {
                "email": "clara.o@example.com",
                "first_name": "Dr. Clara",
                "last_name": "Oswald",
                "phone": "000-000-0012",
                "password": "password123",
                "roles": ["VOLUNTEER", "Volunteer"]
            }
        ]

        user_map = {}
        for ud in users_to_seed:
            u = db.query(models.User).filter_by(email=ud["email"]).first()
            if not u:
                u = models.User(
                    first_name=ud["first_name"],
                    last_name=ud["last_name"],
                    email=ud["email"],
                    phone=ud["phone"],
                    password=hash_password(ud["password"])
                )
                db.add(u)
                db.commit()
                db.refresh(u)
            user_map[ud["email"]] = u

            # Map user roles
            for rname in ud["roles"]:
                role = role_map[rname]
                ur = db.query(models.UserRole).filter_by(user_id=u.id, role_id=role.id).first()
                if not ur:
                    ur = models.UserRole(user_id=u.id, role_id=role.id)
                    db.add(ur)
                    db.commit()

        print("Users created")

        # 3. Seed Society
        soc = db.query(models.Society).filter_by(society_name="Demo Society").first()
        if not soc:
            soc = models.Society(
                society_name="Demo Society",
                address="123 Main St",
                city="Metropolis",
                state="NY",
                pincode="10001",
                status="Active"
            )
            db.add(soc)
            db.commit()
            db.refresh(soc)
        print("Society created")

        # 4. Seed Blocks
        block_names = ["Block A", "Block B"]
        block_map = {}
        for name in block_names:
            b = db.query(models.Block).filter_by(society_id=soc.id, block_name=name).first()
            if not b:
                b = models.Block(
                    society_id=soc.id,
                    block_name=name,
                    description=f"{name} description"
                )
                db.add(b)
                db.commit()
                db.refresh(b)
            block_map[name] = b
        print("Blocks created")

        # 5. Seed Flats
        flats_to_seed = [
            {"block_name": "Block A", "flat_number": "A-101"},
            {"block_name": "Block A", "flat_number": "A-102"},
            {"block_name": "Block B", "flat_number": "B-101"},
            {"block_name": "Block B", "flat_number": "B-102"},
        ]
        flat_map = {}
        for fd in flats_to_seed:
            block = block_map[fd["block_name"]]
            f = db.query(models.Flat).filter_by(block_id=block.id, flat_number=fd["flat_number"]).first()
            if not f:
                f = models.Flat(
                    block_id=block.id,
                    flat_number=fd["flat_number"],
                    floor_number=1
                )
                db.add(f)
                db.commit()
                db.refresh(f)
            flat_map[fd["flat_number"]] = f
        print("Flats created")

        # 6. Seed Profiles (Resident Profile and Security Profile)
        resident_user = user_map["resident@test.com"]
        flat_a101 = flat_map["A-101"]

        # Resident Profile
        rp = db.query(models.ResidentProfile).filter_by(user_id=resident_user.id).first()
        if not rp:
            rp = models.ResidentProfile(
                user_id=resident_user.id,
                flat_id=flat_a101.id,
                society_id=soc.id,
                resident_type="Owner"
            )
            db.add(rp)
            db.commit()

        # Security Profile
        sec_profile = db.query(models.SecurityProfile).filter_by(society_id=soc.id, employee_id="EMP-SEC-001").first()
        if not sec_profile:
            sec_profile = models.SecurityProfile(
                society_id=soc.id,
                employee_id="EMP-SEC-001",
                shift_details="Night Shift"
            )
            db.add(sec_profile)
            db.commit()
        print("Profiles created")

        # 7. Seed Emergency Contact
        guardian_user = user_map["guardian@test.com"]
        ec = db.query(models.EmergencyContact).filter_by(resident_id=resident_user.id, email=guardian_user.email).first()
        if not ec:
            ec = models.EmergencyContact(
                resident_id=resident_user.id,
                name=f"{guardian_user.first_name} {guardian_user.last_name}",
                phone=guardian_user.phone,
                email=guardian_user.email,
                relationship="Brother",
                priority=1,
                is_verified=True
            )
            db.add(ec)
            db.commit()
        print("Emergency contacts created")

        print("Database seeding completed successfully")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
