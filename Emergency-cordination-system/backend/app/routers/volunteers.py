from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, models, schemas
from app.dependencies import get_current_user_obj, check_role

router = APIRouter(
    prefix="/api/volunteers",
    tags=["Volunteer Availability"]
)


# GET CURRENT VOLUNTEER AVAILABILITY STATUS
@router.get("/availability/", response_model=schemas.VolunteerAvailabilityResponse)
@router.get("/availability", response_model=schemas.VolunteerAvailabilityResponse, include_in_schema=False)
def get_my_availability(
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    avail = crud.get_volunteer_availability(db, current_user_obj.id)
    return avail


# TOGGLE / UPDATE VOLUNTEER AVAILABILITY (ONLINE / OFFLINE)
@router.post("/availability/", response_model=schemas.VolunteerAvailabilityResponse)
@router.post("/availability", response_model=schemas.VolunteerAvailabilityResponse, include_in_schema=False)
def update_my_availability(
    payload: schemas.VolunteerAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    avail = crud.update_volunteer_availability(db, current_user_obj.id, payload.is_available)
    status_text = "ONLINE (Available)" if payload.is_available else "OFFLINE (Unavailable)"
    print(f"\n[VOLUNTEER AVAILABILITY] User #{current_user_obj.id} ({current_user_obj.first_name}) set status to {status_text}.\n")
    return avail


# LIST ALL CURRENTLY AVAILABLE VOLUNTEERS
@router.get("/available/", response_model=list[schemas.VolunteerAvailabilityResponse])
@router.get("/available", response_model=list[schemas.VolunteerAvailabilityResponse], include_in_schema=False)
def list_available_volunteers(
    db: Session = Depends(get_db),
    privileged_user: models.User = Depends(check_role(["Admin", "Security", "Volunteer"]))
):
    return crud.get_available_volunteers(db)
