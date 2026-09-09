from fastapi import Request


def get_client_ip(request: Request) -> str:
    """
    Return the real client IP for rate-limit fingerprinting.

    Uses only `request.client.host` — never a client-controlled header like
    `X-Forwarded-For`, which is trivially spoofable and lets an attacker mint
    a fresh rate-limit bucket on every request (#255). Uvicorn is started
    with `--proxy-headers`, so this reflects the real client IP as forwarded
    by Render's proxy, not the proxy's own address.
    """
    return request.client.host if request.client else "unknown"
