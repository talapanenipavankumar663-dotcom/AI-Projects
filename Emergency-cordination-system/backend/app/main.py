from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models

# Import Routers
from app.routers import users
from app.routers import auth
from app.routers import society
from app.routers import block
from app.routers import flat
from app.routers import emergency
from app.routers import roles
from app.routers import security
from app.routers import contact_verification
from app.routers import society_member
from app.routers import user_role
from app.routers import resident_profiles
from app.routers import contacts
from app.routers import sos
from app.routers import incidents
from app.routers import notifications
from app.routers import volunteers

from sqlalchemy import text

# Create all database tables
Base.metadata.create_all(bind=engine)

# Ensure new columns exist on PostgreSQL sos_alerts table
try:
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS assigned_responder_role VARCHAR(50);
            ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
            ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS current_escalation_level INTEGER DEFAULT 1;
            ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS escalation_stopped BOOLEAN DEFAULT FALSE;
            ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS notes VARCHAR(255);
            ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS resolution_summary VARCHAR(500);
            ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS remarks VARCHAR(500);
            ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS closed_by_id INTEGER;
            ALTER TABLE sos_alerts ADD COLUMN IF NOT EXISTS closed_by_name VARCHAR(150);
        """))
        conn.commit()
except Exception as e:
    print(f"Migration notice: {e}")

# Initialize FastAPI application
app = FastAPI(
    title="EmergX API",
    description="Backend API for EmergX — Rapid Emergency Coordination and Citizen Assistance Network",
    version="1.0.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(society.router)
app.include_router(block.router)
app.include_router(flat.router)
app.include_router(emergency.router)
app.include_router(roles.router)
app.include_router(security.router)
app.include_router(contact_verification.router)
app.include_router(society_member.router)
app.include_router(user_role.router)
app.include_router(resident_profiles.router)
app.include_router(contacts.router)
app.include_router(sos.router)
app.include_router(sos.api_sos_router)
app.include_router(incidents.router)
app.include_router(notifications.router)
app.include_router(volunteers.router)


from fastapi.responses import Response

@app.get("/")
def home():
    return {
        "message": "Welcome to EmergX API — Rapid Emergency Coordination Network"
    }


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)



@app.get("/health")
def health():
    # Trigger uvicorn reload
    return {
        "status": "Server is running"
    }