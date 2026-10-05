from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas
from app.dependencies import check_role

router = APIRouter(
    prefix="/user-roles",
    tags=["User Roles"],
    dependencies=[Depends(check_role(["Admin"]))]
)


# CREATE USER ROLE
@router.post("/", response_model=schemas.UserRoleResponse)
def create_user_role(
    user_role: schemas.UserRoleCreate,
    db: Session = Depends(get_db)
):
    return crud.create_user_role(db, user_role)


# GET ALL USER ROLES
@router.get("/", response_model=list[schemas.UserRoleResponse])
def get_user_roles(
    db: Session = Depends(get_db)
):
    return crud.get_user_roles(db)


# GET USER ROLE BY ID
@router.get("/{user_role_id}", response_model=schemas.UserRoleResponse)
def get_user_role(
    user_role_id: int,
    db: Session = Depends(get_db)
):
    user_role = crud.get_user_role_by_id(db, user_role_id)

    if user_role is None:
        raise HTTPException(
            status_code=404,
            detail="User Role not found"
        )

    return user_role


# UPDATE USER ROLE
@router.put("/{user_role_id}", response_model=schemas.UserRoleResponse)
def update_user_role(
    user_role_id: int,
    user_role: schemas.UserRoleUpdate,
    db: Session = Depends(get_db)
):
    updated_user_role = crud.update_user_role(
        db,
        user_role_id,
        user_role
    )

    if updated_user_role is None:
        raise HTTPException(
            status_code=404,
            detail="User Role not found"
        )

    return updated_user_role


# DELETE USER ROLE
@router.delete("/{user_role_id}")
def delete_user_role(
    user_role_id: int,
    db: Session = Depends(get_db)
):
    deleted_user_role = crud.delete_user_role(
        db,
        user_role_id
    )

    if deleted_user_role is None:
        raise HTTPException(
            status_code=404,
            detail="User Role not found"
        )

    return {
        "message": "User Role deleted successfully"
    }