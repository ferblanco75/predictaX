"""Regression tests for #254 finding 2: placeholder/short SECRET_KEY must be rejected."""

import pytest
from pydantic import ValidationError

from app.config import Settings


def _base_kwargs(**overrides) -> dict:
    kwargs = {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/db",
        "SECRET_KEY": "a" * 40,
        "DEBUG": False,
    }
    kwargs.update(overrides)
    return kwargs


def test_startup_fails_with_placeholder_secret_key_in_production():
    with pytest.raises(ValidationError, match="placeholder"):
        Settings(**_base_kwargs(SECRET_KEY="your-super-secret-key-change-this"))


def test_startup_fails_with_short_secret_key_in_production():
    with pytest.raises(ValidationError, match="at least 32 characters"):
        Settings(**_base_kwargs(SECRET_KEY="short-key"))


def test_startup_succeeds_with_strong_secret_key_in_production():
    settings = Settings(**_base_kwargs(SECRET_KEY="a" * 32))
    assert settings.SECRET_KEY == "a" * 32


def test_placeholder_secret_key_allowed_in_debug_mode():
    """Local dev shouldn't be forced to generate a real key."""
    settings = Settings(**_base_kwargs(SECRET_KEY="your-super-secret-key-change-this", DEBUG=True))
    assert settings.DEBUG is True
