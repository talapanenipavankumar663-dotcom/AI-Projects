from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import re

from app.database import get_db
from app import crud, models, schemas
from app.dependencies import get_current_user_obj
from app.services.phone_service import format_to_e164

router = APIRouter(
    prefix="/emergency-contacts",
    tags=["Emergency Contacts"]
)

PHONE_REGEX = re.compile(r"^\+?[1-9]\d{9,14}$")


# CREATE EMERGENCY CONTACT
@router.post("/", response_model=schemas.ContactResponse, status_code=status.HTTP_201_CREATED)
def create_emergency_contact(
    contact: schemas.ContactCreate,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    # Fetch roles to determine admin privilege
    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user_obj.id
    ).all()
    user_roles = [r[0] for r in roles]
    is_admin = any(r.lower() == "admin" for r in user_roles)

    # Only owner or admin can manage contacts
    if not is_admin and current_user_obj.id != contact.resident_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: only the resident can manage their own emergency contacts"
        )

    # Check if resident/user exists
    resident = db.query(models.User).filter(models.User.id == contact.resident_id).first()
    if not resident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resident/User not found"
        )

    # Store every contact in the same E.164 format used by Twilio.
    formatted_phone = format_to_e164(contact.phone)
    if not formatted_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format"
        )

    # Prevent duplicate contacts (same phone number per resident)
    existing = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.resident_id == contact.resident_id,
        models.EmergencyContact.phone == formatted_phone
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This phone number is already registered as an emergency contact for this resident"
        )

    # Enforce unique priority per resident
    existing_priority = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.resident_id == contact.resident_id,
        models.EmergencyContact.priority == contact.priority
    ).first()
    if existing_priority:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An emergency contact with this priority already exists"
        )

    contact.phone = formatted_phone
    return crud.create_emergency_contact(db, contact)


# GET ALL EMERGENCY CONTACTS (Sorted by priority)
@router.get("/", response_model=list[schemas.ContactResponse])
def get_emergency_contacts(
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    # Fetch roles to determine permissions
    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user_obj.id
    ).all()
    user_roles = [r[0].lower() for r in roles]

    is_privileged = any(r in ["admin", "security", "volunteer"] for r in user_roles)
    if not is_privileged:
        # Resident can only view their own contacts
        return db.query(models.EmergencyContact).filter(
            models.EmergencyContact.resident_id == current_user_obj.id
        ).order_by(models.EmergencyContact.priority.asc()).all()
    else:
        # Privileged roles can see all
        return db.query(models.EmergencyContact).order_by(models.EmergencyContact.priority.asc()).all()


# GET ALL EMERGENCY CONTACTS OF A RESIDENT (Sorted by priority)
@router.get("/resident/{resident_id}", response_model=list[schemas.ContactResponse])
def get_resident_emergency_contacts(
    resident_id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user_obj.id
    ).all()
    user_roles = [r[0].lower() for r in roles]

    is_privileged = any(r in ["admin", "security", "volunteer"] for r in user_roles)
    if not is_privileged and current_user_obj.id != resident_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: cannot view contacts of other residents"
        )

    return db.query(models.EmergencyContact).filter(
        models.EmergencyContact.resident_id == resident_id
    ).order_by(models.EmergencyContact.priority.asc()).all()


# GET EMERGENCY CONTACT BY ID
@router.get("/{contact_id}", response_model=schemas.ContactResponse)
def get_emergency_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    contact = crud.get_emergency_contact_by_id(db, contact_id)
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )

    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user_obj.id
    ).all()
    user_roles = [r[0].lower() for r in roles]

    is_privileged = any(r in ["admin", "security", "volunteer"] for r in user_roles)
    if not is_privileged and current_user_obj.id != contact.resident_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: not the owner of this contact"
        )

    return contact


# UPDATE EMERGENCY CONTACT
@router.put("/{contact_id}", response_model=schemas.ContactResponse)
def update_emergency_contact(
    contact_id: int,
    contact: schemas.EmergencyContactUpdate,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    existing_contact = crud.get_emergency_contact_by_id(db, contact_id)
    if existing_contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )

    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user_obj.id
    ).all()
    user_roles = [r[0].lower() for r in roles]
    is_admin = "admin" in user_roles

    if not is_admin and (current_user_obj.id != existing_contact.resident_id or current_user_obj.id != contact.resident_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: only the resident can modify their own contacts"
        )

    resident = db.query(models.User).filter(models.User.id == contact.resident_id).first()
    if not resident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resident/User not found"
        )

    formatted_phone = format_to_e164(contact.phone)
    if not formatted_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format"
        )

    existing = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.resident_id == contact.resident_id,
        models.EmergencyContact.phone == formatted_phone,
        models.EmergencyContact.id != contact_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This phone number is already registered as an emergency contact"
        )

    existing_priority = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.resident_id == contact.resident_id,
        models.EmergencyContact.priority == contact.priority,
        models.EmergencyContact.id != contact_id
    ).first()
    if existing_priority:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An emergency contact with this priority already exists"
        )

    contact.phone = formatted_phone
    updated_contact = crud.update_emergency_contact(
        db,
        contact_id,
        contact
    )

    return updated_contact


# DELETE EMERGENCY CONTACT
@router.delete("/{contact_id}")
def delete_emergency_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    existing_contact = crud.get_emergency_contact_by_id(db, contact_id)
    if existing_contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )

    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user_obj.id
    ).all()
    user_roles = [r[0].lower() for r in roles]
    is_admin = "admin" in user_roles

    if not is_admin and current_user_obj.id != existing_contact.resident_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: only the resident can delete their own contacts"
        )

    crud.delete_emergency_contact(db, contact_id)
    return {
        "message": "Emergency contact deleted successfully"
    }


# ALIAS ROUTE FOR OTP GENERATION
@router.post("/{contact_id}/generate-otp")
def generate_contact_otp_alias(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    from app.routers.contacts import generate_contact_otp
    return generate_contact_otp(contact_id=contact_id, db=db, current_user_obj=current_user_obj)


# ALIAS ROUTE FOR OTP VERIFICATION
@router.post("/{contact_id}/verify")
def verify_contact_otp_alias(
    contact_id: int,
    req: dict,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    from app.routers.contacts import verify_contact_otp
    return verify_contact_otp(contact_id=contact_id, req=req, db=db, current_user_obj=current_user_obj)

