"""
API routers for PredictaX.
"""

from app.routers import admin, auth, markets, predictions, users

__all__ = [
    "auth",
    "markets",
    "predictions",
    "users",
    "admin",
]
