from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.auth import SECRET_KEY, ALGORITHM
from app.database import get_db
from app import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")

        if email is None:
            raise credentials_exception

        return email

    except JWTError:
        raise credentials_exception


def get_current_user_obj(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> models.User:
    user = db.query(models.User).filter(models.User.email == current_user).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


def check_role(allowed_roles: list[str]):
    def dependency(
        user: models.User = Depends(get_current_user_obj),
        db: Session = Depends(get_db)
    ) -> models.User:
        # Query user roles
        roles = db.query(models.Role.role_name).join(models.UserRole).filter(
            models.UserRole.user_id == user.id
        ).all()
        user_roles = [r[0].lower() for r in roles]
        allowed_lower = [r.lower() for r in allowed_roles]

        # If user has no explicit roles assigned yet, permit Resident access by default
        if not user_roles and "resident" in allowed_lower:
            return user

        if not any(role in allowed_lower for role in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: insufficient permissions"
            )
        return user
    return dependency