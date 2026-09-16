from fastapi.testclient import TestClient

from app.models.user import User

REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
REFERRAL_URL = "/api/users/me/referral"

REFERRER_DATA = {
    "email": "referrer@predictax.com",
    "username": "referrer",
    "password": "securepass123",
    "terms_accepted": True,
    "privacy_accepted": True,
    "is_adult": True,
}

REFERRED_DATA = {
    "email": "referred@predictax.com",
    "username": "referred",
    "password": "securepass123",
    "terms_accepted": True,
    "privacy_accepted": True,
    "is_adult": True,
}


def _verify_email(db, email: str) -> None:
    user = db.query(User).filter(User.email == email).first()
    user.email_verified = True
    db.commit()


def _claim_via_otp(client: TestClient, db, monkeypatch, email: str) -> None:
    """Complete the OTP flow, which is what turns a pending referral code into
    a real referral row (#280)."""
    from app.services import otp_service

    monkeypatch.setattr(otp_service, "_send_otp_email", lambda email, code: True)
    client.post("/api/auth/otp/request", json={"email": email})
    otp = (
        db.query(otp_service.OTPCode)
        .filter(otp_service.OTPCode.email == email)
        .order_by(otp_service.OTPCode.created_at.desc())
        .first()
    )
    response = client.post("/api/auth/otp/verify", json={"email": email, "code": otp.code})
    assert response.status_code == 200


def _auth_header(client: TestClient, email: str, password: str) -> dict:
    resp = client.post(LOGIN_URL, json={"email": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_referral_endpoint_generates_code(client: TestClient, db):
    client.post(REGISTER_URL, json=REFERRER_DATA)
    _verify_email(db, REFERRER_DATA["email"])
    headers = _auth_header(client, REFERRER_DATA["email"], REFERRER_DATA["password"])

    resp = client.get(REFERRAL_URL, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["referral_code"].startswith("NEURO-")
    assert len(data["referral_code"]) == 12
    assert data["referred_count"] == 0
    assert data["points_earned"] == 0


def test_referral_code_is_stable(client: TestClient, db):
    client.post(REGISTER_URL, json=REFERRER_DATA)
    _verify_email(db, REFERRER_DATA["email"])
    headers = _auth_header(client, REFERRER_DATA["email"], REFERRER_DATA["password"])

    code1 = client.get(REFERRAL_URL, headers=headers).json()["referral_code"]
    code2 = client.get(REFERRAL_URL, headers=headers).json()["referral_code"]
    assert code1 == code2


def test_register_with_valid_referral_code(client: TestClient, db, monkeypatch):
    # Referrer registers and gets code
    client.post(REGISTER_URL, json=REFERRER_DATA)
    _verify_email(db, REFERRER_DATA["email"])
    headers = _auth_header(client, REFERRER_DATA["email"], REFERRER_DATA["password"])
    code = client.get(REFERRAL_URL, headers=headers).json()["referral_code"]

    # Referred registers with code — the bonus waits for verification (#280)
    resp = client.post(REGISTER_URL, json={**REFERRED_DATA, "referral_code": code})
    assert resp.status_code == 201
    assert resp.json()["points"] == 1000.0

    # Referred gets 100 bonus (1000 default + 100 bonus) once verified
    _claim_via_otp(client, db, monkeypatch, REFERRED_DATA["email"])
    referred = db.query(User).filter(User.email == REFERRED_DATA["email"]).first()
    assert referred.points == 1100.0


def test_register_with_invalid_referral_code_still_works(client: TestClient):
    resp = client.post(REGISTER_URL, json={**REFERRER_DATA, "referral_code": "INVALID-CODE"})
    assert resp.status_code == 201
    # No bonus, just default points
    assert resp.json()["points"] == 1000.0


def test_referrer_sees_referred_count(client: TestClient, db, monkeypatch):
    # Referrer registers and gets code
    client.post(REGISTER_URL, json=REFERRER_DATA)
    _verify_email(db, REFERRER_DATA["email"])
    headers = _auth_header(client, REFERRER_DATA["email"], REFERRER_DATA["password"])
    code = client.get(REFERRAL_URL, headers=headers).json()["referral_code"]

    # Referred registers with code and claims the account
    client.post(REGISTER_URL, json={**REFERRED_DATA, "referral_code": code})
    _claim_via_otp(client, db, monkeypatch, REFERRED_DATA["email"])

    # Referrer checks stats
    stats = client.get(REFERRAL_URL, headers=headers).json()
    assert stats["referred_count"] == 1
    # Referrer bonus not yet awarded (referred hasn't predicted)
    assert stats["points_earned"] == 0