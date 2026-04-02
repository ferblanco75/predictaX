"""
API routers for PredictaX.
"""

from app.routers import auth
from app.routers import markets
from app.routers import predictions
from app.routers import users

__all__ = [
    "auth",
    "markets",
    "predictions",
    "users",
]
