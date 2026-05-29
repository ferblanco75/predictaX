from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.config import settings


class UserCreate(BaseModel):
    """Schema for user registration"""

    email: EmailStr = Field(max_length=255)
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-z0-9_-]+$")
    password: str = Field(min_length=8, max_length=100)
    terms_accepted: bool
    privacy_accepted: bool
    is_adult: bool
    marketing_opt_in: bool = False
    legal_consent_version: str = Field(
        default=settings.LEGAL_CONSENT_VERSION,
        max_length=32,
    )

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower() if isinstance(value, str) else value

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


class UserDeleteRequest(BaseModel):
    """Schema for deleting/anonymizing the current user account"""

    password: str = Field(min_length=8, max_length=100)
    confirm_delete: bool

    @field_validator("confirm_delete")
    @classmethod
    def required_delete_confirmation(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("Account deletion must be explicitly confirmed")
        return value


class CookieConsentUpdate(BaseModel):
    """Schema for storing authenticated cookie consent preferences"""

    essential: bool = True
    analytics: bool = False
    functional: bool = False
    marketing: bool = False
    version: str = Field(default=settings.LEGAL_CONSENT_VERSION, max_length=32)

    @field_validator("essential")
    @classmethod
    def essential_cookies_required(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("Essential cookies cannot be disabled")
        return value


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
    deleted_at: datetime | None = None
    cookie_consent_analytics: bool = False
    cookie_consent_functional: bool = False
    cookie_consent_marketing: bool = False
    cookie_consent_version: str | None = None
    cookie_consent_updated_at: datetime | None = None
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


class OTPRequest(BaseModel):
    email: EmailStr

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


class OTPVerify(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower() if isinstance(v, str) else v


class OTPRequestResponse(BaseModel):
    email: str
    email_sent: bool
    expires_in_minutes: int


class OTPVerifyResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool
