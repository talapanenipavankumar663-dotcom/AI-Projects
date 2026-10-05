from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, models, schemas
from app.auth import get_current_user
from app.dependencies import check_role

router = APIRouter(
    prefix="/blocks",
    tags=["Blocks"],
    dependencies=[Depends(get_current_user)]
)


# CREATE BLOCK (Admin only)
@router.post("/", response_model=schemas.BlockResponse)
def create_block(
    block: schemas.BlockCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    return crud.create_block(db, block)


# GET ALL BLOCKS
@router.get("/", response_model=list[schemas.BlockResponse])
def get_blocks(
    db: Session = Depends(get_db)
):
    return crud.get_blocks(db)


# GET BLOCKS BY SOCIETY ID
@router.get("/society/{society_id}", response_model=list[schemas.BlockResponse])
def get_blocks_by_society(
    society_id: int,
    db: Session = Depends(get_db)
):
    return db.query(models.Block).filter(models.Block.society_id == society_id).all()


# GET BLOCK BY ID
@router.get("/{block_id}", response_model=schemas.BlockResponse)
def get_block(
    block_id: int,
    db: Session = Depends(get_db)
):
    block = crud.get_block_by_id(db, block_id)

    if block is None:
        raise HTTPException(
            status_code=404,
            detail="Block not found"
        )

    return block


# UPDATE BLOCK (Admin only)
@router.put("/{block_id}", response_model=schemas.BlockResponse)
def update_block(
    block_id: int,
    block: schemas.BlockUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    updated_block = crud.update_block(
        db,
        block_id,
        block
    )

    if updated_block is None:
        raise HTTPException(
            status_code=404,
            detail="Block not found"
        )

    return updated_block


# DELETE BLOCK (Admin only)
@router.delete("/{block_id}")
def delete_block(
    block_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(check_role(["Admin"]))
):
    deleted_block = crud.delete_block(
        db,
        block_id
    )

    if deleted_block is None:
        raise HTTPException(
            status_code=404,
            detail="Block not found"
        )

    return {
        "message": "Block deleted successfully"
    }