from sqlalchemy.orm import Session
from sqlalchemy.sql import func
import random

from app import models, schemas
from app.auth import hash_password, verify_password
from app.redis_client import redis_client


# ---------------- USER CRUD ---------------- #

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone,
        password=hash_password(user.password)
    )

    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Accounts are created plain (Unassigned).
        # Roles and flat mappings are explicitly assigned by Admin in Admin Portal.
        return db_user
    except Exception as e:
        db.rollback()
        raise e


def assign_user_role_by_name(db: Session, user_id: int, role_name: str):
    if not role_name or role_name.lower() in ("unassigned", "plain", "pending"):
        db.query(models.UserRole).filter(models.UserRole.user_id == user_id).delete(synchronize_session=False)
        db.commit()
        return

    clean_name = role_name.strip().capitalize()
    upper_name = clean_name.upper()

    target_roles = []
    for r_str in [clean_name, upper_name]:
        role_obj = db.query(models.Role).filter(func.lower(models.Role.role_name) == r_str.lower()).first()
        if not role_obj:
            role_obj = models.Role(role_name=r_str)
            db.add(role_obj)
            db.commit()
            db.refresh(role_obj)
        target_roles.append(role_obj)

    db.query(models.UserRole).filter(models.UserRole.user_id == user_id).delete(synchronize_session=False)

    added_ids = set()
    for r_obj in target_roles:
        if r_obj.id not in added_ids:
            db.add(models.UserRole(user_id=user_id, role_id=r_obj.id))
            added_ids.add(r_obj.id)

    if clean_name.lower() == "resident":
        existing_profile = db.query(models.ResidentProfile).filter(models.ResidentProfile.user_id == user_id).first()
        if not existing_profile:
            society = db.query(models.Society).first()
            flat = db.query(models.Flat).first()
            society_id = society.id if society else 1
            flat_id = flat.id if flat else 1
            profile = models.ResidentProfile(
                user_id=user_id,
                society_id=society_id,
                flat_id=flat_id,
                resident_type="Owner"
            )
            db.add(profile)

    db.commit()


def get_users(db: Session):
    return db.query(models.User).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.User).filter(
        models.User.id == user_id
    ).first()


def get_user_by_email(db: Session, email: str):
    if not email:
        return None
    return db.query(models.User).filter(
        models.User.email.ilike(email)
    ).first()


def get_user_by_phone(db: Session, phone: str):
    return db.query(models.User).filter(
        models.User.phone == phone
    ).first()


def get_user_by_phone(db: Session, phone: str):
    return db.query(models.User).filter(
        models.User.phone == phone
    ).first()


def update_user(
    db: Session,
    user_id: int,
    user: schemas.UserUpdate
):

    db_user = get_user_by_id(db, user_id)

    if db_user is None:
        return None

    if user.first_name is not None:
        db_user.first_name = user.first_name
    if user.last_name is not None:
        db_user.last_name = user.last_name
    if user.email is not None:
        db_user.email = user.email
    if user.phone is not None:
        db_user.phone = user.phone
    if user.password is not None:
        db_user.password = hash_password(user.password)
    if user.is_active is not None:
        db_user.is_active = user.is_active

    if user.role is not None:
        assign_user_role_by_name(db, user_id, user.role)

    db.commit()
    db.refresh(db_user)

    return db_user


def delete_user(db: Session, user_id: int):
    db_user = get_user_by_id(db, user_id)
    if db_user is None:
        return None

    db.query(models.UserRole).filter(models.UserRole.user_id == user_id).delete(synchronize_session=False)
    db.query(models.ResidentProfile).filter(models.ResidentProfile.user_id == user_id).delete(synchronize_session=False)
    db.query(models.EmergencyContact).filter(models.EmergencyContact.resident_id == user_id).delete(synchronize_session=False)

    db.delete(db_user)
    db.commit()

    return db_user


def authenticate_user(
    db: Session,
    email: str,
    password: str
):

    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(password, user.password):
        return None

    return user         

# ---------------- SOCIETY CRUD ---------------- #

def create_society(db: Session, society: schemas.SocietyCreate):
    db_society = models.Society(
        society_name=society.society_name,
        address=society.address,
        city=society.city,
        state=society.state,
        pincode=society.pincode
    )

    db.add(db_society)
    db.commit()
    db.refresh(db_society)

    return db_society


