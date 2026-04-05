"""
API routers for PredictaX.
"""

from app.routers import auth
from app.routers import markets
from app.routers import predictions
from app.routers import users
from app.routers import admin

__all__ = [
    "auth",
    "markets",
    "predictions",
    "users",
    "admin",
]
