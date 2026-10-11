DEFAULT_GEMINI_MODEL = "gemini-3.8-flash"

# The whitelist exists to reject models the API no longer serves, which would
# otherwise pass startup and only fail on the first call. It is not a health
# check and not a deprecation list: Google deprecated gemini-3.7-flash and
# gemini-3.5-flash on 2026-10-08 (requests route to 3.8 and 3.6 respectively),
# and gemini-3.6-flash retires 2026-11-19 — but all of them still answer today,
# so they stay accepted and an existing deployment does not break at startup.
# What moves forward is the default. See GEMINI_FALLBACK_MODELS in config.py.
SUPPORTED_GEMINI_MODELS = frozenset({
    DEFAULT_GEMINI_MODEL,
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
})


def validate_gemini_model(value: str) -> str:
    model = value.strip()
    if model not in SUPPORTED_GEMINI_MODELS:
        supported = ", ".join(sorted(SUPPORTED_GEMINI_MODELS, reverse=True))
        raise ValueError(f"Unsupported GEMINI_MODEL '{model}'. Supported models: {supported}")
    return model
