from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.emergency_contact import EmergencyContact


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
    resident_type = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="resident_profiles")
    flat = relationship("Flat", backref="resident_profiles")
    society = relationship("Society", backref="resident_profiles")


class SOSAlert(Base):
    __tablename__ = "sos_alerts"

    id = Column(Integer, primary_key=True, index=True)
    resident_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    flat_id = Column(Integer, ForeignKey("flats.id"), nullable=False)
    society_id = Column(Integer, ForeignKey("societies.id"), nullable=False)
    emergency_type = Column(String(50), nullable=False, default="Other")
    emergency_message = Column(String(255), nullable=True)
    flat_no = Column(String(50), nullable=False)
    block = Column(String(100), nullable=False)
    society = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(20), default="Open")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    assigned_responder_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_responder_role = Column(String(50), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    current_escalation_step = Column(Integer, default=1)
    current_escalation_level = Column(Integer, default=1)
    escalation_stopped = Column(Boolean, default=False)
    notes = Column(String(255), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    # Closure Documentation Fields
    resolution_summary = Column(String(500), nullable=True)
    remarks = Column(String(500), nullable=True)
    closed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    closed_by_name = Column(String(150), nullable=True)

    @property
    def response_time(self) -> float | None:
        if self.accepted_at and self.created_at:
            return (self.accepted_at - self.created_at).total_seconds()
        return None

    @property
    def resolution_time(self) -> float | None:
        if self.resolved_at and self.created_at:
            return (self.resolved_at - self.created_at).total_seconds()
        return None

    resident = relationship("User", foreign_keys=[resident_id], backref="sos_alerts")
    flat = relationship("Flat", backref="sos_alerts")
    society_relation = relationship("Society", backref="sos_alerts")
    assigned_responder = relationship("User", foreign_keys=[assigned_responder_id], backref="assigned_alerts")
    closed_by_user = relationship("User", foreign_keys=[closed_by_id], backref="closed_alerts")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sos_alert_id = Column(Integer, ForeignKey("sos_alerts.id"), nullable=False)
    notification_type = Column(String(50), nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(String(255), nullable=False)
    status = Column(String(20), default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    recipient = relationship("User", backref="notifications")
    sos_alert = relationship("SOSAlert", backref="notifications")


class EscalationLog(Base):
    __tablename__ = "escalation_logs"

    id = Column(Integer, primary_key=True, index=True)
    sos_alert_id = Column(Integer, ForeignKey("sos_alerts.id"), nullable=False)
    escalated_to = Column(String(255), nullable=False)
    escalation_level = Column(Integer, nullable=False)
    escalated_at = Column(DateTime(timezone=True), server_default=func.now())

    sos_alert = relationship("SOSAlert", backref="escalation_logs")


class VolunteerAvailability(Base):
    __tablename__ = "volunteer_availabilities"

    id = Column(Integer, primary_key=True, index=True)
    volunteer_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    is_available = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    volunteer = relationship("User", backref="availability_status")


class IncidentTimeline(Base):
    __tablename__ = "incident_timelines"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("sos_alerts.id"), nullable=False)
    action = Column(String(255), nullable=False)        # SOS Created, Guardian Notified, Volunteer Accepted, etc.
    performed_by = Column(String(150), nullable=False)  # Resident Mary, Security Marcus, System, etc.
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    sos_alert = relationship("SOSAlert", backref="timeline_events")


