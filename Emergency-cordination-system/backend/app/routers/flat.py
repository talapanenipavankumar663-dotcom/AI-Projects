from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, models, schemas
from app.auth import get_current_user
from app.dependencies import check_role

router = APIRouter(
    prefix="/flats",
    tags=["Flats"],
    dependencies=[Depends(get_current_user)]
)


# CREATE FLAT (Admin only)
@router.post("/", response_model=schemas.FlatResponse)
def create_flat(
    flat: schemas.FlatCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    return crud.create_flat(db, flat)


# GET ALL FLATS
@router.get("/", response_model=list[schemas.FlatResponse])
def get_flats(
    db: Session = Depends(get_db)
):
    return crud.get_flats(db)


# GET FLATS BY BLOCK ID
@router.get("/block/{block_id}", response_model=list[schemas.FlatResponse])
def get_flats_by_block(
    block_id: int,
    db: Session = Depends(get_db)
):
    return db.query(models.Flat).filter(models.Flat.block_id == block_id).all()


# GET FLAT BY ID
@router.get("/{flat_id}", response_model=schemas.FlatResponse)
def get_flat(
    flat_id: int,
    db: Session = Depends(get_db)
):
    flat = crud.get_flat_by_id(db, flat_id)

    if flat is None:
        raise HTTPException(
            status_code=404,
            detail="Flat not found"
        )

    return flat


# UPDATE FLAT (Admin only)
@router.put("/{flat_id}", response_model=schemas.FlatResponse)
def update_flat(
    flat_id: int,
    flat: schemas.FlatUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    updated_flat = crud.update_flat(
        db,
        flat_id,
        flat
    )

    if updated_flat is None:
        raise HTTPException(
            status_code=404,
            detail="Flat not found"
        )

    return updated_flat


# DELETE FLAT (Admin only)
@router.delete("/{flat_id}")
def delete_flat(
    flat_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    deleted_flat = crud.delete_flat(
        db,
        flat_id
    )

    if deleted_flat is None:
        raise HTTPException(
            status_code=404,
            detail="Flat not found"
        )

    return {
        "message": "Flat deleted successfully"
    }
