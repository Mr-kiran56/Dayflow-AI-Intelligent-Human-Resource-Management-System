import uuid
from typing import Any, Dict
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    AuthInvalidCredentialsException,
    ValidationException,
    NotFoundException,
)
from app.core.security import create_access_token
from app.db.models.profile import Profile
from app.db.models.leave import LeaveType, LeaveBalance
from app.schemas.auth import SignupRequest, LoginRequest, AuthTokenData, UserProfileSummary


class AuthService:

    @staticmethod
    async def signup(db: AsyncSession, req: SignupRequest) -> AuthTokenData:

        stmt_email = select(Profile).where(Profile.email == req.email)
        res_email = await db.execute(stmt_email)
        if res_email.scalar_one_or_none():
            raise ValidationException(f"User with email '{req.email}' already exists")

        stmt_emp = select(Profile).where(Profile.employee_id == req.employee_id)
        res_emp = await db.execute(stmt_emp)
        if res_emp.scalar_one_or_none():
            raise ValidationException(f"Employee ID '{req.employee_id}' is already registered")

        auth_user_id = uuid.uuid4()

        if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY and settings.SUPABASE_URL.startswith("https://"):
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"{settings.SUPABASE_URL}/auth/v1/signup",
                        headers={
                            "apikey": settings.SUPABASE_ANON_KEY,
                            "Content-Type": "application/json",
                        },
                        json={
                            "email": req.email,
                            "password": req.password,
                        },
                        timeout=5.0,
                    )
                    if resp.status_code in (200, 201):
                        supa_data = resp.json()
                        supa_user = supa_data.get("user") or {}
                        if supa_user.get("id"):
                            auth_user_id = uuid.UUID(supa_user["id"])
            except Exception:
                pass

        profile = Profile(
            auth_user_id=auth_user_id,
            employee_id=req.employee_id,
            role=req.role,
            full_name=req.full_name,
            email=req.email,
            phone=req.phone,
            department_id=req.department_id,
            job_title=req.job_title,
            is_active=True,
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

        await db.commit()
        await db.refresh(profile)

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
        stmt = select(Profile).where(Profile.email == req.email)
        res = await db.execute(stmt)
        profile = res.scalar_one_or_none()

        if not profile:
            raise AuthInvalidCredentialsException("Invalid email or password")

        if not profile.is_active:
            raise AuthInvalidCredentialsException("Account is disabled")

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
