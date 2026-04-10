import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.config import settings
from app.routers import auth, markets, predictions, users, admin
from app.schemas.common import HealthResponse
from app.core.tracking import log_activity
import logging

try:
    from prometheus_fastapi_instrumentator import Instrumentator
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="PredictaX API",
    description="Prediction markets platform for Latin America",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request tracking middleware
class TrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        elapsed_ms = int((time.time() - start) * 1000)

        # Only track API calls, skip health checks and static files
        path = request.url.path
        if path.startswith("/api/") and path != "/api/health" and not path.startswith("/api/docs"):
            log_activity(
                action="api_request",
                endpoint=f"{request.method} {path}",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent", "")[:500],
                response_time_ms=elapsed_ms,
                status_code=response.status_code,
            )
        return response

app.add_middleware(TrackingMiddleware)

# Prometheus metrics at /api/metrics
if PROMETHEUS_AVAILABLE:
    Instrumentator(
        excluded_handlers=["/api/metrics", "/api/docs", "/api/redoc"],
    ).instrument(app).expose(app, endpoint="/api/metrics", include_in_schema=False)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(markets.router, prefix="/api/markets", tags=["Markets"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(admin.router)  # prefix defined in router


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


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info(f"Shutting down {settings.APP_NAME}")