def get_societies(db: Session):
    return db.query(models.Society).all()


def get_society_by_id(db: Session, society_id: int):
    return db.query(models.Society).filter(
        models.Society.id == society_id
    ).first()


def update_society(
    db: Session,
    society_id: int,
    society: schemas.SocietyUpdate
):

    db_society = get_society_by_id(db, society_id)

    if db_society is None:
        return None

    db_society.society_name = society.society_name
    db_society.address = society.address
    db_society.city = society.city
    db_society.state = society.state
    db_society.pincode = society.pincode

    db.commit()
    db.refresh(db_society)

    return db_society


def delete_society(db: Session, society_id: int):

    db_society = get_society_by_id(db, society_id)

    if db_society is None:
        return None

    db.delete(db_society)
    db.commit()

    return db_society

# ---------------- BLOCK CRUD ---------------- #

def create_block(db: Session, block: schemas.BlockCreate):
    db_block = models.Block(
        society_id=block.society_id,
        block_name=block.block_name,
        description=block.description
    )

    db.add(db_block)
    db.commit()
    db.refresh(db_block)

    return db_block


def get_blocks(db: Session):
    return db.query(models.Block).all()


def get_block_by_id(db: Session, block_id: int):
    return db.query(models.Block).filter(
        models.Block.id == block_id
    ).first()


def update_block(
    db: Session,
    block_id: int,
    block: schemas.BlockUpdate
):
    db_block = get_block_by_id(db, block_id)

    if db_block is None:
        return None

    db_block.society_id = block.society_id
    db_block.block_name = block.block_name
    db_block.description = block.description

    db.commit()
    db.refresh(db_block)

    return db_block


def delete_block(db: Session, block_id: int):
    db_block = get_block_by_id(db, block_id)

    if db_block is None:
        return None

    db.delete(db_block)
    db.commit()

    return db_block     

# ---------------- FLAT CRUD ---------------- #

def create_flat(db: Session, flat: schemas.FlatCreate):
    db_flat = models.Flat(
        block_id=flat.block_id,
        flat_number=flat.flat_number,
        floor_number=flat.floor_number
    )

    db.add(db_flat)
    db.commit()
    db.refresh(db_flat)

    return db_flat


def get_flats(db: Session):
    return db.query(models.Flat).all()


def get_flat_by_id(db: Session, flat_id: int):
    return db.query(models.Flat).filter(
        models.Flat.id == flat_id
    ).first()


def update_flat(
    db: Session,
    flat_id: int,
    flat: schemas.FlatUpdate
):
    db_flat = get_flat_by_id(db, flat_id)

    if db_flat is None:
        return None

    db_flat.block_id = flat.block_id
    db_flat.flat_number = flat.flat_number
    db_flat.floor_number = flat.floor_number

    db.commit()
    db.refresh(db_flat)

    return db_flat


def delete_flat(db: Session, flat_id: int):
    db_flat = get_flat_by_id(db, flat_id)

    if db_flat is None:
        return None

    db.delete(db_flat)
    db.commit()

    return db_flat

## ---------------- EMERGENCY CONTACT CRUD ---------------- #

def create_emergency_contact(
    db: Session,
    contact: schemas.ContactCreate
):
    db_contact = models.EmergencyContact(
        resident_id=contact.resident_id,
        name=contact.name,
        phone=contact.phone,
        email=contact.email,
        relationship=contact.relationship,
        priority=contact.priority
    )

    try:
        db.add(db_contact)
        db.commit()
        db.refresh(db_contact)
        return db_contact
    except Exception as e:
        db.rollback()
        raise e


def get_emergency_contacts(db: Session):
    return db.query(models.EmergencyContact).all()


def get_emergency_contact_by_id(db: Session, contact_id: int):
    return db.query(models.EmergencyContact).filter(
        models.EmergencyContact.id == contact_id
    ).first()


def update_emergency_contact(
    db: Session,
    contact_id: int,
    contact: schemas.EmergencyContactUpdate
):
    db_contact = get_emergency_contact_by_id(db, contact_id)

    if db_contact is None:
        return None

    db_contact.resident_id = contact.resident_id
    db_contact.name = contact.name
    db_contact.phone = contact.phone
    db_contact.email = contact.email
    db_contact.relationship = contact.relationship
    db_contact.priority = contact.priority
    db_contact.is_verified = contact.is_verified

    try:
        db.commit()
        db.refresh(db_contact)
        return db_contact
    except Exception as e:
        db.rollback()
        raise e


