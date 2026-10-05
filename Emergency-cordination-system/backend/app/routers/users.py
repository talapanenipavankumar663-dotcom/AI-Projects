from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, models, schemas
from app.auth import get_current_user
from app.dependencies import get_current_user_obj, check_role

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


def format_user_response(db: Session, user: models.User) -> dict:
    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == user.id
    ).all()
    user_roles = [r[0] for r in roles] if roles else ["Unassigned"]
    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "is_active": user.is_active,
        "roles": user_roles
    }


# CREATE USER (Public signup)
@router.post("/", response_model=schemas.UserResponse)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # Check if email is already registered
    existing_email = crud.get_user_by_email(db, user.email)
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered"
        )

    # Check if phone number is already registered
    existing_phone = crud.get_user_by_phone(db, user.phone)
    if existing_phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number is already registered"
        )

    created_user = crud.create_user(db, user)
    return format_user_response(db, created_user)


# GET CURRENT USER PROFILE
@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, current_user)
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return format_user_response(db, user)


# GET ALL USERS (Admin only)
@router.get("/", response_model=list[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    users = crud.get_users(db)
    return [format_user_response(db, u) for u in users]


# GET USER BY ID (Admin or User themselves)
@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user_obj.id
    ).all()
    user_roles = [r[0] for r in roles]

    if "Admin" not in user_roles and current_user_obj.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: insufficient permissions"
        )

    user = crud.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return format_user_response(db, user)


# UPDATE USER (Admin or User themselves)
@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    roles = db.query(models.Role.role_name).join(models.UserRole).filter(
        models.UserRole.user_id == current_user_obj.id
    ).all()
    user_roles = [r[0] for r in roles]

    if "Admin" not in user_roles and current_user_obj.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: insufficient permissions"
        )

    updated_user = crud.update_user(
        db,
        user_id,
        user
    )

    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return format_user_response(db, updated_user)


# DELETE USER (Admin only)
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    deleted_user = crud.delete_user(
        db,
        user_id
    )

    if deleted_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {
        "message": "User deleted successfully"
    }