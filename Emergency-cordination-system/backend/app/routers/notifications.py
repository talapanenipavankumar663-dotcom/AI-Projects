from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import crud, models, schemas
from app.dependencies import get_current_user_obj

router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"]
)


@router.get("/", response_model=list[schemas.NotificationResponse])
@router.get("", response_model=list[schemas.NotificationResponse], include_in_schema=False)
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    return crud.get_notifications_by_user_id(db, current_user_obj.id)


@router.patch("/{id}/read/", response_model=schemas.NotificationResponse)
@router.patch("/{id}/read", response_model=schemas.NotificationResponse, include_in_schema=False)
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user_obj: models.User = Depends(get_current_user_obj)
):
    notification = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check authorization: user can only mark their own notifications as read
    if notification.recipient_user_id != current_user_obj.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: this notification belongs to another user"
        )
        
    return crud.update_notification_status(db, id, "Read")