def delete_emergency_contact(db: Session, contact_id: int):
    db_contact = get_emergency_contact_by_id(db, contact_id)

    if db_contact is None:
        return None

    try:
        db.query(models.ContactVerification).filter(
            models.ContactVerification.emergency_contact_id == contact_id
        ).delete(synchronize_session=False)
        db.delete(db_contact)
        db.commit()
        return db_contact
    except Exception as e:
        db.rollback()
        raise e

    return db_contact   
    
# ---------------- OTP CRUD ---------------- #

def generate_otp():
    return str(random.randint(100000, 999999))


def store_otp(phone: str):
    otp = generate_otp()

    redis_client.setex(
        f"otp:{phone}",
        300,  # OTP valid for 5 minutes
        otp
    )

    return otp


def verify_otp(phone: str, otp: str):
    stored_otp = redis_client.get(f"otp:{phone}")

    if stored_otp == otp:
        redis_client.delete(f"otp:{phone}")
        return True

    return False

# ---------------- SECURITY PROFILE CRUD ---------------- #

def create_security_profile(
    db: Session,
    profile: schemas.SecurityProfileCreate
):
    db_profile = models.SecurityProfile(
        society_id=profile.society_id,
        employee_id=profile.employee_id,
        shift_details=profile.shift_details
    )

    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)

    return db_profile


def get_security_profiles(db: Session):
    return db.query(models.SecurityProfile).all()


def get_security_profile_by_id(
    db: Session,
    profile_id: int
):
    return db.query(models.SecurityProfile).filter(
        models.SecurityProfile.id == profile_id
    ).first()


def update_security_profile(
    db: Session,
    profile_id: int,
    profile: schemas.SecurityProfileUpdate
):
    db_profile = get_security_profile_by_id(
        db,
        profile_id
    )

    if db_profile is None:
        return None

    db_profile.society_id = profile.society_id
    db_profile.employee_id = profile.employee_id
    db_profile.shift_details = profile.shift_details

    db.commit()
    db.refresh(db_profile)

    return db_profile


def delete_security_profile(
    db: Session,
    profile_id: int
):
    db_profile = get_security_profile_by_id(
        db,
        profile_id
    )

    if db_profile is None:
        return None

    db.delete(db_profile)
    db.commit()

    return db_profile


# ---------------- CONTACT VERIFICATION CRUD ---------------- #

def create_contact_verification(
    db: Session,
    verification: schemas.ContactVerificationCreate
):
    db_verification = models.ContactVerification(
        emergency_contact_id=verification.emergency_contact_id,
        otp=verification.otp,
        verified=verification.verified
    )

    try:
        db.add(db_verification)
        db.commit()
        db.refresh(db_verification)
        return db_verification
    except Exception as e:
        db.rollback()
        raise e


def get_contact_verifications(db: Session):
    return db.query(models.ContactVerification).all()


def get_contact_verification_by_id(
    db: Session,
    verification_id: int
):
    return db.query(models.ContactVerification).filter(
        models.ContactVerification.id == verification_id
    ).first()


def update_contact_verification(
    db: Session,
    verification_id: int,
    verification: schemas.ContactVerificationUpdate
):
    db_verification = get_contact_verification_by_id(
        db,
        verification_id
    )

    if db_verification is None:
        return None

    db_verification.emergency_contact_id = verification.emergency_contact_id
    db_verification.otp = verification.otp
    db_verification.verified = verification.verified

    try:
        db.commit()
        db.refresh(db_verification)
        return db_verification
    except Exception as e:
        db.rollback()
        raise e


def delete_contact_verification(
    db: Session,
    verification_id: int
):
    db_verification = get_contact_verification_by_id(
        db,
        verification_id
    )

    if db_verification is None:
        return None

    try:
        db.delete(db_verification)
        db.commit()
        return db_verification
    except Exception as e:
        db.rollback()
        raise e


# ---------------- SOCIETY MEMBER CRUD ---------------- #

def create_society_member(db: Session, member: schemas.SocietyMemberCreate):
    db_member = models.SocietyMember(
        user_id=member.user_id,
        society_id=member.society_id,
        status=member.status
    )

    db.add(db_member)
    db.commit()
    db.refresh(db_member)

    return db_member


