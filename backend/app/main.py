import logging
import time

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings
from app.core.tracking import log_activity
from app.routers import admin, auth, chatbot, football, markets, predictions, users
from app.schemas.common import HealthResponse

try:
    from prometheus_fastapi_instrumentator import Instrumentator
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


MAX_REQUEST_BODY_BYTES = 1 * 1024 * 1024  # 1 MB


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject oversized request bodies before they reach route handlers.

    #260: Starlette reads the full body into memory before Pydantic
    validates anything, so a ChatRequest's max_length constraints don't
    protect against a multi-hundred-MB POST — that alone can exhaust
    Render's free-tier 512MB container.

    This checks the declared Content-Length only — cheap, and covers any
    honest client. It does not defend against a request that lies about its
    length and streams more bytes than declared; consuming the stream
    ourselves to catch that reliably requires rewriting this as raw ASGI
    middleware instead of BaseHTTPMiddleware (which mangles the body for
    downstream handlers when you touch request._receive). Left as-is for
    now — Render's own proxy also caps request size ahead of this process.
    """

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                if int(content_length) > MAX_REQUEST_BODY_BYTES:
                    return Response(status_code=413, content="Request body too large")
            except ValueError:
                pass

        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add conservative security headers to API responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )
        response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"

        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains; preload"
            )

        return response

# Create FastAPI app — disable Swagger/OpenAPI docs in production
app = FastAPI(
    title="NeuroPredict API",
    description="Prediction markets platform for Latin America",
    version="0.1.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
)

# CORS configuration for frontend
# Allow all Vercel preview deployments via regex pattern
cors_origins = settings.CORS_ORIGINS
cors_origin_regex = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(BodySizeLimitMiddleware)

TRACKING_EXACT_EXCLUDES = {"/api/health", "/api/metrics", "/api/openapi.json"}
TRACKING_PREFIX_EXCLUDES = (
    "/api/docs",
    "/api/redoc",
    "/api/admin/metrics",
    "/api/admin/ai/usage",
    "/api/admin/activity",
    "/api/chatbot",
)


def should_track_api_request(path: str) -> bool:
    """Return whether an API path should be stored in activity_log."""
    if not path.startswith("/api/"):
        return False
    if path in TRACKING_EXACT_EXCLUDES:
        return False
    return not path.startswith(TRACKING_PREFIX_EXCLUDES)


# Request tracking middleware
class TrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        elapsed_ms = int((time.time() - start) * 1000)

        path = request.url.path
        if should_track_api_request(path):
            # #260: log_activity() is synchronous (opens a DB session,
            # inserts, commits) — running it inline here blocked the event
            # loop and held a second pool connection for the whole request.
            # Deferring it to a BackgroundTask lets the response return
            # first; the insert then runs after the client has the reply.
            existing_task = response.background
            log_task = BackgroundTask(
                log_activity,
                action="api_request",
                endpoint=f"{request.method} {path}",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent", "")[:500],
                response_time_ms=elapsed_ms,
                status_code=response.status_code,
            )
            if existing_task is not None:
                async def _run_both(current=existing_task, tracking=log_task):
                    await current()
                    await tracking()

                response.background = BackgroundTask(_run_both)
            else:
                response.background = log_task
        return response

app.add_middleware(TrackingMiddleware)

# Prometheus metrics at /api/metrics. Disabled by default in production.
if PROMETHEUS_AVAILABLE and settings.METRICS_ENABLED:
    Instrumentator(
        excluded_handlers=["/api/metrics", "/api/docs", "/api/redoc"],
    ).instrument(app).expose(app, endpoint="/api/metrics", include_in_schema=False)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(markets.router, prefix="/api/markets", tags=["Markets"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(chatbot.router, prefix="/api/chatbot", tags=["Chatbot"])
app.include_router(admin.router)  # prefix defined in router
app.include_router(football.router)  # prefix defined in router


@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """
    Health check endpoint.

    Returns:
        Health status
    """
    return HealthResponse(status="healthy", version="0.1.0")


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info(f"Starting {settings.APP_NAME}")
    logger.info(f"Environment: {'Production' if not settings.DEBUG else 'Development'}")
    logger.info(f"CORS Origins: {settings.CORS_ORIGINS}")

    if not settings.DEBUG and not settings.RESEND_API_KEY:
        raise RuntimeError(
            "RESEND_API_KEY is not set. Refusing to start in production without email "
            "delivery configured — OTP codes must never fall back to being logged."
        )


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info(f"Shutting down {settings.APP_NAME}")
