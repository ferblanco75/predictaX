import pytest
from pydantic import ValidationError

from app.config import Settings
from app.gemini_models import (
    DEFAULT_GEMINI_MODEL,
    SUPPORTED_GEMINI_MODELS,
    validate_gemini_model,
)

BASE_SETTINGS = {
    "DATABASE_URL": "sqlite:///test.db",
    # #284 makes Settings refuse a short SECRET_KEY outside DEBUG, so the tests
    # that build a *valid* Settings need a realistic one.
    "SECRET_KEY": "0" * 32,
    "_env_file": None,
}


def _settings(**overrides):
    return Settings(**BASE_SETTINGS, **overrides)


@pytest.mark.parametrize("model", sorted(SUPPORTED_GEMINI_MODELS))
def test_accepts_supported_gemini_models(model):
    assert validate_gemini_model(model) == model


def test_normalizes_supported_gemini_model():
    assert validate_gemini_model("  gemini-3.7-flash  ") == "gemini-3.7-flash"


@pytest.mark.parametrize("model", ["gemini-2.5-flash", "gemini-2.0-flash", "custom-model"])
def test_rejects_unsupported_gemini_models(model):
    with pytest.raises(ValueError, match="Unsupported GEMINI_MODEL"):
        validate_gemini_model(model)


def test_settings_rejects_retired_gemini_model():
    with pytest.raises(ValidationError, match="Unsupported GEMINI_MODEL"):
        _settings(GEMINI_MODEL="gemini-2.5-flash")


# --- #274: one model per workload -------------------------------------------

def test_both_workloads_default_to_the_same_supported_model():
    settings = _settings()
    assert settings.GEMINI_MODEL_CHAT == DEFAULT_GEMINI_MODEL
    assert settings.GEMINI_MODEL_ANALYSIS == DEFAULT_GEMINI_MODEL


def test_workloads_resolve_to_their_own_setting():
    settings = _settings(
        GEMINI_MODEL_CHAT="gemini-3.8-flash",
        GEMINI_MODEL_ANALYSIS="gemini-3.6-flash",
    )
    assert settings.GEMINI_MODEL_CHAT == "gemini-3.8-flash"
    assert settings.GEMINI_MODEL_ANALYSIS == "gemini-3.6-flash"


@pytest.mark.parametrize("field", ["GEMINI_MODEL_CHAT", "GEMINI_MODEL_ANALYSIS"])
def test_settings_rejects_invalid_workload_model_at_startup(field):
    with pytest.raises(ValidationError, match="Unsupported GEMINI_MODEL"):
        _settings(**{field: "gemini-2.5-flash"})


@pytest.mark.parametrize("field", ["GEMINI_MODEL_CHAT", "GEMINI_MODEL_ANALYSIS"])
def test_settings_normalizes_workload_model(field):
    settings = _settings(**{field: "  gemini-3.8-flash  "})
    assert getattr(settings, field) == "gemini-3.8-flash"


# --- #274: backwards compatibility with the old single GEMINI_MODEL ---------

def test_legacy_gemini_model_seeds_both_workloads():
    settings = _settings(GEMINI_MODEL="gemini-3.5-flash")
    assert settings.GEMINI_MODEL_CHAT == "gemini-3.5-flash"
    assert settings.GEMINI_MODEL_ANALYSIS == "gemini-3.5-flash"


def test_explicit_workload_model_wins_over_legacy():
    settings = _settings(
        GEMINI_MODEL="gemini-3.5-flash",
        GEMINI_MODEL_CHAT="gemini-3.8-flash",
    )
    assert settings.GEMINI_MODEL_CHAT == "gemini-3.8-flash"
    assert settings.GEMINI_MODEL_ANALYSIS == "gemini-3.5-flash"


def test_empty_legacy_gemini_model_is_ignored():
    settings = _settings(GEMINI_MODEL="")
    assert settings.GEMINI_MODEL is None
    assert settings.GEMINI_MODEL_CHAT == DEFAULT_GEMINI_MODEL


def test_legacy_gemini_model_is_logged_as_deprecated(caplog):
    with caplog.at_level("WARNING", logger="app.config"):
        _settings(GEMINI_MODEL="gemini-3.5-flash")
    assert "GEMINI_MODEL is deprecated" in caplog.text