def get_society_members(db: Session):
    return db.query(models.SocietyMember).all()


def get_society_member_by_id(db: Session, member_id: int):
    return db.query(models.SocietyMember).filter(
        models.SocietyMember.id == member_id
    ).first()


def update_society_member(
    db: Session,
    member_id: int,
    member: schemas.SocietyMemberUpdate
):
    db_member = get_society_member_by_id(db, member_id)

    if db_member is None:
        return None

    db_member.user_id = member.user_id
    db_member.society_id = member.society_id
    db_member.status = member.status

    db.commit()
    db.refresh(db_member)

    return db_member


def delete_society_member(db: Session, member_id: int):
    db_member = get_society_member_by_id(db, member_id)

    if db_member is None:
        return None

    db.delete(db_member)
    db.commit()

    return db_member               

# ---------------- ROLE CRUD ---------------- #

def create_role(db: Session, role: schemas.RoleCreate):
    db_role = models.Role(
        role_name=role.role_name
    )

    db.add(db_role)
    db.commit()
    db.refresh(db_role)

    return db_role


def get_roles(db: Session):
    return db.query(models.Role).all()


def get_role_by_id(db: Session, role_id: int):
    return db.query(models.Role).filter(
        models.Role.id == role_id
    ).first()


def get_role_by_name(db: Session, role_name: str):
    return db.query(models.Role).filter(
        models.Role.role_name == role_name
    ).first()


def update_role(
    db: Session,
    role_id: int,
    role: schemas.RoleUpdate
):
    db_role = get_role_by_id(db, role_id)

    if db_role is None:
        return None

    db_role.role_name = role.role_name

    db.commit()
    db.refresh(db_role)

    return db_role


def delete_role(db: Session, role_id: int):
    db_role = get_role_by_id(db, role_id)

    if db_role is None:
        return None

    db.delete(db_role)
    db.commit()

    return db_role          


# ---------------- USER ROLE CRUD ---------------- #

def create_user_role(db: Session, user_role: schemas.UserRoleCreate):
    db_user_role = models.UserRole(
        user_id=user_role.user_id,
        role_id=user_role.role_id
    )

    db.add(db_user_role)
    db.commit()
    db.refresh(db_user_role)

    return db_user_role


def get_user_roles(db: Session):
    return db.query(models.UserRole).all()


def get_user_role_by_id(db: Session, user_role_id: int):
    return db.query(models.UserRole).filter(
        models.UserRole.id == user_role_id
    ).first()


def update_user_role(
    db: Session,
    user_role_id: int,
    user_role: schemas.UserRoleUpdate
):
    db_user_role = get_user_role_by_id(db, user_role_id)

    if db_user_role is None:
        return None

    db_user_role.user_id = user_role.user_id
    db_user_role.role_id = user_role.role_id

    db.commit()
    db.refresh(db_user_role)

    return db_user_role


def delete_user_role(db: Session, user_role_id: int):
    db_user_role = get_user_role_by_id(db, user_role_id)

    if db_user_role is None:
        return None

    try:
        db.delete(db_user_role)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

def create_resident_profile(
    db: Session,
    profile: schemas.ResidentProfileCreate
):
    db_profile = models.ResidentProfile(
        user_id=profile.user_id,
        flat_id=profile.flat_id,
        society_id=profile.society_id,
        resident_type=profile.resident_type
    )

    try:
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except Exception as e:
        db.rollback()
        raise e


def get_resident_profiles(db: Session):
    return db.query(models.ResidentProfile).all()


def get_resident_profile_by_id(db: Session, profile_id: int):
    return db.query(models.ResidentProfile).filter(
        models.ResidentProfile.id == profile_id
    ).first()


def get_resident_profiles_by_flat_id(db: Session, flat_id: int):
    return db.query(models.ResidentProfile).filter(
        models.ResidentProfile.flat_id == flat_id
    ).all()


def get_resident_profile_by_user_id(db: Session, user_id: int):
    return db.query(models.ResidentProfile).filter(
        models.ResidentProfile.user_id == user_id
    ).first()


