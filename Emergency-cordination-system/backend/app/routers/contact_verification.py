from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas
from app.dependencies import check_role

router = APIRouter(
    prefix="/contact-verifications",
    tags=["Contact Verification"],
    dependencies=[Depends(check_role(["Admin"]))]
)


# CREATE CONTACT VERIFICATION
@router.post("/", response_model=schemas.ContactVerificationResponse)
def create_contact_verification(
    verification: schemas.ContactVerificationCreate,
    db: Session = Depends(get_db)
):
    return crud.create_contact_verification(db, verification)


# GET ALL CONTACT VERIFICATIONS
@router.get("/", response_model=list[schemas.ContactVerificationResponse])
def get_contact_verifications(
    db: Session = Depends(get_db)
):
    return crud.get_contact_verifications(db)


# GET CONTACT VERIFICATION BY ID
@router.get("/{verification_id}", response_model=schemas.ContactVerificationResponse)
def get_contact_verification(
    verification_id: int,
    db: Session = Depends(get_db)
):
    verification = crud.get_contact_verification_by_id(
        db,
        verification_id
    )

    if verification is None:
        raise HTTPException(
            status_code=404,
            detail="Contact Verification not found"
        )

    return verification


# UPDATE CONTACT VERIFICATION
@router.put("/{verification_id}", response_model=schemas.ContactVerificationResponse)
def update_contact_verification(
    verification_id: int,
    verification: schemas.ContactVerificationUpdate,
    db: Session = Depends(get_db)
):
    updated_verification = crud.update_contact_verification(
        db,
        verification_id,
        verification
    )

    if updated_verification is None:
        raise HTTPException(
            status_code=404,
            detail="Contact Verification not found"
        )

    return updated_verification


# DELETE CONTACT VERIFICATION
@router.delete("/{verification_id}")
def delete_contact_verification(
    verification_id: int,
    db: Session = Depends(get_db)
):
    deleted_verification = crud.delete_contact_verification(
        db,
        verification_id
    )

    if deleted_verification is None:
        raise HTTPException(
            status_code=404,
            detail="Contact Verification not found"
        )

    return {
        "message": "Contact Verification deleted successfully"
    }