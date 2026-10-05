from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas
from app.dependencies import check_role

router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
    dependencies=[Depends(check_role(["Admin"]))]
)


# CREATE ROLE
@router.post("/", response_model=schemas.RoleResponse)
def create_role(
    role: schemas.RoleCreate,
    db: Session = Depends(get_db)
):
    existing_role = crud.get_role_by_name(db, role.role_name)
    if existing_role:
        raise HTTPException(
            status_code=400,
            detail="Role already exists"
        )
    return crud.create_role(db, role)


# GET ALL ROLES
@router.get("/", response_model=list[schemas.RoleResponse])
def get_roles(
    db: Session = Depends(get_db)
):
    return crud.get_roles(db)


# GET ROLE BY ID
@router.get("/{role_id}", response_model=schemas.RoleResponse)
def get_role(
    role_id: int,
    db: Session = Depends(get_db)
):
    role = crud.get_role_by_id(db, role_id)

    if role is None:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    return role


# UPDATE ROLE
@router.put("/{role_id}", response_model=schemas.RoleResponse)
def update_role(
    role_id: int,
    role: schemas.RoleUpdate,
    db: Session = Depends(get_db)
):
    updated_role = crud.update_role(
        db,
        role_id,
        role
    )

    if updated_role is None:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    return updated_role


# DELETE ROLE
@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db)
):
    deleted_role = crud.delete_role(
        db,
        role_id
    )

    if deleted_role is None:
        raise HTTPException(
            status_code=404,
            detail="Role not found"
        )

    return {
        "message": "Role deleted successfully"
    }