from app.database import SessionLocal
from app import models
from app.auth import hash_password

db = SessionLocal()
try:
    users = db.query(models.User).all()
    print("Found users in DB:")
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Name: {u.first_name} {u.last_name}")
        
    # Update passwords for all demo accounts
    pass_map = {
        "admin@test.com": "Admin@123",
        "admin@example.com": "password123",
        "resident@test.com": "Resident@123",
        "alice.smith@example.com": "password123",
        "security@test.com": "Security@123",
        "guard.marcus@example.com": "password123",
        "guardian@test.com": "Guardian@123",
        "volunteer@test.com": "Volunteer@123",
        "clara.o@example.com": "password123",
    }
    
    for email, passw in pass_map.items():
        u = db.query(models.User).filter_by(email=email).first()
        if u:
            u.password = hash_password(passw)
            print(f"Updated password for {email} -> {passw}")
        else:
            print(f"User {email} not found to update!")
            
    db.commit()
    print("Database passwords successfully reset.")
finally:
    db.close()
