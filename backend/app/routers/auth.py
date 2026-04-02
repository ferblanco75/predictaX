from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.dependencies import get_current_user
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services import auth_service
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
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
    user = auth_service.create_user(db, user_data)
    return user


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
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
