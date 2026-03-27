from fastapi import HTTPException, status


class NotFoundException(HTTPException):
    """Raised when a resource is not found"""

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class UnauthorizedException(HTTPException):
    """Raised when authentication fails"""

    def __init__(self, detail: str = "Invalid credentials"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenException(HTTPException):
    """Raised when user doesn't have permission"""

    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(HTTPException):
    """Raised for invalid request data"""

    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class InsufficientPointsException(BadRequestException):
    """Raised when user doesn't have enough points"""

    def __init__(self, detail: str = "Insufficient points"):
        super().__init__(detail=detail)
