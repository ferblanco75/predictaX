DEFAULT_GEMINI_MODEL = "gemini-flash-latest"

# The whitelist rejects models the API no longer serves, which would otherwise
# pass startup and only fail on the first call. It is not a health check and
# not a deprecation list.
#
# The default is an **alias**. Pinning a version put this project on a treadmill
# it kept losing: it ran gemini-3.7-flash through its 2026-10-08 deprecation
# without noticing, then gemini-3.6-flash, which retires 2026-11-19. An alias
# cannot be deprecated out from under us, and the response carries
# modelVersion, so ai_usage_log still records the version that answered.
#
# Pinned versions stay accepted — including the deprecated ones — so an
# existing deployment does not fail at startup the moment this merges.
SUPPORTED_GEMINI_MODELS = frozenset({
    DEFAULT_GEMINI_MODEL,
    "gemini-flash-lite-latest",
    "gemini-3.8-flash",
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
