from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import datetime

from app.database import get_db
from app import crud, models, schemas
from app.dependencies import get_current_user_obj, check_role

router = APIRouter(
    prefix="/api/incidents",
    tags=["Incident Tracking"]
)


# GET DASHBOARD SUMMARY (Admin & Security)
@router.get("/summary/", response_model=schemas.DashboardSummaryResponse)
@router.get("/summary", response_model=schemas.DashboardSummaryResponse, include_in_schema=False)
def get_incident_summary(
    db: Session = Depends(get_db),
    privileged_user: models.User = Depends(check_role(["Admin", "Security"]))
):
    return crud.get_dashboard_summary(db)


# GET ANALYTICS (Admin only)
@router.get("/analytics/")
@router.get("/analytics", include_in_schema=False)
def get_incident_analytics(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    return crud.get_incident_analytics(db)


# GET REPORTS (Admin only)
@router.get("/reports/")
@router.get("/reports", include_in_schema=False)
def get_incident_reports(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    return crud.get_incident_reports(db)


# GET ALL INCIDENTS (ordered by newest first - Admin & Security)
@router.get("/", response_model=list[schemas.IncidentResponse])
@router.get("", response_model=list[schemas.IncidentResponse], include_in_schema=False)
def get_all_incidents(
    db: Session = Depends(get_db),
    privileged_user: models.User = Depends(check_role(["Admin", "Security"]))
):
    return crud.get_all_incidents_ordered(db)


# GET ACTIVE INCIDENTS (ordered by newest first - Admin & Security)
@router.get("/active/", response_model=list[schemas.IncidentResponse])
@router.get("/active", response_model=list[schemas.IncidentResponse], include_in_schema=False)
def get_active_incidents(
    db: Session = Depends(get_db),
    privileged_user: models.User = Depends(check_role(["Admin", "Security"]))
):
    return crud.get_active_incidents(db)


# GET INCIDENT BY ID (returns complete details including resident - Admin & Security)
@router.get("/{id}/", response_model=schemas.IncidentDetailResponse)
@router.get("/{id}", response_model=schemas.IncidentDetailResponse, include_in_schema=False)
def get_incident_by_id(
    id: int,
    db: Session = Depends(get_db),
    privileged_user: models.User = Depends(check_role(["Admin", "Security"]))
):
    alert = crud.get_sos_alert_by_id(db, id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    return alert


# PATCH STATUS OF AN INCIDENT (Responder, Security, Admin)
@router.patch("/{id}/status/", response_model=schemas.IncidentResponse)
@router.patch("/{id}/status", response_model=schemas.IncidentResponse, include_in_schema=False)
def patch_incident_status(
    id: int,
    payload: schemas.IncidentStatusUpdate,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    alert = crud.get_sos_alert_by_id(db, id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )

    allowed_statuses = ["Open", "Assigned", "In Progress", "Reached Location", "Assistance Started", "Resolved", "Closed"]
    if payload.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(allowed_statuses)}"
        )

    updated_alert = crud.update_sos_alert_status(db, id, payload.status)

    # Log timeline event
    user_name = f"{current_user_obj.first_name} {current_user_obj.last_name}"
    crud.log_timeline_event(
        db,
        incident_id=id,
        action=f"Status Updated: {payload.status}",
        performed_by=user_name
    )

    return updated_alert


# ACCEPT INCIDENT REQUEST (Volunteer, Security, Guardian, Admin)
@router.post("/{id}/accept/", response_model=schemas.IncidentAcceptResponse)
@router.post("/{id}/accept", response_model=schemas.IncidentAcceptResponse, include_in_schema=False)
def accept_incident(
    id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    alert = crud.get_sos_alert_by_id(db, id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )

    # Check if already assigned
    if alert.assigned_responder_id is not None and alert.assigned_responder_id != current_user_obj.id:
        assigned_user = crud.get_user_by_id(db, alert.assigned_responder_id)
        assigned_name = f"{assigned_user.first_name} {assigned_user.last_name}" if assigned_user else f"User #{alert.assigned_responder_id}"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incident #{id} has already been accepted by responder {assigned_name} ({alert.assigned_responder_role})."
        )

    # Determine caller's role
    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user_obj.id
    ).all()
    user_roles = [r[0] for r in roles]
    role_name = user_roles[0] if user_roles else "Volunteer"

    from app.services import escalation_service
    updated_alert = escalation_service.stop_escalation(
        db,
        sos_alert=alert,
        responder_id=current_user_obj.id,
        responder_role=role_name
    )

    return schemas.IncidentAcceptResponse(
        success=True,
        message=f"Incident #{id} successfully accepted and assigned to {current_user_obj.first_name} {current_user_obj.last_name}.",
        incident_id=id,
        assigned_to=f"{current_user_obj.first_name} {current_user_obj.last_name}",
        assigned_role=role_name,
        status=updated_alert.status
    )


# REJECT / DECLINE INCIDENT REQUEST
@router.post("/{id}/reject/", response_model=schemas.IncidentRejectResponse)
@router.post("/{id}/reject", response_model=schemas.IncidentRejectResponse, include_in_schema=False)
@router.post("/{id}/decline/", response_model=schemas.IncidentRejectResponse, include_in_schema=False)
@router.post("/{id}/decline", response_model=schemas.IncidentRejectResponse, include_in_schema=False)
def reject_incident(
    id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    alert = crud.get_sos_alert_by_id(db, id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )

    print(f"\n[INCIDENT DECLINED] User #{current_user_obj.id} ({current_user_obj.first_name}) declined incident #{id}.\n")
    return schemas.IncidentRejectResponse(
        success=True,
        message=f"Incident #{id} response request declined by user.",
        incident_id=id
    )


# GET ESCALATION LOGS FOR AN INCIDENT
@router.get("/{id}/escalation-logs/", response_model=list[schemas.EscalationLogResponse])
@router.get("/{id}/escalation-logs", response_model=list[schemas.EscalationLogResponse], include_in_schema=False)
def get_incident_escalation_logs(
    id: int,
    db: Session = Depends(get_db),
    privileged_user: models.User = Depends(check_role(["Admin", "Security", "Volunteer"]))
):
    return crud.get_escalation_logs_by_alert_id(db, id)


# GET INCIDENT TIMELINE
@router.get("/{id}/timeline/", response_model=list[schemas.IncidentTimelineResponse])
@router.get("/{id}/timeline", response_model=list[schemas.IncidentTimelineResponse], include_in_schema=False)
def get_incident_timeline_endpoint(
    id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    return crud.get_incident_timeline(db, id)


# GET INCIDENT HISTORY (Resolved or Closed)
@router.get("/history/", response_model=list[schemas.IncidentResponse])
@router.get("/history", response_model=list[schemas.IncidentResponse], include_in_schema=False)
def get_incident_history(
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    return db.query(models.SOSAlert).filter(
        models.SOSAlert.status.in_(["Resolved", "Closed"])
    ).order_by(models.SOSAlert.created_at.desc()).all()


# POST CLOSE INCIDENT WITH DOCUMENTATION
@router.post("/{id}/close/", response_model=schemas.IncidentCloseResponse)
@router.post("/{id}/close", response_model=schemas.IncidentCloseResponse, include_in_schema=False)
def close_incident_endpoint(
    id: int,
    payload: schemas.IncidentCloseRequest,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    alert = crud.get_sos_alert_by_id(db, id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )

    closed_alert = crud.close_incident_with_summary(
        db,
        incident_id=id,
        resolution_summary=payload.resolution_summary,
        remarks=payload.remarks,
        closed_by_user=current_user_obj
    )

    return schemas.IncidentCloseResponse(
        success=True,
        message=f"Incident #{id} successfully closed and documented.",
        incident_id=id,
        status="Closed",
        closed_by=f"{current_user_obj.first_name} {current_user_obj.last_name}",
        closed_at=closed_alert.closed_at,
        resolution_summary=payload.resolution_summary
    )


