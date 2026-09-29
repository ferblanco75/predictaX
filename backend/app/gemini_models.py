DEFAULT_GEMINI_MODEL = "gemini-3.6-flash"

# The whitelist exists to reject *retired* models (gemini-2.5-flash and older),
# which would pass startup and only fail at the first API call. It is not a
# health check: 3.7 and 3.8 answer 503 "high demand" as of 2026-09-29, but the
# API still serves them, so they stay listed and 3.6 is the default (#274).
SUPPORTED_GEMINI_MODELS = frozenset({
    DEFAULT_GEMINI_MODEL,
    "gemini-3.8-flash",
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
