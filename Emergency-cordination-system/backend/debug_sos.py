from app.database import SessionLocal
from app import crud, models
from app.routers.sos import raise_sos_alert
from fastapi import BackgroundTasks

def debug():
    db = SessionLocal()
    user = db.query(models.User).filter(models.User.email == "newresident600@example.com").first()
    bg = BackgroundTasks()
    try:
        res = raise_sos_alert(background_tasks=bg, db=db, current_user_obj=user)
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug()