def update_resident_profile(
    db: Session,
    profile_id: int,
    profile: schemas.ResidentProfileUpdate
):
    db_profile = get_resident_profile_by_id(db, profile_id)
    if db_profile is None:
        return None

    db_profile.flat_id = profile.flat_id
    db_profile.society_id = profile.society_id
    db_profile.resident_type = profile.resident_type

    try:
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except Exception as e:
        db.rollback()
        raise e


def delete_resident_profile(db: Session, profile_id: int):
    db_profile = get_resident_profile_by_id(db, profile_id)
    if db_profile is None:
        return None

    try:
        db.delete(db_profile)
        db.commit()
        return db_profile
    except Exception as e:
        db.rollback()
        raise e


# ---------------- SOS ALERT CRUD ---------------- #



def get_active_sos_alerts(db: Session):
    return db.query(models.SOSAlert).filter(
        models.SOSAlert.status == "Active"
    ).all()


def get_sos_alert_by_id(db: Session, alert_id: int):
    return db.query(models.SOSAlert).filter(
        models.SOSAlert.id == alert_id
    ).first()


def resolve_sos_alert(db: Session, alert_id: int):
    db_alert = get_sos_alert_by_id(db, alert_id)
    if db_alert is None:
        return None

    try:
        db.commit()
        db.refresh(db_alert)
        return db_alert
    except Exception as e:
        db.rollback()
        raise e


# ---------------- RESIDENT PROFILE CRUD ---------------- #

def create_resident_profile(
    db: Session,
    profile: schemas.ResidentProfileCreate
):
    db_profile = models.ResidentProfile(
        user_id=profile.user_id,
        flat_id=profile.flat_id,
        society_id=profile.society_id,
        resident_type=profile.resident_type
    )

    try:
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except Exception as e:
        db.rollback()
        raise e


def get_resident_profiles(db: Session):
    return db.query(models.ResidentProfile).all()


def get_resident_profile_by_id(db: Session, profile_id: int):
    return db.query(models.ResidentProfile).filter(
        models.ResidentProfile.id == profile_id
    ).first()


def get_resident_profiles_by_flat_id(db: Session, flat_id: int):
    return db.query(models.ResidentProfile).filter(
        models.ResidentProfile.flat_id == flat_id
    ).all()


def get_resident_profile_by_user_id(db: Session, user_id: int):
    return db.query(models.ResidentProfile).filter(
        models.ResidentProfile.user_id == user_id
    ).first()


def update_resident_profile(
    db: Session,
    profile_id: int,
    profile: schemas.ResidentProfileUpdate
):
    db_profile = get_resident_profile_by_id(db, profile_id)
    if db_profile is None:
        return None

    db_profile.flat_id = profile.flat_id
    db_profile.society_id = profile.society_id
    db_profile.resident_type = profile.resident_type

    try:
        db.commit()
        db.refresh(db_profile)
        return db_profile
    except Exception as e:
        db.rollback()
        raise e


def delete_resident_profile(db: Session, profile_id: int):
    db_profile = get_resident_profile_by_id(db, profile_id)
    if db_profile is None:
        return None

    try:
        db.delete(db_profile)
        db.commit()
        return db_profile
    except Exception as e:
        db.rollback()
        raise e


# ---------------- SOS ALERT CRUD ---------------- #

def create_sos_alert(
    db: Session,
    resident_id: int,
    flat_id: int,
    society_id: int,
    emergency_type: str = "Other",
    emergency_message: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None
):
    # Retrieve flat, block and society details from database to copy them
    flat = db.query(models.Flat).filter(models.Flat.id == flat_id).first()
    flat_no = flat.flat_number if flat else "Unknown"

    block_name = "Unknown"
    if flat:
        block = db.query(models.Block).filter(models.Block.id == flat.block_id).first()
        if block:
            block_name = block.block_name

    society = db.query(models.Society).filter(models.Society.id == society_id).first()
    society_name = society.society_name if society else "Unknown"

    db_alert = models.SOSAlert(
        resident_id=resident_id,
        flat_id=flat_id,
        society_id=society_id,
        emergency_type=emergency_type,
        emergency_message=emergency_message,
        notes=emergency_message,
        flat_no=flat_no,
        block=block_name,
        society=society_name,
        latitude=latitude,
        longitude=longitude,
        status="Open"
    )

    try:
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)
        
        # Log timeline event: SOS Created
        res_user = get_user_by_id(db, resident_id)
        res_name = f"{res_user.first_name} {res_user.last_name}" if res_user else f"Resident #{resident_id}"
        log_timeline_event(db, db_alert.id, "SOS Created", res_name)

        return db_alert
    except Exception as e:
        db.rollback()
        raise e


