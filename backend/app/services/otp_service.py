import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import BadRequestException, UnauthorizedException
from app.models.otp_code import OTPCode
from app.models.user import User
from app.services import referral_service

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
        logger.warning("RESEND_API_KEY not set — OTP email for %s was not sent", email)
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


def send_registration_attempt_email(email: str) -> bool:
    """Tell the owner that someone tried to register with their address.

    #283: /register used to answer 400 "this email is already registered",
    which enumerated the user base. The answer now goes to the inbox instead
    of to the caller. Returns True on success, False if not configured.
    """
    resend = _get_resend()
    if not resend:
        logger.warning(
            "RESEND_API_KEY not set — registration attempt notice for %s was not sent", email
        )
        return False

    html = """
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h2 style="font-size:24px;font-weight:700;color:#1d4ed8;margin-bottom:8px">NeuroPredict</h2>
      <p style="color:#374151;margin-bottom:16px">
        Alguien intentó crear una cuenta con tu email. Tu cuenta ya existe y no cambió nada.
      </p>
      <p style="color:#374151;margin-bottom:16px">
        Si fuiste vos, iniciá sesión con el código que te enviamos por email.
      </p>
      <p style="color:#6b7280;font-size:14px">
        Si no fuiste vos, podés ignorar este mensaje: nadie puede entrar a tu cuenta sin el
        código que enviamos a esta dirección.
      </p>
    </div>
    """

    try:
        resend.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": [email],
            "subject": "Intento de registro con tu email — NeuroPredict",
            "html": html,
        })
        return True
    except Exception as exc:
        logger.error("Failed to send registration attempt email to %s: %s", email, exc)
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


def verify_otp(
    db: Session,
    email: str,
    code: str,
    terms_accepted: bool | None = None,
    privacy_accepted: bool | None = None,
    is_adult: bool | None = None,
    legal_consent_version: str | None = None,
    signup_ip: str | None = None,
) -> User:
    """
    Verify OTP code and return (or create) the associated user.

    #258: signing up via OTP previously skipped the legal consent that
    /register requires. When this call would create a brand-new account,
    terms_accepted/privacy_accepted/is_adult must all be True — checked
    before the code is consumed, so a user who forgets to tick a box can
    resubmit the same code instead of requesting a new one.

    Raises BadRequestException on invalid/expired/max-attempts code, or on
    missing/incomplete consent for a new signup.
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
        plural = "s" if remaining != 1 else ""
        raise UnauthorizedException(
            f"Código incorrecto. {remaining} intento{plural} restante{plural}"
        )

    # The code is correct — check consent for a new signup BEFORE consuming
    # it, so a missing checkbox doesn't burn a valid code for no reason.
    is_new_user = db.query(User).filter(User.email == email).first() is None
    if is_new_user and not (terms_accepted and privacy_accepted and is_adult):
        raise BadRequestException(
            "Para crear tu cuenta necesitás aceptar los términos, la política de "
            "privacidad y confirmar que sos mayor de edad."
        )

    # Mark as used
    otp.used = True
    db.commit()

    # Get or create user
    user = db.query(User).filter(User.email == email).first()

    if user and (not user.is_active or user.deleted_at is not None):
        raise BadRequestException(
            "Tu cuenta está suspendida. Contactá a soporte: soporte@neuropredict.io"
        )

    if is_new_user:
        now = datetime.now(timezone.utc)
        username = _derive_username(db, email)
        user = User(
            email=email,
            username=username,
            hashed_password="",  # OTP users have no password
            email_verified=True,
            points=1000.0,
            terms_accepted_at=now,
            privacy_accepted_at=now,
            age_confirmed_at=now,
            legal_consent_version=legal_consent_version or settings.LEGAL_CONSENT_VERSION,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.email_verified:
        # #252/#280: this account was created by /register, which proves
        # nothing about who controls the inbox — the real owner may have
        # registered themselves, or an attacker may have pre-registered the
        # address hoping to hijack it. Whoever completes the OTP flow is the
        # real owner, so this is the moment to drop everything the registrant
        # could have forged: any pre-existing password, the marketing opt-in,
        # and the consent stamps, which are re-recorded as of now — the first
        # sign-in this address can actually be attributed to.
        now = datetime.now(timezone.utc)
        user.hashed_password = ""
        user.email_verified = True
        user.marketing_opt_in = False
        user.marketing_opt_in_at = None
        user.terms_accepted_at = now
        user.privacy_accepted_at = now
        user.age_confirmed_at = now
        user.legal_consent_version = legal_consent_version or settings.LEGAL_CONSENT_VERSION
        db.commit()
        referral_service.claim_pending_referral(db, user, signup_ip=signup_ip)
        db.refresh(user)

    return user, is_new_user


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
