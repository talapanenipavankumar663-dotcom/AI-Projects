from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str


class UserUpdate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    is_active: bool

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# ---------- ROLE ----------

class RoleCreate(BaseModel):
    role_name: str


class RoleUpdate(BaseModel):
    role_name: str


class RoleResponse(BaseModel):
    id: int
    role_name: str

    class Config:
        from_attributes = True

# ---------- SOCIETY ----------

class SocietyCreate(BaseModel):
    society_name: str
    address: str
    city: str
    state: str
    pincode: str


class SocietyUpdate(BaseModel):
    society_name: str
    address: str
    city: str
    state: str
    pincode: str


class SocietyResponse(BaseModel):
    id: int
    society_name: str
    address: str
    city: str
    state: str
    pincode: str
    status: str

    class Config:
        from_attributes = True

# ---------- BLOCK ----------

class BlockCreate(BaseModel):
    society_id: int
    block_name: str
    description: str


class BlockUpdate(BaseModel):
    society_id: int
    block_name: str
    description: str


class BlockResponse(BaseModel):
    id: int
    society_id: int
    block_name: str
    description: str

    class Config:
        from_attributes = True

# ---------- FLAT ----------

class FlatCreate(BaseModel):
    block_id: int
    flat_number: str
    floor_number: int


class FlatUpdate(BaseModel):
    block_id: int
    flat_number: str
    floor_number: int


class FlatResponse(BaseModel):
    id: int
    block_id: int
    flat_number: str
    floor_number: int

    class Config:
        from_attributes = True


# ---------- EMERGENCY CONTACT ----------

class EmergencyContactCreate(BaseModel):
    resident_id: int
    name: str
    phone: str
    email: EmailStr | None = None
    relationship: str
    priority: int


class EmergencyContactUpdate(BaseModel):
    resident_id: int
    name: str
    phone: str
    email: EmailStr | None = None
    relationship: str
    priority: int
    is_verified: bool


class EmergencyContactResponse(BaseModel):
    id: int
    resident_id: int
    name: str
    phone: str
    email: str | None = None
    relationship: str
    priority: int
    is_verified: bool

    class Config:
        from_attributes = True

# ---------- USER ROLE ----------

class UserRoleCreate(BaseModel):
    user_id: int
    role_id: int


class UserRoleUpdate(BaseModel):
    user_id: int
    role_id: int


class UserRoleResponse(BaseModel):
    id: int
    user_id: int
    role_id: int

    class Config:
        from_attributes = True

# ---------------- SECURITY PROFILE ---------------- #

class SecurityProfileCreate(BaseModel):
    society_id: int
    employee_id: str
    shift_details: str

class SecurityProfileUpdate(BaseModel):
    society_id: int
    employee_id: str
    shift_details: str


class SecurityProfileResponse(SecurityProfileCreate):
    id: int

    class Config:
        from_attributes = True


# ---------- CONTACT VERIFICATION ----------

class ContactVerificationCreate(BaseModel):
    emergency_contact_id: int
    otp: str
    verified: bool = False


class ContactVerificationUpdate(BaseModel):
    emergency_contact_id: int
    otp: str
    verified: bool


class ContactVerificationResponse(BaseModel):
    id: int
    emergency_contact_id: int
    otp: str
    verified: bool
    created_at: datetime
    verified_at: datetime | None = None

    class Config:
        from_attributes = True  


# ---------- SOCIETY MEMBER ----------

class SocietyMemberCreate(BaseModel):
    user_id: int
    society_id: int
    status: str


class SocietyMemberUpdate(BaseModel):
    user_id: int
    society_id: int
    status: str


class SocietyMemberResponse(BaseModel):
    id: int
    user_id: int
    society_id: int
    status: str

    class Config:
        from_attributes = True  


# ---------- VERIFY OTP ----------
class VerifyOTPRequest(BaseModel):
    otp: str


# ---------- RESIDENT PROFILE ----------
class ResidentProfileCreate(BaseModel):
    user_id: int
    flat_id: int
    society_id: int
    resident_type: str  # Owner, Tenant, Family Member, etc.


class ResidentProfileUpdate(BaseModel):
    flat_id: int
    society_id: int
    resident_type: str


class ResidentProfileResponse(BaseModel):
    id: int
    user_id: int
    flat_id: int
    society_id: int
    resident_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class ResidentFlatResponse(BaseModel):
    profile: ResidentProfileResponse
    flat_number: str
    floor_number: int
    block_name: str
    society_name: str
    resident_name: str

    class Config:
        from_attributes = True


# ---------- SOS ALERT ----------
class SOSAlertResponse(BaseModel):
    id: int
    resident_id: int
    flat_id: int
    society_id: int
    flat_no: str | None = None
    block: str | None = None
    society: str | None = None
    status: str
    emergency_type: str | None = "Medical Emergency"
    notes: str | None = None
    assigned_responder_id: int | None = None
    assigned_responder_role: str | None = None
    assigned_at: datetime | None = None
    current_escalation_level: int | None = 1
    current_escalation_step: int | None = 1
    escalation_stopped: bool | None = False
    created_at: datetime
    resolved_at: datetime | None = None

    class Config:
        from_attributes = True


class NotifiedContact(BaseModel):
    name: str
    phone: str
    priority: int


class SOSAlertRaiseResponse(BaseModel):
    alert: SOSAlertResponse
    notified_contacts: list[NotifiedContact]


# ---------- ESCALATION LOG ----------
class EscalationLogResponse(BaseModel):
    id: int
    sos_alert_id: int
    escalated_to: str
    escalation_level: int
    escalated_at: datetime

    class Config:
        from_attributes = True


# ---------- VOLUNTEER AVAILABILITY ----------
class VolunteerAvailabilityUpdate(BaseModel):
    is_available: bool


class VolunteerAvailabilityResponse(BaseModel):
    id: int
    volunteer_id: int
    is_available: bool
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- INCIDENT ACCEPTANCE / REJECTION ----------
class IncidentAcceptResponse(BaseModel):
    success: bool
    message: str
    incident_id: int
    assigned_to: str
    assigned_role: str
    status: str


class IncidentRejectResponse(BaseModel):
    success: bool
    message: str
    incident_id: int

