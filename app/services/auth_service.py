import uuid
from typing import Any, Dict
import httpx
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    AuthInvalidCredentialsException,
    ValidationException,
    NotFoundException,
)
from app.core.security import create_access_token
from app.db.enums import Role
from app.db.models.profile import Profile
from app.db.models.leave import LeaveType, LeaveBalance
from app.db.models.notification import Notification
from app.schemas.auth import SignupRequest, LoginRequest, AuthTokenData, UserProfileSummary
from app.services.email_service import EmailService


class AuthService:

    @staticmethod
    async def signup(db: AsyncSession, req: SignupRequest) -> AuthTokenData:

        stmt_email = select(Profile).where(func.lower(Profile.email) == req.email.lower())
        res_email = await db.execute(stmt_email)
        if res_email.scalar_one_or_none():
            raise ValidationException(f"User with email '{req.email}' already exists")

        stmt_emp = select(Profile).where(Profile.employee_id == req.employee_id)
        res_emp = await db.execute(stmt_emp)
        if res_emp.scalar_one_or_none():
            raise ValidationException(f"Employee ID '{req.employee_id}' is already registered")

        auth_user_id = uuid.uuid4()

        # Handle account profile creation directly in PostgreSQL database to prevent Supabase default email bounce-backs
        profile = Profile(
            auth_user_id=auth_user_id,
            employee_id=req.employee_id,
            role=Role.EMPLOYEE,
            full_name=req.full_name,
            email=req.email,
            phone=req.phone,
            department_id=req.department_id,
            job_title=req.job_title,
            is_active=True,
            is_email_verified=False,
        )
        db.add(profile)
        await db.flush()

        stmt_types = select(LeaveType).where(LeaveType.is_active == True)
        res_types = await db.execute(stmt_types)
        leave_types = res_types.scalars().all()

        current_year = 2026
        for lt in leave_types:
            balance = LeaveBalance(
                employee_id=profile.id,
                leave_type_id=lt.id,
                year=current_year,
                allocated_days=lt.default_days_per_year,
                used_days=0,
                remaining_days=lt.default_days_per_year,
            )
            db.add(balance)

        # Automatic Welcome Notification for Newly Registered Employee
        welcome_notif = Notification(
            recipient_id=profile.id,
            type="SYSTEM_ALERT",
            title="Welcome to DayFlow AI!",
            message=f"Welcome {profile.full_name}! Your employee account has been created. Explore shift clocking, time-off requests, and AI policy assistance from your portal.",
            is_read=False,
        )
        db.add(welcome_notif)

        await db.commit()
        await db.refresh(profile)

        # Dispatch live outbound email via EmailService (if custom SMTP is set in .env)
        origin = settings.CORS_ORIGINS[0] if isinstance(settings.CORS_ORIGINS, list) and settings.CORS_ORIGINS else "http://localhost:5173"
        verify_url = f"{origin}/login?verify_email={profile.email}"
        await EmailService.send_verification_email(
            to_email=profile.email,
            full_name=profile.full_name,
            verify_url=verify_url,
        )

        token = create_access_token(
            data={
                "sub": str(profile.auth_user_id),
                "email": profile.email,
                "role": profile.role.value,
            }
        )

        return AuthTokenData(
            access_token=token,
            user=UserProfileSummary.model_validate(profile),
        )

    @staticmethod
    async def login(db: AsyncSession, req: LoginRequest) -> AuthTokenData:
        stmt = select(Profile).where(func.lower(Profile.email) == req.email.lower())
        res = await db.execute(stmt)
        profile = res.scalar_one_or_none()

        if not profile:
            raise AuthInvalidCredentialsException("Invalid email or password")

        if not profile.is_active:
            raise AuthInvalidCredentialsException("Account is disabled")

        if not profile.is_email_verified:
            raise AuthInvalidCredentialsException("Email not verified. Please check your inbox and verify your email before logging in.")

        token = create_access_token(
            data={
                "sub": str(profile.auth_user_id),
                "email": profile.email,
                "role": profile.role.value,
            }
        )

        return AuthTokenData(
            access_token=token,
            user=UserProfileSummary.model_validate(profile),
        )

    @staticmethod
    async def verify_email(db: AsyncSession, email: str) -> bool:
        stmt = select(Profile).where(func.lower(Profile.email) == email.lower())
        res = await db.execute(stmt)
        profile = res.scalar_one_or_none()

        if not profile:
            raise NotFoundException("User account not found")

        profile.is_email_verified = True
        await db.commit()
        return True
