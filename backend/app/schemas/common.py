from pydantic import BaseModel
from typing import Optional


class ErrorResponse(BaseModel):
    """Schema for error responses"""

    error: str
    detail: Optional[str] = None


class SuccessResponse(BaseModel):
    """Schema for success responses"""

    success: bool
    message: str


class HealthResponse(BaseModel):
    """Schema for health check response"""

    status: str
    version: str = "0.1.0"
