from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.database import get_db
from app.core.rate_limit import enforce_rate_limit
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import OTPRequest, OTPRequestResponse, OTPVerify, OTPVerifyResponse, Token, UserCreate, UserLogin, UserResponse
from app.services import auth_service, otp_service

router = APIRouter()


def _auth_rate_limit_key(action: str, request: Request) -> str:
    client_host = request.client.host if request.client else "unknown"
    return f"auth:{action}:{client_host}"


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """
    Register a new user.

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        Created user

    Raises:
        400: If email or username already exists
    """
    enforce_rate_limit(
        _auth_rate_limit_key("register", request),
        settings.AUTH_REGISTER_RATE_LIMIT_MAX,
        settings.AUTH_RATE_LIMIT_WINDOW_SECONDS,
    )
    user = auth_service.create_user(db, user_data)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    Login with email and password.

    Args:
        credentials: User login credentials
        db: Database session

    Returns:
        JWT access token

    Raises:
        401: If credentials are invalid
    """
    enforce_rate_limit(
        _auth_rate_limit_key("login", request),
        settings.AUTH_LOGIN_RATE_LIMIT_MAX,
        settings.AUTH_RATE_LIMIT_WINDOW_SECONDS,
    )
    user = auth_service.authenticate_user(db, credentials.email, credentials.password)
    access_token = auth_service.create_user_token(user)

    return Token(access_token=access_token)


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout current user.

    JWT tokens are stateless; the client must discard the token after calling this endpoint.

    Returns:
        Confirmation message
    """
    return {"message": "Successfully logged out"}


@router.post("/otp/request", response_model=OTPRequestResponse)
def request_otp(body: OTPRequest, request: Request, db: Session = Depends(get_db)):
    """
    Request an OTP code sent to the given email address.
    Rate limited to 3 requests per email per hour.
    """
    enforce_rate_limit(
        f"otp:request:{body.email}",
        settings.OTP_RATE_LIMIT_MAX,
        settings.OTP_RATE_LIMIT_WINDOW_SECONDS,
    )
    result = otp_service.request_otp(db, body.email)
    return result


@router.post("/otp/verify", response_model=OTPVerifyResponse)
def verify_otp(body: OTPVerify, db: Session = Depends(get_db)):
    """
    Verify an OTP code and return a JWT token.
    Creates the user automatically if the email is new.
    """
    user, is_new_user = otp_service.verify_otp(db, body.email, body.code)
    access_token = auth_service.create_user_token(user)
    return OTPVerifyResponse(access_token=access_token, is_new_user=is_new_user)


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.

    Args:
        current_user: Current authenticated user (from JWT token)

    Returns:
        User information

    Raises:
        401: If not authenticated
    """
    return current_user