def get_active_sos_alerts(db: Session):
    return db.query(models.SOSAlert).filter(
        models.SOSAlert.status.in_(["Active", "Open"])
    ).all()


def get_sos_alert_by_id(db: Session, alert_id: int):
    return db.query(models.SOSAlert).filter(
        models.SOSAlert.id == alert_id
    ).first()


def resolve_sos_alert(db: Session, alert_id: int):
    db_alert = get_sos_alert_by_id(db, alert_id)
    if db_alert is None:
        return None

    import datetime
    db_alert.status = "Resolved"
    db_alert.resolved_at = datetime.datetime.now(datetime.timezone.utc)

    try:
        db.commit()
        db.refresh(db_alert)
        return db_alert
    except Exception as e:
        db.rollback()
        raise e


def get_all_sos_alerts(db: Session):
    return db.query(models.SOSAlert).all()


def update_sos_alert_status(db: Session, alert_id: int, status: str):
    db_alert = get_sos_alert_by_id(db, alert_id)
    if db_alert is None:
        return None

    db_alert.status = status
    import datetime
    if status == "Resolved":
        db_alert.resolved_at = datetime.datetime.now(datetime.timezone.utc)
    elif status == "Closed":
        db_alert.closed_at = datetime.datetime.now(datetime.timezone.utc)
    elif status == "Assigned":
        if not db_alert.accepted_at:
            db_alert.accepted_at = datetime.datetime.now(datetime.timezone.utc)

    try:
        db.commit()
        db.refresh(db_alert)
        return db_alert
    except Exception as e:
        db.rollback()
        raise e


def get_dashboard_summary(db: Session):
    total = db.query(models.SOSAlert).count()
    active = db.query(models.SOSAlert).filter(
        ~models.SOSAlert.status.in_(["Resolved", "Closed"])
    ).count()
    pending = db.query(models.SOSAlert).filter(
        models.SOSAlert.status == "Open"
    ).count()
    resolved = db.query(models.SOSAlert).filter(
        models.SOSAlert.status == "Resolved"
    ).count()

    return {
        "total_incidents": total,
        "active_incidents": active,
        "pending_responses": pending,
        "resolved_incidents": resolved
    }


def get_all_incidents_ordered(db: Session):
    return db.query(models.SOSAlert).order_by(models.SOSAlert.created_at.desc()).all()


def get_active_incidents(db: Session):
    return db.query(models.SOSAlert).filter(
        ~models.SOSAlert.status.in_(["Resolved", "Closed"])
    ).order_by(models.SOSAlert.created_at.desc()).all()


def get_incident_analytics(db: Session):
    alerts = db.query(models.SOSAlert).all()
    by_type = {}
    response_times = []
    resolution_times = []

    for alert in alerts:
        by_type[alert.emergency_type] = by_type.get(alert.emergency_type, 0) + 1
        if alert.response_time is not None:
            response_times.append(alert.response_time)
        if alert.resolution_time is not None:
            resolution_times.append(alert.resolution_time)

    avg_resp = sum(response_times) / len(response_times) if response_times else 0.0
    avg_res = sum(resolution_times) / len(resolution_times) if resolution_times else 0.0

    return {
        "incidents_by_type": by_type,
        "average_response_time_seconds": round(avg_resp, 1),
        "average_resolution_time_seconds": round(avg_res, 1)
    }


def get_incident_reports(db: Session):
    total = db.query(models.SOSAlert).count()
    resolved = db.query(models.SOSAlert).filter(
        models.SOSAlert.status.in_(["Resolved", "Closed"])
    ).count()

    resolved_pct = (resolved / total * 100.0) if total > 0 else 0.0

    return {
        "report_generated_at": datetime.datetime.now(datetime.timezone.utc),
        "total_incidents_logged": total,
        "resolved_incidents": resolved,
        "resolved_percentage": round(resolved_pct, 1)
    }


def create_notification(
    db: Session,
    recipient_user_id: int,
    sos_alert_id: int,
    notification_type: str,
    title: str,
    message: str
):
    db_notification = models.Notification(
        recipient_user_id=recipient_user_id,
        sos_alert_id=sos_alert_id,
        notification_type=notification_type,
        title=title,
        message=message,
        status="Pending"
    )
    db.add(db_notification)
    return db_notification


