from typing import Any, Optional
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def success_response(data: Any = None, status_code: int = 200) -> JSONResponse:
    """Format standard API success response with jsonable encoding."""
    encoded_data = jsonable_encoder(data) if data is not None else {}
    content = {
        "success": True,
        "data": encoded_data,
    }
    return JSONResponse(status_code=status_code, content=content)


def error_response(
    code: str,
    message: str,
    status_code: int = 400,
    details: Optional[Any] = None,
) -> JSONResponse:
    """Format standard API error response with jsonable encoding."""
    encoded_details = jsonable_encoder(details) if details is not None else []
    content = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": encoded_details,
        },
    }
    return JSONResponse(status_code=status_code, content=content)
