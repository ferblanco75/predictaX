"""Regression tests for #254 finding 2: placeholder/short SECRET_KEY must be rejected.

#284 extends this: the constant used to name a value no .env.example ever
shipped, so the real published placeholder is read from the file here instead
of being retyped — and DEBUG can no longer switch every check off in
production.
"""

from pathlib import Path

import pytest
from pydantic import ValidationError

from app.config import _SECRET_KEY_PLACEHOLDERS, Settings

ENV_EXAMPLE = Path(__file__).resolve().parents[1] / ".env.example"


def _env_example_secret_key() -> str:
    for line in ENV_EXAMPLE.read_text().splitlines():
        if line.startswith("SECRET_KEY="):
            return line.split("=", 1)[1].strip()
    raise AssertionError("No SECRET_KEY line in .env.example")


def _base_kwargs(**overrides) -> dict:
    kwargs = {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/db",
        "SECRET_KEY": "a" * 40,
        "DEBUG": False,
        "RENDER": False,
    }
    kwargs.update(overrides)
    return kwargs


@pytest.mark.parametrize("placeholder", sorted(_SECRET_KEY_PLACEHOLDERS))
def test_startup_fails_with_placeholder_secret_key_in_production(placeholder):
    with pytest.raises(ValidationError, match="placeholder"):
        Settings(**_base_kwargs(SECRET_KEY=placeholder))


def test_env_example_secret_key_is_rejected_in_production():
    """The value people actually copy must be rejected as a placeholder, not
    only saved by happening to be shorter than 32 characters."""
    with pytest.raises(ValidationError, match="placeholder"):
        Settings(**_base_kwargs(SECRET_KEY=_env_example_secret_key()))


def test_startup_fails_with_short_secret_key_in_production():
    with pytest.raises(ValidationError, match="at least 32 characters"):
        Settings(**_base_kwargs(SECRET_KEY="short-key"))


def test_startup_succeeds_with_strong_secret_key_in_production():
    settings = Settings(**_base_kwargs(SECRET_KEY="a" * 32))
    assert settings.SECRET_KEY == "a" * 32


def test_placeholder_secret_key_allowed_in_debug_mode():
    """Local dev shouldn't be forced to generate a real key."""
    settings = Settings(**_base_kwargs(SECRET_KEY=_env_example_secret_key(), DEBUG=True))
    assert settings.DEBUG is True


def test_debug_alongside_production_marker_fails_startup():
    """#284: DEBUG=True turned off the SECRET_KEY checks, HSTS, the docs guard
    and the RESEND_API_KEY requirement all at once. Render sets RENDER itself,
    so the combination must not boot."""
    with pytest.raises(ValidationError, match="DEBUG cannot be enabled"):
        Settings(**_base_kwargs(DEBUG=True, RENDER=True))