def send_sos_notifications(db: Session, alert: models.SOSAlert):
    # Find Resident
    resident = db.query(models.User).filter(models.User.id == alert.resident_id).first()
    resident_name = f"{resident.first_name} {resident.last_name}" if resident else "A resident"
    
    # Log timeline event: SOS Created
    log_timeline_event(db, alert.id, "SOS Created", resident_name)

    # 1. Find Primary Guardian (highest priority contact, i.e., lowest priority number)
    primary_contact = db.query(models.EmergencyContact).filter(
        models.EmergencyContact.resident_id == alert.resident_id
    ).order_by(models.EmergencyContact.priority.asc()).first()
    
    if primary_contact:
        guardian_user = db.query(models.User).filter(
            (models.User.email == primary_contact.email) | 
            (models.User.phone == primary_contact.phone)
        ).first()
        if guardian_user:
            create_notification(
                db,
                recipient_user_id=guardian_user.id,
                sos_alert_id=alert.id,
                notification_type="Primary Guardian",
                title=f"SOS Alert: {resident_name}",
                message=f"{resident_name} has raised an SOS alert ({alert.emergency_type}) from Flat {alert.flat_no}, {alert.block}, {alert.society}."
            )
            log_timeline_event(db, alert.id, "Guardian Notified", f"Guardian {primary_contact.name}")
            
    # 2. Find Security Personnel
    security_role = db.query(models.Role).filter_by(role_name="Security").first()
    if security_role:
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
        for sec in security_users:
            create_notification(
                db,
                recipient_user_id=sec.id,
                sos_alert_id=alert.id,
                notification_type="Security Personnel",
                title=f"SOS Alert in Society: Flat {alert.flat_no}",
                message=f"{resident_name} has raised an SOS alert ({alert.emergency_type}) from Flat {alert.flat_no}, {alert.block}, {alert.society}."
            )

    # 3. Find Available Volunteers
    volunteer_role = db.query(models.Role).filter_by(role_name="Volunteer").first()
    if volunteer_role:
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
        for vol in volunteer_users:
            create_notification(
                db,
                recipient_user_id=vol.id,
                sos_alert_id=alert.id,
                notification_type="Volunteer",
                title=f"Assistance Needed: SOS Alert",
                message=f"{resident_name} has raised an SOS alert ({alert.emergency_type}) from Flat {alert.flat_no}, {alert.block}, {alert.society}."
            )
            
    db.commit()


def get_notifications_by_user_id(db: Session, user_id: int):
    return db.query(models.Notification).filter(
        models.Notification.recipient_user_id == user_id
    ).order_by(models.Notification.created_at.desc()).all()


def update_notification_status(db: Session, notification_id: int, status: str):
    db_notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if db_notification is None:
        return None
    db_notification.status = status
    try:
        db.commit()
        db.refresh(db_notification)
        return db_notification
    except Exception as e:
        db.rollback()
        raise e


# ---------------- VOLUNTEER AVAILABILITY CRUD ---------------- #

def get_volunteer_availability(db: Session, volunteer_id: int):
    avail = db.query(models.VolunteerAvailability).filter(
        models.VolunteerAvailability.volunteer_id == volunteer_id
    ).first()
    if not avail:
        avail = models.VolunteerAvailability(volunteer_id=volunteer_id, is_available=True)
        db.add(avail)
        db.commit()
        db.refresh(avail)
    return avail


def update_volunteer_availability(db: Session, volunteer_id: int, is_available: bool):
    avail = get_volunteer_availability(db, volunteer_id)
    avail.is_available = is_available
    db.commit()
    db.refresh(avail)
    return avail


def get_available_volunteers(db: Session):
    return db.query(models.VolunteerAvailability).filter(
        models.VolunteerAvailability.is_available == True
    ).all()


# ---------------- ESCALATION LOG CRUD ---------------- #

def get_escalation_logs_by_alert_id(db: Session, sos_alert_id: int):
    return db.query(models.EscalationLog).filter(
        models.EscalationLog.sos_alert_id == sos_alert_id
    ).order_by(models.EscalationLog.escalation_level.asc()).all()


# ---------------- INCIDENT TIMELINE CRUD ---------------- #

