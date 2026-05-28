import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.models.otp_code import OTPCode
from app.models.user import User

logger = logging.getLogger(__name__)

_resend_client = None


def _get_resend():
    global _resend_client
    if _resend_client is None and settings.RESEND_API_KEY:
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            _resend_client = resend
        except ImportError:
            logger.warning("resend package not installed — email sending disabled")
    return _resend_client


def _generate_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"


def _send_otp_email(email: str, code: str) -> bool:
    """Send OTP code via Resend. Returns True on success, False if not configured."""
    resend = _get_resend()
    if not resend:
        logger.warning("RESEND_API_KEY not set — OTP code for %s: %s", email, code)
        return False

    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="font-size:24px;font-weight:700;color:#1d4ed8;margin-bottom:8px">NeuroPredict</h2>
      <p style="color:#374151;margin-bottom:24px">Tu código de acceso es:</p>
      <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
        <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#111827">{code}</span>
      </div>
      <p style="color:#6b7280;font-size:14px">Este código expira en {settings.OTP_EXPIRE_MINUTES} minutos.</p>
      <p style="color:#6b7280;font-size:14px">Si no solicitaste este código, podés ignorar este email.</p>
    </div>
    """

    try:
        resend.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": [email],
            "subject": f"{code} — Tu código de NeuroPredict",
            "html": html,
        })
        return True
    except Exception as exc:
        logger.error("Failed to send OTP email to %s: %s", email, exc)
        return False


def request_otp(db: Session, email: str) -> dict:
    """
    Generate and send a new OTP code for the given email.

    - Invalidates any previous unused codes for this email.
    - Does NOT require the email to exist (creates user on verify if needed).
    - Returns metadata for the frontend (email_sent bool for dev fallback awareness).
    """
    email = email.strip().lower()

    # Invalidate previous active codes for this email
    db.query(OTPCode).filter(
        OTPCode.email == email,
        OTPCode.used == False,  # noqa: E712
    ).update({"used": True})

    code = _generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    otp = OTPCode(
        email=email,
        code=code,
        expires_at=expires_at,
    )
    db.add(otp)
    db.commit()

    email_sent = _send_otp_email(email, code)

    return {
        "email": email,
        "email_sent": email_sent,
        "expires_in_minutes": settings.OTP_EXPIRE_MINUTES,
    }


def verify_otp(db: Session, email: str, code: str) -> User:
    """
    Verify OTP code and return (or create) the associated user.

    Raises BadRequestException on invalid/expired/max-attempts code.
    Returns the User on success.
    """
    email = email.strip().lower()
    code = code.strip()

    otp = (
        db.query(OTPCode)
        .filter(
            OTPCode.email == email,
            OTPCode.used == False,  # noqa: E712
        )
        .order_by(OTPCode.created_at.desc())
        .first()
    )

    if not otp:
        raise BadRequestException("Código inválido o expirado")

    # Check expiry
    if datetime.now(timezone.utc) > otp.expires_at:
        otp.used = True
        db.commit()
        raise BadRequestException("El código expiró. Solicitá uno nuevo")

    # Check max attempts
    if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
        otp.used = True
        db.commit()
        raise BadRequestException("Demasiados intentos fallidos. Solicitá un nuevo código")

    # Verify code
    if otp.code != code:
        otp.attempts += 1
        db.commit()
        remaining = settings.OTP_MAX_ATTEMPTS - otp.attempts
        raise UnauthorizedException(
            f"Código incorrecto. {remaining} intento{'s' if remaining != 1 else ''} restante{'s' if remaining != 1 else ''}"
        )

    # Mark as used
    otp.used = True
    db.commit()

    # Get or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        username = _derive_username(db, email)
        user = User(
            email=email,
            username=username,
            hashed_password="",  # OTP users have no password
            points=1000.0,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def _derive_username(db: Session, email: str) -> str:
    """Derive a unique username from an email address."""
    base = email.split("@")[0]
    # Keep only alphanumeric, underscore, hyphen; truncate to 25 chars
    base = "".join(c for c in base if c.isalnum() or c in "_-")[:25] or "user"

    candidate = base
    counter = 1
    while db.query(User).filter(User.username == candidate).first():
        candidate = f"{base}{counter}"
        counter += 1

    return candidate
