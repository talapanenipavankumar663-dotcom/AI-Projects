import datetime
import random
import re
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, models, schemas
from app.dependencies import get_current_user_obj
from app.services import firebase_service
from app.services.phone_service import format_to_e164

router = APIRouter(
    prefix="/contacts",
    tags=["Contact Verification Workflow"]
)


def normalize_phone(phone: str) -> str:
    """Normalizes phone string to clean digit representation for reliable comparison."""
    if not phone:
        return ""
    return re.sub(r"\D", "", phone)


@router.get("", response_model=list[schemas.ContactResponse])
@router.get("/", response_model=list[schemas.ContactResponse])
def get_contacts(
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    """
    Returns all emergency contacts for the logged-in user.
    """
    return db.query(models.EmergencyContact).filter(
        models.EmergencyContact.resident_id == current_user_obj.id
    ).order_by(models.EmergencyContact.priority.asc()).all()


@router.post("", response_model=schemas.ContactResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    req: schemas.ContactCreate,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    """
    Creates a new emergency contact for the logged-in user.
    """
    if not req.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required"
        )
    if not req.relationship.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Relationship is required"
        )
    
    raw_phone = req.phone or req.phone_number or ""
    formatted_phone = format_to_e164(raw_phone)
    if not formatted_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format"
        )

    # Calculate next priority if not provided
    priority = req.priority
    if not priority:
        existing_count = db.query(models.EmergencyContact).filter(
            models.EmergencyContact.resident_id == current_user_obj.id
        ).count()
        priority = existing_count + 1

    db_contact = models.EmergencyContact(
        resident_id=current_user_obj.id,
        name=req.name.strip(),
        phone=formatted_phone,
        email=req.email,
        relationship=req.relationship.strip(),
        priority=priority,
        is_verified=False
    )

    try:
        db.add(db_contact)
        db.commit()
        db.refresh(db_contact)
        return db_contact
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create contact: {str(e)}"
        )


@router.delete("/{contact_id}")
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    """
    Deletes an emergency contact.
    """
    existing_contact = crud.get_emergency_contact_by_id(db, contact_id)
    if existing_contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )
    if current_user_obj.id != existing_contact.resident_id:
        roles = db.query(models.Role.role_name).join(models.UserRole).filter(
            models.UserRole.user_id == current_user_obj.id
        ).all()
        user_roles = [r[0].lower() for r in roles]
        if "admin" not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: only the resident or admin can delete emergency contacts"
            )
    crud.delete_emergency_contact(db, contact_id)
    return {"message": "Emergency contact deleted successfully"}



# GENERATE OTP FOR AN EMERGENCY CONTACT (MOCK & EMAIL/SMS)
@router.post("/{contact_id}/generate-otp")
def generate_contact_otp(
    contact_id: int,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    contact = crud.get_emergency_contact_by_id(db, contact_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )

    if current_user_obj.id != contact.resident_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not own this emergency contact"
        )

    if contact.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact already verified"
        )

    otp = f"{random.randint(100000, 999999)}"

    verification = db.query(models.ContactVerification).filter(
        models.ContactVerification.emergency_contact_id == contact_id
    ).first()

    if verification:
        verification.otp = otp
        verification.verified = False
        verification.verified_at = None
        verification.created_at = datetime.datetime.utcnow()
    else:
        verification = models.ContactVerification(
            emergency_contact_id=contact_id,
            otp=otp,
            verified=False,
            created_at=datetime.datetime.utcnow()
        )
        db.add(verification)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save OTP"
        )

    # Dispatch Mobile SMS text message to recipient phone number
    from app.services.sms_service import send_sms_background, send_sms_otp
    if background_tasks:
        background_tasks.add_task(send_sms_otp, contact.phone, otp)
    else:
        send_sms_background(contact.phone, otp)

    return {
        "message": f"Mobile SMS verification OTP sent to {contact.phone}",
        "phone": contact.phone,
        "otp": otp
    }


# VERIFY SUBMITTED OTP (MOCK & FIREBASE)
@router.post("/{contact_id}/verify")
def verify_contact_otp(
    contact_id: int,
    req: dict,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    contact = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == contact_id
    ).first()

    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Emergency contact not found"
        )

    if current_user_obj.id != contact.resident_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not own this emergency contact"
        )

    if contact.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contact already verified"
        )

    # Check if Firebase ID token is provided
    firebase_token = req.get("firebase_id_token")
    if firebase_token:
        decoded_token = firebase_service.verify_firebase_id_token(firebase_token)
        verified_phone = decoded_token.get("phone_number") or decoded_token.get("phone")
        if not verified_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Firebase ID Token does not contain a verified phone number"
            )

        norm_verified = normalize_phone(verified_phone)
        norm_contact = normalize_phone(contact.phone)

        phones_match = (
            norm_verified == norm_contact or
            (len(norm_verified) >= 10 and len(norm_contact) >= 10 and norm_verified[-10:] == norm_contact[-10:])
        )

        if not phones_match:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Verified phone number ({verified_phone}) does not match emergency contact phone number ({contact.phone})"
            )

        now = datetime.datetime.utcnow()
        contact.is_verified = True
        contact.verified_at = now
        contact.verification_method = "FIREBASE"

        try:
            db.commit()
            db.refresh(contact)
            return {
                "success": True,
                "message": "Emergency Contact Verified Successfully via Firebase"
            }
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update verification status in database"
            )

    # Fallback to mock OTP check
    otp_val = req.get("otp")
    if not otp_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP or firebase_id_token is required"
        )

    verification = db.query(models.ContactVerification).filter(
        models.ContactVerification.emergency_contact_id == contact_id
    ).first()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP not generated for this contact"
        )

    if verification.otp != otp_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect OTP"
        )

    now = datetime.datetime.utcnow()
    created_at = verification.created_at
    if created_at.tzinfo is not None:
        created_at = created_at.replace(tzinfo=None)

    if (now - created_at).total_seconds() > 600:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired"
        )

    verification.verified = True
    verification.verified_at = now
    contact.is_verified = True

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify contact"
        )

    return {
        "success": True,
        "message": "Emergency contact verified successfully"
    }