def log_timeline_event(db: Session, incident_id: int, action: str, performed_by: str):
    import datetime
    timeline_entry = models.IncidentTimeline(
        incident_id=incident_id,
        action=action,
        performed_by=performed_by,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(timeline_entry)
    db.commit()
    db.refresh(timeline_entry)
    return timeline_entry


def get_incident_timeline(db: Session, incident_id: int):
    return db.query(models.IncidentTimeline).filter(
        models.IncidentTimeline.incident_id == incident_id
    ).order_by(models.IncidentTimeline.timestamp.asc()).all()


def close_incident_with_summary(
    db: Session,
    incident_id: int,
    resolution_summary: str,
    remarks: str | None,
    closed_by_user: models.User
):
    import datetime
    alert = db.query(models.SOSAlert).filter(models.SOSAlert.id == incident_id).first()
    if not alert:
        return None

    now = datetime.datetime.utcnow()
    alert.status = "Closed"
    alert.closed_at = now
    alert.resolution_summary = resolution_summary
    alert.remarks = remarks
    alert.closed_by_id = closed_by_user.id
    alert.closed_by_name = f"{closed_by_user.first_name} {closed_by_user.last_name}"

    if not alert.resolved_at:
        alert.resolved_at = now

    db.commit()
    db.refresh(alert)

    # Log timeline event
    log_timeline_event(
        db,
        incident_id=incident_id,
        action="Incident Closed & Documented",
        performed_by=f"{closed_by_user.first_name} {closed_by_user.last_name}"
    )

    return alert


# ---------------- INCIDENT ANALYTICS & REPORTS CRUD ---------------- #

def get_incident_analytics(db: Session):
    total = db.query(models.SOSAlert).count()
    active = db.query(models.SOSAlert).filter(models.SOSAlert.status.in_(["Open", "Assigned", "In Progress", "Response Assigned"])).count()
    resolved = db.query(models.SOSAlert).filter(models.SOSAlert.status.in_(["Resolved", "Closed"])).count()

    # Emergency type breakdown
    type_counts = {}
    type_query = db.query(models.SOSAlert.emergency_type, func.count(models.SOSAlert.id)).group_by(models.SOSAlert.emergency_type).all()
    for etype, cnt in type_query:
        if etype:
            type_counts[etype] = cnt

    # Status breakdown
    status_counts = {}
    status_query = db.query(models.SOSAlert.status, func.count(models.SOSAlert.id)).group_by(models.SOSAlert.status).all()
    for st, cnt in status_query:
        if st:
            status_counts[st] = cnt

    return {
        "total_incidents": total,
        "active_incidents": active,
        "resolved_incidents": resolved,
        "by_emergency_type": type_counts,
        "by_status": status_counts
    }


def get_incident_reports(db: Session):
    import datetime
    incidents = db.query(models.SOSAlert).order_by(models.SOSAlert.created_at.desc()).all()
    reports = []
    for inc in incidents:
        resident_name = f"{inc.resident.first_name} {inc.resident.last_name}" if inc.resident else "Unknown Resident"
        society_name = inc.society if isinstance(inc.society, str) else (inc.society.society_name if (hasattr(inc, "society") and inc.society) else "Community")
        block_name = inc.block if isinstance(getattr(inc, "block", None), str) else (inc.flat.block.block_name if (hasattr(inc, "flat") and inc.flat and hasattr(inc.flat, "block") and inc.flat.block) else "Block A")
        flat_no = getattr(inc, "flat_no", None) if isinstance(getattr(inc, "flat_no", None), str) else (inc.flat.flat_number if (hasattr(inc, "flat") and inc.flat) else "101")

        reports.append({
            "id": inc.id,
            "emergency_type": inc.emergency_type or "Medical Emergency",
            "status": inc.status,
            "resident_name": resident_name,
            "location": f"Flat {flat_no}, {block_name}, {society_name}",
            "created_at": inc.created_at,
            "resolved_at": inc.resolved_at,
            "assigned_responder": f"{inc.assigned_responder.first_name} {inc.assigned_responder.last_name}" if inc.assigned_responder else None,
            "resolution_summary": inc.resolution_summary,
            "remarks": inc.remarks
        })

    return {
        "generated_at": datetime.datetime.utcnow(),
        "total_count": len(reports),
        "incidents": reports
    }

