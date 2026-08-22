from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception with standardized code and response shape."""

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[List[Dict[str, Any]]] = None,
    ):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.message = message
        self.details = details or []


class AuthInvalidCredentialsException(AppException):
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(
            code="AUTH_INVALID_CREDENTIALS",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class AuthEmailNotVerifiedException(AppException):
    def __init__(self, message: str = "Email address is not verified"):
        super().__init__(
            code="AUTH_EMAIL_NOT_VERIFIED",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "You do not have permission to access this resource"):
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            code="NOT_FOUND",
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ValidationException(AppException):
    def __init__(self, message: str, details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class AttendanceAlreadyCheckedInException(AppException):
    def __init__(self, message: str = "Employee has already checked in for today"):
        super().__init__(
            code="ATTENDANCE_ALREADY_CHECKED_IN",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class AttendanceAlreadyCheckedOutException(AppException):
    def __init__(self, message: str = "Employee has already checked out for today"):
        super().__init__(
            code="ATTENDANCE_ALREADY_CHECKED_OUT",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class AttendanceCheckoutBeforeCheckinException(AppException):
    def __init__(self, message: str = "Cannot check out without an active check-in record"):
        super().__init__(
            code="ATTENDANCE_CHECKOUT_BEFORE_CHECKIN",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class LeaveInsufficientBalanceException(AppException):
    def __init__(self, message: str = "Insufficient leave balance for requested leave type"):
        super().__init__(
            code="LEAVE_INSUFFICIENT_BALANCE",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class LeaveOverlappingRequestException(AppException):
    def __init__(self, message: str = "An overlapping leave request already exists for these dates"):
        super().__init__(
            code="LEAVE_OVERLAPPING_REQUEST",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class LeaveNotPendingException(AppException):
    def __init__(self, message: str = "Only pending leave requests can be reviewed"):
        super().__init__(
            code="LEAVE_NOT_PENDING",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class LeaveReviewCommentRequiredException(AppException):
    def __init__(self, message: str = "Reviewer comment is required when rejecting a leave request"):
        super().__init__(
            code="LEAVE_REVIEW_COMMENT_REQUIRED",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class PayrollForbiddenException(AppException):
    def __init__(self, message: str = "Employees are not authorized to modify payroll records"):
        super().__init__(
            code="PAYROLL_FORBIDDEN",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class AiUnavailableException(AppException):
    def __init__(self, message: str = "AI service is currently unavailable. Please try again later."):
        super().__init__(
            code="AI_UNAVAILABLE",
            message=message,
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class RateLimitedException(AppException):
    def __init__(self, message: str = "Rate limit exceeded. Please try again later."):
        super().__init__(
            code="RATE_LIMITED",
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )


class InternalErrorException(AppException):
    def __init__(self, message: str = "An unexpected internal server error occurred"):
        super().__init__(
            code="INTERNAL_ERROR",
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
