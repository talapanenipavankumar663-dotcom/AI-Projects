from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, models, schemas
from app.dependencies import get_current_user_obj, check_role

router = APIRouter(
    prefix="/resident-profiles",
    tags=["Resident Profiles"]
)


# ASSIGN RESIDENT TO FLAT
@router.post("/", response_model=schemas.ResidentProfileResponse, status_code=status.HTTP_201_CREATED)
def assign_resident_to_flat(
    profile: schemas.ResidentProfileCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    # Validate User exists
    user = crud.get_user_by_id(db, profile.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Validate Flat exists
    flat = crud.get_flat_by_id(db, profile.flat_id)
    if not flat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flat not found"
        )

    # Validate Society exists
    society = crud.get_society_by_id(db, profile.society_id)
    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found"
        )

    # Validate Flat belongs to specified Society
    block = db.query(models.Block).filter(models.Block.id == flat.block_id).first()
    if not block or block.society_id != profile.society_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Flat does not belong to the specified society"
        )

    # Prevent duplicate assignments (same user mapped to same flat)
    existing_assignment = db.query(models.ResidentProfile).filter(
        models.ResidentProfile.user_id == profile.user_id,
        models.ResidentProfile.flat_id == profile.flat_id
    ).first()
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resident is already assigned to this flat"
        )

    # Prevent assigning one resident to multiple flats (strict single-flat constraint)
    any_assignment = db.query(models.ResidentProfile).filter(
        models.ResidentProfile.user_id == profile.user_id
    ).first()
    if any_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resident is already assigned to another flat"
        )

    return crud.create_resident_profile(db, profile)


# GET ALL RESIDENTS LIVING IN A FLAT
@router.get("/flat/{flat_id}", response_model=list[schemas.ResidentFlatResponse])
def get_residents_in_flat(
    flat_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_obj)
):
    # Role permissions check
    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user.id
    ).all()
    user_roles = [r[0] for r in roles]

    is_privileged = any(r in ["Admin", "Security", "Volunteer"] for r in user_roles)
    if not is_privileged:
        # Resident can only view their own flat details
        own_mapping = db.query(models.ResidentProfile).filter(
            models.ResidentProfile.user_id == current_user.id,
            models.ResidentProfile.flat_id == flat_id
        ).first()
        if not own_mapping:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: Residents can only view own flat details"
            )

    # Fetch flat
    flat = crud.get_flat_by_id(db, flat_id)
    if not flat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flat not found"
        )

    # Query all mappings for this flat
    profiles = crud.get_resident_profiles_by_flat_id(db, flat_id)
    
    # Retrieve block and society details
    block = db.query(models.Block).filter(models.Block.id == flat.block_id).first()
    society_name = ""
    block_name = ""
    if block:
        block_name = block.block_name
        society = db.query(models.Society).filter(models.Society.id == block.society_id).first()
        if society:
            society_name = society.society_name

    response_list = []
    for p in profiles:
        response_list.append(schemas.ResidentFlatResponse(
            profile=schemas.ResidentProfileResponse.from_orm(p),
            flat_number=flat.flat_number,
            floor_number=flat.floor_number,
            block_name=block_name,
            society_name=society_name,
            resident_name=f"{p.user.first_name} {p.user.last_name}"
        ))

    return response_list


# GET FLAT DETAILS OF A RESIDENT
@router.get("/resident/{user_id}", response_model=schemas.ResidentFlatResponse)
def get_flat_details_of_resident(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user_obj)
):
    # Role permissions check
    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user.id
    ).all()
    user_roles = [r[0] for r in roles]

    is_privileged = any(r in ["Admin", "Security", "Volunteer"] for r in user_roles)
    if not is_privileged and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Residents can only view own flat details"
        )

    p = crud.get_resident_profile_by_user_id(db, user_id)
    if not p:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resident profile mapping not found"
        )

    flat = crud.get_flat_by_id(db, p.flat_id)
    if not flat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flat not found"
        )

    block = db.query(models.Block).filter(models.Block.id == flat.block_id).first()
    society_name = ""
    block_name = ""
    if block:
        block_name = block.block_name
        society = db.query(models.Society).filter(models.Society.id == block.society_id).first()
        if society:
            society_name = society.society_name

    return schemas.ResidentFlatResponse(
        profile=schemas.ResidentProfileResponse.from_orm(p),
        flat_number=flat.flat_number,
        floor_number=flat.floor_number,
        block_name=block_name,
        society_name=society_name,
        resident_name=f"{p.user.first_name} {p.user.last_name}"
    )


# UPDATE RESIDENT MAPPING
@router.put("/{profile_id}", response_model=schemas.ResidentProfileResponse)
def update_resident_mapping(
    profile_id: int,
    profile: schemas.ResidentProfileUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    # Validate Resident Profile exists
    db_profile = crud.get_resident_profile_by_id(db, profile_id)
    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resident profile mapping not found"
        )

    # Validate Flat exists
    flat = crud.get_flat_by_id(db, profile.flat_id)
    if not flat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Flat not found"
        )

    # Validate Society exists
    society = crud.get_society_by_id(db, profile.society_id)
    if not society:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Society not found"
        )

    # Validate Flat belongs to specified Society
    block = db.query(models.Block).filter(models.Block.id == flat.block_id).first()
    if not block or block.society_id != profile.society_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Flat does not belong to the specified society"
        )

    # Prevent duplicate assignments (excluding this profile)
    existing_assignment = db.query(models.ResidentProfile).filter(
        models.ResidentProfile.user_id == db_profile.user_id,
        models.ResidentProfile.flat_id == profile.flat_id,
        models.ResidentProfile.id != profile_id
    ).first()
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resident is already assigned to this flat"
        )

    # Prevent assigning one resident to multiple flats (excluding this profile)
    any_assignment = db.query(models.ResidentProfile).filter(
        models.ResidentProfile.user_id == db_profile.user_id,
        models.ResidentProfile.id != profile_id
    ).first()
    if any_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resident is already assigned to another flat"
        )

    return crud.update_resident_profile(db, profile_id, profile)


# REMOVE RESIDENT MAPPING
@router.delete("/{profile_id}", response_model=schemas.ResidentProfileResponse)
def remove_resident_mapping(
    profile_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    db_profile = crud.get_resident_profile_by_id(db, profile_id)
    if not db_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resident profile mapping not found"
        )

    return crud.delete_resident_profile(db, profile_id)
