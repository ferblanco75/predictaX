from fastapi.security import HTTPAuthorizationCredentials

from app.dependencies import get_current_user_optional


def test_get_current_user_optional_no_credentials_returns_none(db):
    result = get_current_user_optional(credentials=None, db=db)
    assert result is None


def test_get_current_user_optional_invalid_token_returns_none(db):
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="not-a-valid-token")
    result = get_current_user_optional(credentials=credentials, db=db)
    assert result is None


def test_get_current_user_optional_valid_token_returns_user(db, registered_user, user_token):
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=user_token)
    result = get_current_user_optional(credentials=credentials, db=db)
    assert result is not None
    assert str(result.id) == registered_user["id"]


def test_get_current_user_optional_inactive_user_returns_none(db, registered_user, user_token):
    from app.models.user import User

    user = db.query(User).filter(User.id == registered_user["id"]).first()
    user.is_active = False
    db.commit()

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=user_token)
    result = get_current_user_optional(credentials=credentials, db=db)
    assert result is None
