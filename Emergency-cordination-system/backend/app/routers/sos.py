from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import datetime

from app.database import get_db
from app import crud, models, schemas
from app.dependencies import get_current_user_obj, check_role
from app.services.alert_routing import AlertRoutingService

router = APIRouter(
    prefix="/sos",
    tags=["SOS Alerts"]
)


# RAISE SOS ALERT (Resident only)
@router.post("/raise", response_model=schemas.SOSAlertRaiseResponse, status_code=status.HTTP_201_CREATED)
def raise_sos_alert(
    background_tasks: BackgroundTasks,
    payload: dict | None = None,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(check_role(["Resident"]))
):
    # Retrieve resident flat mapping details
    profile = crud.get_resident_profile_by_user_id(db, current_user_obj.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resident must be mapped to a flat and society before raising an SOS alert. Ask an Admin to assign your society and flat."
        )

    payload = payload or {}
    emergency_type = payload.get("emergency_type") or payload.get("category") or "Medical Emergency"
    location_details = payload.get("location_details") or payload.get("location")
    notes = payload.get("notes") or payload.get("remarks")
    emergency_message = notes
    if location_details:
        emergency_message = f"Location: {location_details}"
        if notes:
            emergency_message += f". Message: {notes}"

    # Create active SOS alert
    alert = crud.create_sos_alert(
        db,
        resident_id=current_user_obj.id,
        flat_id=profile.flat_id,
        society_id=profile.society_id,
        emergency_type=emergency_type,
        emergency_message=emergency_message,
        latitude=payload.get("latitude"),
        longitude=payload.get("longitude"),
    )

    # Fetch emergency contacts sorted by priority order
    contacts = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.resident_id == current_user_obj.id
    ).order_by(models.EmergencyContact.priority.asc()).all()

    # Mock broadcast notification to contacts in priority order
    notified_list = []
    print(f"\n======== [SOS TRIGGERED] ========")
    print(f"Resident: {current_user_obj.first_name} {current_user_obj.last_name}")
    print(f"Location: Society ID {profile.society_id}, Flat ID {profile.flat_id}")
    print(f"Notifying Emergency Contacts in Priority Order:")
    for c in contacts:
        status_text = "VERIFIED" if c.is_verified else "UNVERIFIED"
        print(f"  [Priority {c.priority}] Notified {c.name} ({c.phone}) - Status: {status_text}")
        notified_list.append(schemas.NotifiedContact(
            name=c.name,
            phone=c.phone,
            priority=c.priority
        ))
    print(f"==================================\n")

    # Start the actual background escalation routing
    background_tasks.add_task(AlertRoutingService.start_routing, alert.id)

    return schemas.SOSAlertRaiseResponse(
        alert=schemas.SOSAlertResponse.from_orm(alert),
        notified_contacts=notified_list
    )


# GET ALL SOS ALERTS
@router.get("/", response_model=list[schemas.SOSAlertResponse])
@router.get("", response_model=list[schemas.SOSAlertResponse], include_in_schema=False)
def get_all_sos_alerts(
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    return db.query(models.SOSAlert).order_by(models.SOSAlert.created_at.desc()).all()


# GET ALL ACTIVE SOS ALERTS (Admin, Security, Volunteer)
@router.get("/active", response_model=list[schemas.SOSAlertResponse])
def get_active_alerts(
    db: Session = Depends(get_db),
    privileged_user: models.User = Depends(check_role(["Admin", "Security", "Volunteer"]))
):
    return crud.get_active_sos_alerts(db)


# RESOLVE SOS ALERT (Resident owner, Admin, Security)
@router.post("/{alert_id}/resolve", response_model=schemas.SOSAlertResponse)
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    # Verify alert exists
    alert = crud.get_sos_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SOS alert not found"
        )

    # Check authorization (only Resident owner, Admin, or Security can resolve)
    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user_obj.id
    ).all()
    user_roles = [r[0] for r in roles]

    is_privileged = any(r in ["Admin", "Security"] for r in user_roles)
    if not is_privileged:
        # Resident must be the owner of the alert
        if alert.resident_id != current_user_obj.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you do not own this SOS alert"
            )

    return crud.resolve_sos_alert(db, alert_id)


# Separate API Router for /api/sos endpoint aliases
api_sos_router = APIRouter(
    prefix="/api/sos",
    tags=["API SOS Alerts"]
)


@api_sos_router.post("/", status_code=status.HTTP_201_CREATED)
@api_sos_router.post("", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def api_raise_sos(
    background_tasks: BackgroundTasks,
    payload: dict = None,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    profile = crud.get_resident_profile_by_user_id(db, current_user_obj.id)
    flat_id = profile.flat_id if profile else 1
    society_id = profile.society_id if profile else 1

    emergency_type = (payload or {}).get("emergency_type", "Medical Emergency")
    location_details = (payload or {}).get("location_details") or (payload or {}).get("location")
    remarks = (payload or {}).get("remarks") or (payload or {}).get("notes")
    emergency_message = remarks
    if location_details:
        emergency_message = f"Location: {location_details}"
        if remarks:
            emergency_message += f". Message: {remarks}"
    lat = (payload or {}).get("latitude", 0.0)
    lng = (payload or {}).get("longitude", 0.0)

    alert = crud.create_sos_alert(
        db,
        resident_id=current_user_obj.id,
        flat_id=flat_id,
        society_id=society_id,
        emergency_type=emergency_type,
        emergency_message=emergency_message,
        latitude=lat,
        longitude=lng
    )

    # Start the actual background escalation routing
    background_tasks.add_task(AlertRoutingService.start_routing, alert.id)

    return {
        "id": alert.id,
        "resident_id": alert.resident_id,
        "flat_id": alert.flat_id,
        "society_id": alert.society_id,
        "status": alert.status,
        "emergency_type": emergency_type,
        "latitude": lat,
        "longitude": lng,
        "created_at": alert.created_at
    }


@api_sos_router.post("/{sos_id}/accept")
def api_accept_sos(
    sos_id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    alert = crud.get_sos_alert_by_id(db, sos_id)
    if not alert:
        raise HTTPException(status_code=404, detail="SOS alert not found")

    updated_alert = crud.update_sos_alert_status(db, sos_id, "In Progress")
    return updated_alert


@api_sos_router.patch("/{sos_id}/status/", response_model=schemas.SOSAlertResponse)
@api_sos_router.patch("/{sos_id}/status", response_model=schemas.SOSAlertResponse, include_in_schema=False)
def api_patch_sos_status(
    sos_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    alert = crud.get_sos_alert_by_id(db, sos_id)
    if not alert:
        raise HTTPException(status_code=404, detail="SOS alert not found")

    status_val = payload.get("status", "Resolved")
    updated_alert = crud.update_sos_alert_status(db, sos_id, status_val)
    return updated_alert



