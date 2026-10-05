from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone = Column(String(15), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(50), unique=True, nullable=False)


class UserRole(Base):
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)


class Society(Base):
    __tablename__ = "societies"

    id = Column(Integer, primary_key=True, index=True)
    society_name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    status = Column(String(20), default="Active")


class Block(Base):
    __tablename__ = "blocks"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    block_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)

    society = relationship("Society", backref="blocks")


class Flat(Base):
    __tablename__ = "flats"

    id = Column(Integer, primary_key=True, index=True)
    block_id = Column(Integer, ForeignKey("blocks.id"), nullable=False)
    flat_number = Column(String(20), nullable=False)
    floor_number = Column(Integer, nullable=False)

    block = relationship("Block", backref="flats")



class SecurityProfile(Base):
    __tablename__ = "security_profiles"

    id = Column(Integer, primary_key=True, index=True)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False)
    shift_details = Column(String(100), nullable=False)


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False)
    email = Column(String(150), nullable=True)
    relationship = Column(String(50), nullable=False)
    priority = Column(Integer, nullable=False)
    is_verified = Column(Boolean, default=False)


class ContactVerification(Base):
    __tablename__ = "contact_verifications"

    id = Column(Integer, primary_key=True, index=True)
    emergency_contact_id = Column(
        Integer,
        ForeignKey("emergency_contacts.id"),
        nullable=False
    )
    otp = Column(String(6), nullable=False)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)


class SocietyMember(Base):
    __tablename__ = "society_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    status = Column(String(20), default="Active")


class ResidentProfile(Base):
    __tablename__ = "resident_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=False)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    resident_type = Column(String(50), nullable=False)  # Owner, Tenant, Family Member, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Proper SQLAlchemy relationships using backref
    user = relationship("User", backref="resident_profiles")
    flat = relationship("Flat", backref="resident_profiles")
    society = relationship("Society", backref="resident_profiles")


class SOSAlert(Base):
    __tablename__ = "sos_alerts"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=False)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    status = Column(String(50), default="Active")  # Active, Open, Response Assigned, In Progress, Resolved
    emergency_type = Column(String(100), default="Medical Emergency")
    notes = Column(String(255), nullable=True)
    
    # Responder Assignment Fields
    assigned_responder_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_responder_role = Column(String(50), nullable=True)  # Volunteer, Security, Guardian, Admin
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Escalation Tracker
    current_escalation_level = Column(Integer, default=1)
    escalation_stopped = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Proper SQLAlchemy relationships using backref
    resident = relationship("User", foreign_keys=[resident_id], backref="sos_alerts")
    assigned_responder = relationship("User", foreign_keys=[assigned_responder_id], backref="assigned_incidents")
    flat = relationship("Flat", backref="sos_alerts")
    society = relationship("Society", backref="sos_alerts")


class EscalationLog(Base):
    __tablename__ = "escalation_logs"

    id = Column(Integer, primary_key=True, index=True)
    sos_alert_id = Column(Integer, ForeignKey("sos_alerts.id"), nullable=False)
    escalated_to = Column(String(255), nullable=False)  # Target audience description
    escalation_level = Column(Integer, nullable=False)   # Level 1, 2, or 3
    escalated_at = Column(DateTime(timezone=True), server_default=func.now())

    sos_alert = relationship("SOSAlert", backref="escalation_logs")


class VolunteerAvailability(Base):
    __tablename__ = "volunteer_availabilities"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    is_available = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    volunteer = relationship("User", backref="availability_status")