import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate
from app.services import otp_service

# #283: "no such account" used to fail instantly while a password account paid
# for bcrypt, which told an attacker which emails have a password. The failure
# branch verifies against this hash instead, so every outcome costs the same.
# Built on first use rather than at import so startup doesn't pay for it.
_dummy_password_hash = None


def create_user(db: Session, user_data: UserCreate) -> User:
    """
    Create a new user.

    Args:
        db: Database session
        user_data: User creation data

    Returns:
        Created user, or an unsaved decoy when the email is already taken
        (#283) — indistinguishable from a real registration on the wire.

    Raises:
        BadRequestException: If the username already exists
    """
    # #283: a 400 here was a clean "this email has an account" oracle. Warn the
    # real owner by email instead of answering the question for the caller.
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        otp_service.send_registration_attempt_email(existing.email)
        return _decoy_user(user_data)

    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise BadRequestException("Este nombre de usuario ya está en uso. Elegí otro.")

    # Create new user. Registration never proves control of the inbox, so no
    # account starts out verified (#280) — only otp_service.verify_otp sets
    # email_verified, and everything stamped here is re-collected there when
    # the real owner first signs in.
    now = datetime.now(timezone.utc)
    hashed_password = get_password_hash(user_data.password) if user_data.password else ""
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        email_verified=False,
        terms_accepted_at=now,
        privacy_accepted_at=now,
        age_confirmed_at=now,
        legal_consent_version=settings.LEGAL_CONSENT_VERSION,
        marketing_opt_in=user_data.marketing_opt_in,
        marketing_opt_in_at=now if user_data.marketing_opt_in else None,
        pending_referral_code=user_data.referral_code,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def _decoy_user(user_data: UserCreate) -> User:
    """Build an in-memory User that serializes exactly like a fresh registration.

    Never added to the session: it exists only so /register answers the same
    way for a taken email as for a new one (#283).
    """
    now = datetime.now(timezone.utc)
    return User(
        id=uuid.uuid4(),
        email=user_data.email,
        username=user_data.username,
        hashed_password="",
        points=1000.0,
        role="user",
        email_verified=False,
        terms_accepted_at=now,
        privacy_accepted_at=now,
        age_confirmed_at=now,
        legal_consent_version=settings.LEGAL_CONSENT_VERSION,
        marketing_opt_in=user_data.marketing_opt_in,
        marketing_opt_in_at=now if user_data.marketing_opt_in else None,
        cookie_consent_analytics=False,
        cookie_consent_functional=False,
        cookie_consent_marketing=False,
        created_at=now,
    )


def _burn_password_verification(password: str) -> None:
    """Spend the same bcrypt work a real password check would cost (#283)."""
    global _dummy_password_hash
    if _dummy_password_hash is None:
        _dummy_password_hash = get_password_hash("timing-equalizer")
    verify_password(password, _dummy_password_hash)


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

    if not user or not user.hashed_password:
        _burn_password_verification(password)
        raise UnauthorizedException("Invalid email or password")

    if not verify_password(password, user.hashed_password):
        raise UnauthorizedException("Invalid email or password")

    if user.deleted_at is not None:
        raise UnauthorizedException("Invalid email or password")

    if not user.email_verified:
        raise BadRequestException(
            "Confirmá tu email antes de iniciar sesión. Revisá el código que te enviamos."
        )

    if not user.is_active:
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
