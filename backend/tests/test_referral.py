from fastapi.testclient import TestClient

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


def _auth_header(client: TestClient, email: str, password: str) -> dict:
    resp = client.post(LOGIN_URL, json={"email": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_referral_endpoint_generates_code(client: TestClient):
    client.post(REGISTER_URL, json=REFERRER_DATA)
    headers = _auth_header(client, REFERRER_DATA["email"], REFERRER_DATA["password"])

    resp = client.get(REFERRAL_URL, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["referral_code"].startswith("NEURO-")
    assert len(data["referral_code"]) == 12
    assert data["referred_count"] == 0
    assert data["points_earned"] == 0


def test_referral_code_is_stable(client: TestClient):
    client.post(REGISTER_URL, json=REFERRER_DATA)
    headers = _auth_header(client, REFERRER_DATA["email"], REFERRER_DATA["password"])

    code1 = client.get(REFERRAL_URL, headers=headers).json()["referral_code"]
    code2 = client.get(REFERRAL_URL, headers=headers).json()["referral_code"]
    assert code1 == code2


def test_register_with_valid_referral_code(client: TestClient):
    # Referrer registers and gets code
    client.post(REGISTER_URL, json=REFERRER_DATA)
    headers = _auth_header(client, REFERRER_DATA["email"], REFERRER_DATA["password"])
    code = client.get(REFERRAL_URL, headers=headers).json()["referral_code"]

    # Referred registers with code
    resp = client.post(REGISTER_URL, json={**REFERRED_DATA, "referral_code": code})
    assert resp.status_code == 201
    # Referred gets 100 bonus (1000 default + 100 bonus)
    assert resp.json()["points"] == 1100.0


def test_register_with_invalid_referral_code_still_works(client: TestClient):
    resp = client.post(REGISTER_URL, json={**REFERRER_DATA, "referral_code": "INVALID-CODE"})
    assert resp.status_code == 201
    # No bonus, just default points
    assert resp.json()["points"] == 1000.0


def test_referrer_sees_referred_count(client: TestClient):
    # Referrer registers and gets code
    client.post(REGISTER_URL, json=REFERRER_DATA)
    headers = _auth_header(client, REFERRER_DATA["email"], REFERRER_DATA["password"])
    code = client.get(REFERRAL_URL, headers=headers).json()["referral_code"]

    # Referred registers with code
    client.post(REGISTER_URL, json={**REFERRED_DATA, "referral_code": code})

    # Referrer checks stats
    stats = client.get(REFERRAL_URL, headers=headers).json()
    assert stats["referred_count"] == 1
    # Referrer bonus not yet awarded (referred hasn't predicted)
    assert stats["points_earned"] == 0