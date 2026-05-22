from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.config import settings


class UserCreate(BaseModel):
    """Schema for user registration"""

    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=100)
    terms_accepted: bool
    privacy_accepted: bool
    is_adult: bool
    marketing_opt_in: bool = False
    legal_consent_version: str = Field(
        default=settings.LEGAL_CONSENT_VERSION,
        max_length=32,
    )

    @field_validator("terms_accepted", "privacy_accepted", "is_adult")
    @classmethod
    def required_legal_consent(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("Required legal consent was not accepted")
        return value


class UserLogin(BaseModel):
    """Schema for user login"""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response"""

    id: UUID
    email: str
    username: str
    points: float
    role: str = "user"
    terms_accepted_at: datetime | None = None
    privacy_accepted_at: datetime | None = None
    age_confirmed_at: datetime | None = None
    legal_consent_version: str | None = None
    marketing_opt_in: bool = False
    marketing_opt_in_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response"""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for decoded token data"""

    user_id: str
