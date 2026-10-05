# Backend API — Community Emergency Coordination Network

> **High-Performance FastAPI REST API Engine powering emergency dispatch, role governance, SMS OTP verification, and automated alert escalation.**

---

## 🛠️ Tech Stack & Libraries Used

| Technology / Package | Purpose |
| :--- | :--- |
| **Python 3.10+** | Core programming runtime |
| **FastAPI** | High-speed async ASGI web framework for REST API endpoints |
| **SQLAlchemy** | ORM for database modeling and query execution |
| **PostgreSQL / SQLite** | Relational database storage |
| **PyJWT (`python-jose`)** | JSON Web Token (JWT) creation, signing, and verification |
| **Passlib (`bcrypt`)** | Secure password hashing and verification |
| **Pydantic v2** | Data validation schemas and serialization (`from_attributes`) |
| **Firebase Admin SDK** | Firebase Phone Auth and ID token verification |
| **Twilio / Fast2SMS SDK** | SMS text message OTP dispatch service |

---

## ⚙️ How the Backend Works

### 1. Database Architecture & Models ([models.py](file:///d:/Community-Emergency-Coordination-and-Citizen-Assistance-Network-with-Mobile-Application-Jun-2026/backend/app/models.py))
- `User`: Stores account info (`id`, `email`, `phone`, `password`, `is_active`).
- `Role` & `UserRole`: Many-to-many role mapping (`ADMIN`, `RESIDENT`, `SECURITY`, `VOLUNTEER`).
- `ResidentProfile`: Links a resident user to housing `Society`, `Block`, and `Flat`.
- `SOSAlert`: Stores emergency incident alerts (`emergency_type`, `status`, `assigned_responder_id`, `escalation_level`).
- `EmergencyContact`: Stores priority contact numbers for automated SMS text notification.

---

### 2. Authentication & Plain Account Governance
- **Registration (`POST /users/`)**: Registers user accounts without pre-assigned default roles (`roles: ["Unassigned"]`).
- **Role Assignment (`PUT /users/{id}`)**: Uses `assign_user_role_by_name(db, user_id, role_name)` to assign roles (`Resident`, `Security`, `Volunteer`, `Admin`) and generate resident profiles.
- **Profile Fetch (`GET /users/me`)**: Resolves role mappings and returns `roles: [...]` for frontend/mobile role detection.

---

### 3. Emergency Alert Escalation Engine ([sos.py](file:///d:/Community-Emergency-Coordination-and-Citizen-Assistance-Network-with-Mobile-Application-Jun-2026/backend/app/routers/sos.py))
- When an SOS alert is raised (`POST /sos/alert`):
  1. Priority Level 1: Immediate broadcast to housing gate security guards on duty.
  2. Priority Level 2: Immediate notification to CPR-trained community volunteers within proximity.
  3. Priority Level 3: Dispatches SMS text messages to emergency contact guardians.

---

### 4. SMS Text OTP Service ([sms_service.py](file:///d:/Community-Emergency-Coordination-and-Citizen-Assistance-Network-with-Mobile-Application-Jun-2026/backend/app/services/sms_service.py))
- Formats phone numbers to standard E.164 (`+<country><digits>`).
- Dispatches 6-digit OTP text messages directly to mobile phones, logging dispatches cleanly without console encoding errors.

---

## 🚀 Running the Backend Server

```powershell
# 1. Activate virtual environment
.\venv\Scripts\activate

# 2. Seed database with initial users and roles
python seed.py

# 3. Reset passwords for demo accounts
python reset_passwords.py

# 4. Start Uvicorn ASGI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Running Automated Tests

```powershell
.\venv\Scripts\python -m unittest test_milestones.py test_emergency_contacts_full.py test_firebase_otp.py test_admin_user_reflection.py test_plain_account_creation.py test_admin_login.py test_admin_me_role.py test_role_assignment_persistence.py
```
