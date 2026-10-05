from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, models, schemas
from app.dependencies import check_role

router = APIRouter(
    prefix="/security-profiles",
    tags=["Security Profiles"]
)


# CREATE SECURITY PROFILE (Admin only)
@router.post("/", response_model=schemas.SecurityProfileResponse)
def create_security_profile(
    profile: schemas.SecurityProfileCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    return crud.create_security_profile(db, profile)


# GET ALL SECURITY PROFILES (Admin and Security)
@router.get("/", response_model=list[schemas.SecurityProfileResponse])
def get_security_profiles(
    db: Session = Depends(get_db),
    privileged_user: models.User = Depends(check_role(["Admin", "Security"]))
):
    return crud.get_security_profiles(db)


# GET SECURITY PROFILE BY ID (Admin and Security)
@router.get("/{profile_id}", response_model=schemas.SecurityProfileResponse)
def get_security_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    privileged_user: models.User = Depends(check_role(["Admin", "Security"]))
):
    profile = crud.get_security_profile_by_id(db, profile_id)

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Security Profile not found"
        )

    return profile


# UPDATE SECURITY PROFILE (Admin only)
@router.put("/{profile_id}", response_model=schemas.SecurityProfileResponse)
def update_security_profile(
    profile_id: int,
    profile: schemas.SecurityProfileUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    updated_profile = crud.update_security_profile(
        db,
        profile_id,
        profile
    )

    if updated_profile is None:
        raise HTTPException(
            status_code=404,
            detail="Security Profile not found"
        )

    return updated_profile


# DELETE SECURITY PROFILE (Admin only)
@router.delete("/{profile_id}")
def delete_security_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    deleted_profile = crud.delete_security_profile(
        db,
        profile_id
    )

    if deleted_profile is None:
        raise HTTPException(
            status_code=404,
            detail="Security Profile not found"
        )

    return {
        "message": "Security Profile deleted successfully"
    }