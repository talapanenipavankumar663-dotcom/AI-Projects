import datetime
from sqlalchemy.orm import Session
from app import models


def log_escalation_event(
    db: Session,
    sos_alert_id: int,
    escalation_level: int,
    target_description: str
) -> models.EscalationLog:
    """Logs an escalation step into the database."""
    log_entry = models.EscalationLog(
        sos_alert_id=sos_alert_id,
        escalated_to=target_description,
        escalation_level=escalation_level,
        escalated_at=datetime.datetime.utcnow()
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry


def trigger_escalation_level_1(db: Session, sos_alert: models.SOSAlert) -> models.EscalationLog:
    """Level 1 Escalation: Notify Primary Contact and Security Personnel."""
    sos_alert.current_escalation_level = 1
    db.commit()

    print(f"\n[ESCALATION LEVEL 1] Alert #{sos_alert.id}: Primary Contact & Security Guard Notified.")
    return log_escalation_event(
        db,
        sos_alert_id=sos_alert.id,
        escalation_level=1,
        target_description="Primary Contact & Security Guards"
    )


def escalate_to_level_2(db: Session, sos_alert: models.SOSAlert) -> models.EscalationLog | None:
    """Level 2 Escalation: Notify Secondary Contact and Available Volunteers (No response within X mins)."""
    if sos_alert.escalation_stopped or sos_alert.assigned_responder_id is not None:
        print(f"[ESCALATION SKIPPED] Alert #{sos_alert.id} already assigned to responder #{sos_alert.assigned_responder_id}.")
        return None

    sos_alert.current_escalation_level = 2
    db.commit()

    # Query available volunteers
    available_volunteers = db.query(models.VolunteerAvailability).filter(
        models.VolunteerAvailability.is_available == True
    ).all()
    count_volunteers = len(available_volunteers)

    print(f"\n[ESCALATION LEVEL 2] Alert #{sos_alert.id}: Secondary Contact & {count_volunteers} Available Volunteers Notified.")
    return log_escalation_event(
        db,
        sos_alert_id=sos_alert.id,
        escalation_level=2,
        target_description=f"Secondary Contact & {count_volunteers} Available Volunteers"
    )


def escalate_to_level_3(db: Session, sos_alert: models.SOSAlert) -> models.EscalationLog | None:
    """Level 3 Escalation: Notify All Remaining Contacts (No response at Level 2)."""
    if sos_alert.escalation_stopped or sos_alert.assigned_responder_id is not None:
        print(f"[ESCALATION SKIPPED] Alert #{sos_alert.id} already assigned to responder #{sos_alert.assigned_responder_id}.")
        return None

    sos_alert.current_escalation_level = 3
    db.commit()

    print(f"\n[ESCALATION LEVEL 3] Alert #{sos_alert.id}: All Remaining Contacts Broadcast Notified.")
    return log_escalation_event(
        db,
        sos_alert_id=sos_alert.id,
        escalation_level=3,
        target_description="All Resident Remaining Contacts"
    )


def stop_escalation(
    db: Session,
    sos_alert: models.SOSAlert,
    responder_id: int,
    responder_role: str
) -> models.SOSAlert:
    """Assigns responder and stops further escalation for an SOS Alert."""
    from app import crud
    now = datetime.datetime.utcnow()
    sos_alert.assigned_responder_id = responder_id
    sos_alert.assigned_responder_role = responder_role
    sos_alert.assigned_at = now
    sos_alert.escalation_stopped = True
    sos_alert.status = "Assigned"

    responder_user = crud.get_user_by_id(db, responder_id)
    responder_name = f"{responder_user.first_name} {responder_user.last_name}" if responder_user else f"{responder_role} #{responder_id}"

    db.commit()
    db.refresh(sos_alert)

    # Log timeline event
    crud.log_timeline_event(
        db,
        incident_id=sos_alert.id,
        action=f"{responder_role} Accepted Incident",
        performed_by=responder_name
    )

    print(f"\n[ESCALATION STOPPED] Alert #{sos_alert.id} assigned to {responder_role} {responder_name}.")
    return sos_alert
