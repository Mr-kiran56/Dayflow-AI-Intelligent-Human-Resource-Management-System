from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1 import (
    ai,
    analytics,
    attendance,
    auth,
    employees,
    leave,
    notifications,
    payroll,
    profile,
    search,
)
from app.core.config import settings
from app.core.exceptions import AppException
from app.db.session import engine
from app.utils.response_formatter import error_response


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.APP_ENV == "production" and (not settings.SUPABASE_JWT_SECRET or settings.SUPABASE_JWT_SECRET == "secret"):
        raise RuntimeError("SUPABASE_JWT_SECRET must be configured securely in production environment")
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent Human Resource Management System Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS
    if isinstance(settings.CORS_ORIGINS, list)
    else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return error_response(
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if settings.DEBUG:
        message = str(exc)
    else:
        message = "An unexpected internal server error occurred"
    return error_response(
        code="INTERNAL_ERROR",
        message=message,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


@app.get("/health", tags=["Health"])
async def health_check():
    """Verify application process health."""
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Verify database connectivity."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "database_error": str(e)},
        )


api_router_v1 = FastAPI()

app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(profile.router, prefix=settings.API_V1_PREFIX)
app.include_router(employees.router, prefix=settings.API_V1_PREFIX)
app.include_router(attendance.router, prefix=settings.API_V1_PREFIX)
app.include_router(leave.router, prefix=settings.API_V1_PREFIX)
app.include_router(payroll.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(search.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
