from datetime import datetime
from typing import Any
from pydantic import BaseModel, EmailStr, Field, model_validator


class ContactCreate(BaseModel):
    name: str = Field(..., example="Jane Doe")
    relationship: str = Field(..., example="Spouse")
    phone_number: str | None = Field(None, example="+1234567890")
    phone: str | None = Field(None, example="+1234567890")
    email: EmailStr | None = None
    priority: int | None = Field(1, description="1 for Primary Contact, 2 for Secondary Contact, etc.")

    @model_validator(mode="before")
    @classmethod
    def check_phone(cls, data: Any) -> Any:
        if isinstance(data, dict):
            p = data.get("phone") or data.get("phone_number")
            if p:
                data["phone"] = p
                data["phone_number"] = p
        return data


class VerifyFirebaseTokenRequest(BaseModel):
    firebase_id_token: str = Field(..., description="Firebase ID Token obtained after client OTP verification")


class ContactResponse(BaseModel):
    id: int
    user_id: int | None = None
    resident_id: int | None = None
    name: str
    phone_number: str | None = None
    phone: str | None = None
    relationship: str
    priority: int | None = 1
    is_verified: bool = False
    verified_at: datetime | None = None
    verification_method: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @model_validator(mode="before")
    @classmethod
    def map_fields(cls, data: Any) -> Any:
        if not isinstance(data, dict) and hasattr(data, "id"):
            res_id = getattr(data, "resident_id", None) or getattr(data, "user_id", None)
            ph = getattr(data, "phone", None) or getattr(data, "phone_number", None)
            return {
                "id": getattr(data, "id", None),
                "user_id": res_id,
                "resident_id": res_id,
                "name": getattr(data, "name", ""),
                "phone_number": ph,
                "phone": ph,
                "relationship": getattr(data, "relationship", ""),
                "priority": getattr(data, "priority", 1),
                "is_verified": getattr(data, "is_verified", False),
                "verified_at": getattr(data, "verified_at", None),
                "verification_method": getattr(data, "verification_method", None),
                "created_at": getattr(data, "created_at", None),
                "updated_at": getattr(data, "updated_at", None),
            }
        if isinstance(data, dict):
            res_id = data.get("resident_id") or data.get("user_id")
            ph = data.get("phone") or data.get("phone_number")
            data["user_id"] = res_id
            data["resident_id"] = res_id
            data["phone"] = ph
            data["phone_number"] = ph
        return data

    class Config:
        from_attributes = True

