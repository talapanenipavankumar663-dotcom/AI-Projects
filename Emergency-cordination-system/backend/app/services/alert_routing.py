import datetime
from sqlalchemy.orm import Session
from app import models, crud
from app.services.email_service import send_email_background
from app.services.sms_service import send_sms_alert_background
from app.services.voice_service import send_voice_alert_background

class AlertRoutingService:
    @classmethod
    async def start_routing(cls, alert_id: int):
        from app.database import SessionLocal
        with SessionLocal() as db:
            # Start at step 1 immediately
            await cls.escalate(db, alert_id, 1)

    @classmethod
    async def escalate(cls, db: Session, alert_id: int, step: int):
        # Retrieve the alert
        alert = db.query(models.SOSAlert).filter(models.SOSAlert.id == alert_id).first()
        if not alert or alert.status != "Open":
            print(f"[AlertRoutingService] Alert {alert_id} not open or not found. Stopping escalation.")
            return

        # Update step
        alert.current_escalation_step = step
        db.commit()
        db.refresh(alert)
        print(f"[AlertRoutingService] Escalating alert {alert_id} to step {step}.")

        notified_any = False
        resident = db.query(models.User).filter(models.User.id == alert.resident_id).first()
        resident_name = f"{resident.first_name} {resident.last_name}" if resident else "A resident"

        if step == 1:
            # Step 1: Notify Security Personnel
            sec_notified = await cls._notify_security_personnel(db, alert, resident_name)
            notified_any = sec_notified
            next_step = 2
        elif step == 2:
            # Step 2: Notify Available Volunteers
            notified_any = await cls._notify_available_volunteers(db, alert, resident_name)
            next_step = 3
        elif step == 3:
            # Step 3: Notify Primary Contact (Priority 1)
            notified_any = await cls._notify_guardian_by_priority(db, alert, resident_name, priority=1, type_label="Primary Contact")
            next_step = 4
        elif step == 4:
            # Step 4: Notify Secondary Contact (Priority 2)
            notified_any = await cls._notify_guardian_by_priority(db, alert, resident_name, priority=2, type_label="Secondary Contact")
            next_step = 5
        elif step == 5:
            # Step 5: Notify Remaining Contacts (Priority 3+)
            notified_any = await cls._notify_other_emergency_contacts(db, alert, resident_name)
            next_step = None
        else:
            return

        if next_step is not None:
            if not notified_any:
                # If no recipients were notified at this tier, cascade immediately to the next step
                print(f"[AlertRoutingService] No recipients found for step {step} on alert {alert_id}. Cascading immediately.")
                await cls.escalate(db, alert_id, next_step)
            else:
                # Schedule the next step
                from app.services.escalation import EscalationService
                EscalationService.schedule_escalation(alert_id, next_step)

    @classmethod
    async def accept_alert(cls, db: Session, alert_id: int, user_id: int) -> models.SOSAlert | None:
        alert = db.query(models.SOSAlert).filter(models.SOSAlert.id == alert_id).first()
        if not alert:
            return None

        # Stop escalation timer
        from app.services.escalation import EscalationService
        EscalationService.cancel_escalation(alert_id)

        # Update SOS Alert
        alert.status = "Assigned"
        alert.assigned_responder_id = user_id
        alert.accepted_at = datetime.datetime.now(datetime.timezone.utc)
        db.commit()
        db.refresh(alert)
        print(f"[AlertRoutingService] Alert {alert_id} accepted by user {user_id}.")
        return alert

    @classmethod
    async def reject_alert(cls, db: Session, alert_id: int, user_id: int) -> models.SOSAlert | None:
        alert = db.query(models.SOSAlert).filter(models.SOSAlert.id == alert_id).first()
        if not alert:
            return None

        if alert.status != "Open":
            # Can only reject open alerts that are undergoing escalation
            return alert

        # Cancel current scheduled timer
        from app.services.escalation import EscalationService
        EscalationService.cancel_escalation(alert_id)

        # Escalate to next step immediately
        next_step = alert.current_escalation_step + 1
        if next_step <= 5:
            print(f"[AlertRoutingService] Alert {alert_id} rejected by user {user_id}. Escalating immediately to step {next_step}.")
            await cls.escalate(db, alert_id, next_step)
        else:
            print(f"[AlertRoutingService] Alert {alert_id} rejected by user {user_id}, but no more steps remain.")

        return alert

    # --- Internal Helper Methods ---

    @classmethod
    def _get_location_strings(cls, alert: models.SOSAlert):
        flat_no = alert.flat.flat_number if (alert.flat and hasattr(alert.flat, 'flat_number')) else getattr(alert, 'flat_no', '302')
        block_name = getattr(alert, 'block', 'Block A')
        society_name = alert.society.society_name if (alert.society and hasattr(alert.society, 'society_name')) else getattr(alert, 'society', 'Green Valley')
        return flat_no, block_name, society_name

    @classmethod
    def _notify_contact_channels(
        cls,
        contact,
        alert: models.SOSAlert,
        resident_name: str,
        flat_no: str,
        block_name: str,
        society_name: str,
    ) -> None:
        """Send the complete emergency details to a saved contact number."""
        phone = getattr(contact, "phone", None)
        if not phone:
            return

        print(f"[AlertRoutingService] Dispatching SMS and voice alert to emergency contact {phone}.")
        location = f"Flat {flat_no}, {block_name}, {society_name}"
        maps_url = None
        if alert.latitude is not None and alert.longitude is not None:
            maps_url = f"https://maps.google.com/?q={alert.latitude},{alert.longitude}"

        emergency_message = getattr(alert, "emergency_message", None)
        send_sms_alert_background(
            phone_number=phone,
            resident_name=resident_name,
            alert_type=alert.emergency_type or "Emergency",
            emergency_message=emergency_message,
            location=location,
            maps_url=maps_url,
        )
        send_voice_alert_background(
            phone_number=phone,
            resident_name=resident_name,
            alert_type=alert.emergency_type or "Emergency",
            emergency_message=emergency_message,
            location=location,
            maps_url=maps_url,
        )

    @classmethod
    def _notify_user_channels(
        cls,
        user,
        alert: models.SOSAlert,
        resident_name: str,
        flat_no: str,
        block_name: str,
        society_name: str,
    ) -> None:
        """Send SMS and an automated call to a responder user."""
        if not user.phone:
            return

        location = f"Flat {flat_no}, {block_name}, {society_name}"
        maps_url = None
        if alert.latitude is not None and alert.longitude is not None:
            maps_url = f"https://maps.google.com/?q={alert.latitude},{alert.longitude}"

        send_sms_alert_background(
            phone_number=user.phone,
            resident_name=resident_name,
            alert_type=alert.emergency_type or "Emergency",
            emergency_message=getattr(alert, "emergency_message", None),
            location=location,
            maps_url=maps_url,
        )
        send_voice_alert_background(
            phone_number=user.phone,
            resident_name=resident_name,
            alert_type=alert.emergency_type or "Emergency",
            emergency_message=getattr(alert, "emergency_message", None),
            location=location,
            maps_url=maps_url,
        )

    @classmethod
    async def _notify_guardian_by_priority(cls, db: Session, alert: models.SOSAlert, resident_name: str, priority: int, type_label: str) -> bool:
        contacts = db.query(models.EmergencyContact).filter(
            models.EmergencyContact.resident_id == alert.resident_id,
            models.EmergencyContact.priority == priority
        ).all()

        if not contacts and priority != 1:
            print(f"[AlertRoutingService] No emergency contact found with priority {priority} for resident {alert.resident_id}.")
            return False

        flat_no, block_name, society_name = cls._get_location_strings(alert)
        notified_any = False

        for contact in contacts:
            user = db.query(models.User).filter(
                (models.User.email == contact.email) |
                (models.User.phone == contact.phone)
            ).first()

            if user:
                crud.create_notification(
                    db,
                    recipient_user_id=user.id,
                    sos_alert_id=alert.id,
                    notification_type=type_label,
                    title=f"SOS Alert: {resident_name}",
                    message=f"{resident_name} has raised an SOS alert ({alert.emergency_type}) from Flat {flat_no}, {block_name}, {society_name}."
                )

            recipient_email = contact.email or (user.email if user else None)
            recipient_name = contact.name or (f"{user.first_name} {user.last_name}" if user else type_label)
            cls._notify_contact_channels(
                contact, alert, resident_name, str(flat_no), str(block_name), str(society_name)
            )

            if recipient_email:
                send_email_background(
                    recipient_email=recipient_email,
                    recipient_name=recipient_name,
                    subject=f"🚨 URGENT: SOS Alert from {resident_name} ({type_label})",
                    alert_type=alert.emergency_type,
                    resident_name=resident_name,
                    flat_no=str(flat_no),
                    block=str(block_name),
                    society=str(society_name),
                    escalation_tier=type_label,
                )
            notified_any = True

        if notified_any:
            db.commit()
        return notified_any

    @classmethod
    async def _notify_other_emergency_contacts(cls, db: Session, alert: models.SOSAlert, resident_name: str) -> bool:
        contacts = db.query(models.EmergencyContact).filter(
            models.EmergencyContact.resident_id == alert.resident_id,
            models.EmergencyContact.priority > 2
        ).all()

        flat_no, block_name, society_name = cls._get_location_strings(alert)
        notified_any = False

        for contact in contacts:
            user = db.query(models.User).filter(
                (models.User.email == contact.email) |
                (models.User.phone == contact.phone)
            ).first()

            if user:
                crud.create_notification(
                    db,
                    recipient_user_id=user.id,
                    sos_alert_id=alert.id,
                    notification_type="Remaining Contact",
                    title=f"SOS Alert: {resident_name}",
                    message=f"{resident_name} has raised an SOS alert ({alert.emergency_type}) from Flat {flat_no}, {block_name}, {society_name}."
                )

            recipient_email = contact.email or (user.email if user else None)
            recipient_name = contact.name or (f"{user.first_name} {user.last_name}" if user else "Remaining Contact")

            cls._notify_contact_channels(
                contact,
                alert,
                resident_name,
                str(flat_no),
                str(block_name),
                str(society_name),
            )

            if recipient_email:
                send_email_background(
                    recipient_email=recipient_email,
                    recipient_name=recipient_name,
                    subject=f"🚨 URGENT: SOS Alert from {resident_name}",
                    alert_type=alert.emergency_type,
                    resident_name=resident_name,
                    flat_no=str(flat_no),
                    block=str(block_name),
                    society=str(society_name),
                    escalation_tier="Remaining Contact",
                )
                notified_any = True

        if notified_any:
            db.commit()
        return notified_any

    @classmethod
    async def _notify_security_personnel(cls, db: Session, alert: models.SOSAlert, resident_name: str) -> bool:
        security_role = db.query(models.Role).filter_by(role_name="Security").first()
        if not security_role:
            return False

        sm_users = db.query(models.User).join(
            models.SocietyMember, models.SocietyMember.user_id == models.User.id
        ).join(
            models.UserRole, models.UserRole.user_id == models.User.id
        ).filter(
            models.SocietyMember.society_id == alert.society_id,
            models.SocietyMember.status == "Active",
            models.UserRole.role_id == security_role.id,
            models.User.is_active == True
        ).all()

        rp_users = db.query(models.User).join(
            models.ResidentProfile, models.ResidentProfile.user_id == models.User.id
        ).join(
            models.UserRole, models.UserRole.user_id == models.User.id
        ).filter(
            models.ResidentProfile.society_id == alert.society_id,
            models.UserRole.role_id == security_role.id,
            models.User.is_active == True
        ).all()

        security_users = list({u.id: u for u in sm_users + rp_users}.values())
        flat_no, block_name, society_name = cls._get_location_strings(alert)
        notified_any = False

        for sec in security_users:
            crud.create_notification(
                db,
                recipient_user_id=sec.id,
                sos_alert_id=alert.id,
                notification_type="Security Personnel",
                title=f"SOS Alert in Society: Flat {flat_no}",
                message=f"{resident_name} has raised an SOS alert ({alert.emergency_type}) from Flat {flat_no}, {block_name}, {society_name}."
            )
            notified_any = True

            cls._notify_user_channels(sec, alert, resident_name, str(flat_no), str(block_name), str(society_name))

            if sec.email:
                send_email_background(
                    recipient_email=sec.email,
                    recipient_name=f"{sec.first_name} {sec.last_name}",
                    subject=f"🚨 SECURITY ALERT: SOS from Flat {flat_no}",
                    alert_type=alert.emergency_type,
                    resident_name=resident_name,
                    flat_no=str(flat_no),
                    block=str(block_name),
                    society=str(society_name),
                    escalation_tier="Security Personnel",
                )

        if notified_any:
            db.commit()
        return notified_any

    @classmethod
    async def _notify_available_volunteers(cls, db: Session, alert: models.SOSAlert, resident_name: str) -> bool:
        volunteer_role = db.query(models.Role).filter_by(role_name="Volunteer").first()
        if not volunteer_role:
            return False

        sm_volunteers = db.query(models.User).join(
            models.SocietyMember, models.SocietyMember.user_id == models.User.id
        ).join(
            models.UserRole, models.UserRole.user_id == models.User.id
        ).filter(
            models.SocietyMember.society_id == alert.society_id,
            models.SocietyMember.status == "Active",
            models.UserRole.role_id == volunteer_role.id,
            models.User.is_active == True
        ).all()

        rp_volunteers = db.query(models.User).join(
            models.ResidentProfile, models.ResidentProfile.user_id == models.User.id
        ).join(
            models.UserRole, models.UserRole.user_id == models.User.id
        ).filter(
            models.ResidentProfile.society_id == alert.society_id,
            models.UserRole.role_id == volunteer_role.id,
            models.User.is_active == True
        ).all()

        volunteer_users = list({u.id: u for u in sm_volunteers + rp_volunteers}.values())
        flat_no, block_name, society_name = cls._get_location_strings(alert)
        notified_any = False

        for vol in volunteer_users:
            crud.create_notification(
                db,
                recipient_user_id=vol.id,
                sos_alert_id=alert.id,
                notification_type="Volunteer",
                title=f"Assistance Needed: SOS Alert",
                message=f"{resident_name} has raised an SOS alert ({alert.emergency_type}) from Flat {flat_no}, {block_name}, {society_name}."
            )
            notified_any = True

            cls._notify_user_channels(vol, alert, resident_name, str(flat_no), str(block_name), str(society_name))

            if vol.email:
                send_email_background(
                    recipient_email=vol.email,
                    recipient_name=f"{vol.first_name} {vol.last_name}",
                    subject=f"🚨 VOLUNTEER REQUEST: Emergency Assistance Needed",
                    alert_type=alert.emergency_type,
                    resident_name=resident_name,
                    flat_no=str(flat_no),
                    block=str(block_name),
                    society=str(society_name),
                    escalation_tier="Volunteer Responder",
                )

        if notified_any:
            db.commit()
        return notified_any
