from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate


def create_user(db: Session, user_data: UserCreate) -> User:
    """
    Create a new user.

    Args:
        db: Database session
        user_data: User creation data

    Returns:
        Created user

    Raises:
        BadRequestException: If email or username already exists
    """
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise BadRequestException("Email already registered")

    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise BadRequestException("Username already taken")

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Authenticate a user with email and password.

    Args:
        db: Database session
        email: User email
        password: Plain password

    Returns:
        Authenticated user

    Raises:
        UnauthorizedException: If credentials are invalid
    """
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise UnauthorizedException("Invalid email or password")

    if not verify_password(password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password")

    return user


def get_user_by_id(db: Session, user_id: int) -> User:
    """
    Get user by ID.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        User

    Raises:
        UnauthorizedException: If user not found
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise UnauthorizedException("User not found")

    return user


def create_user_token(user: User) -> str:
    """
    Create JWT token for user.

    Args:
        user: User model

    Returns:
        JWT access token
    """
    return create_access_token(data={"sub": str(user.id)})
