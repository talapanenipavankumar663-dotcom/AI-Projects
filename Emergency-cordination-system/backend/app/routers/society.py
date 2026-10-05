from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, models, schemas
from app.auth import get_current_user
from app.dependencies import check_role

router = APIRouter(
    prefix="/societies",
    tags=["Societies"],
    dependencies=[Depends(get_current_user)]
)


# CREATE SOCIETY (Admin only)
@router.post("/", response_model=schemas.SocietyResponse)
def create_society(
    society: schemas.SocietyCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    return crud.create_society(db, society)


# GET ALL SOCIETIES
@router.get("/", response_model=list[schemas.SocietyResponse])
def get_societies(
    db: Session = Depends(get_db)
):
    return crud.get_societies(db)


# GET SOCIETY BY ID
@router.get("/{society_id}", response_model=schemas.SocietyResponse)
def get_society(
    society_id: int,
    db: Session = Depends(get_db)
):
    society = crud.get_society_by_id(db, society_id)

    if society is None:
        raise HTTPException(
            status_code=404,
            detail="Society not found"
        )

    return society


# UPDATE SOCIETY (Admin only)
@router.put("/{society_id}", response_model=schemas.SocietyResponse)
def update_society(
    society_id: int,
    society: schemas.SocietyUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    updated_society = crud.update_society(
        db,
        society_id,
        society
    )

    if updated_society is None:
        raise HTTPException(
            status_code=404,
            detail="Society not found"
        )

    return updated_society


# DELETE SOCIETY (Admin only)
@router.delete("/{society_id}")
def delete_society(
    society_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    deleted_society = crud.delete_society(
        db,
        society_id
    )

    if deleted_society is None:
        raise HTTPException(
            status_code=404,
            detail="Society not found"
        )

    return {
        "message": "Society deleted successfully"
    }