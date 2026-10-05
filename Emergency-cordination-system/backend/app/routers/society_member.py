from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, schemas
from app.dependencies import check_role

router = APIRouter(
    prefix="/society-members",
    tags=["Society Members"],
    dependencies=[Depends(check_role(["Admin"]))]
)


# CREATE SOCIETY MEMBER
@router.post("/", response_model=schemas.SocietyMemberResponse)
def create_society_member(
    member: schemas.SocietyMemberCreate,
    db: Session = Depends(get_db)
):
    return crud.create_society_member(db, member)


# GET ALL SOCIETY MEMBERS
@router.get("/", response_model=list[schemas.SocietyMemberResponse])
def get_society_members(
    db: Session = Depends(get_db)
):
    return crud.get_society_members(db)


# GET SOCIETY MEMBER BY ID
@router.get("/{member_id}", response_model=schemas.SocietyMemberResponse)
def get_society_member(
    member_id: int,
    db: Session = Depends(get_db)
):
    member = crud.get_society_member_by_id(db, member_id)

    if member is None:
        raise HTTPException(
            status_code=404,
            detail="Society Member not found"
        )

    return member


# UPDATE SOCIETY MEMBER
@router.put("/{member_id}", response_model=schemas.SocietyMemberResponse)
def update_society_member(
    member_id: int,
    member: schemas.SocietyMemberUpdate,
    db: Session = Depends(get_db)
):
    updated_member = crud.update_society_member(
        db,
        member_id,
        member
    )

    if updated_member is None:
        raise HTTPException(
            status_code=404,
            detail="Society Member not found"
        )

    return updated_member


# DELETE SOCIETY MEMBER
@router.delete("/{member_id}")
def delete_society_member(
    member_id: int,
    db: Session = Depends(get_db)
):
    deleted_member = crud.delete_society_member(
        db,
        member_id
    )

    if deleted_member is None:
        raise HTTPException(
            status_code=404,
            detail="Society Member not found"
        )

    return {
        "message": "Society Member deleted successfully"
    }