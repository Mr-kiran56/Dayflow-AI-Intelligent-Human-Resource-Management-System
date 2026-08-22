from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.db.enums import Role
from app.db.models.profile import Profile
from app.db.session import get_db
from app.services.analytics_service import AnalyticsService
from app.utils.response_formatter import success_response

router = APIRouter(prefix="", tags=["Analytics"])


@router.get("/analytics/me/attendance")
async def get_my_attendance_analytics(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await AnalyticsService.get_my_attendance_analytics(db, current_user.id)
    return success_response(data=data)


@router.get("/analytics/me/leave")
async def get_my_leave_analytics(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await AnalyticsService.get_my_leave_analytics(db, current_user.id)
    return success_response(data=data)


@router.get("/admin/analytics/overview")
async def get_admin_overview_analytics(
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    data = await AnalyticsService.get_admin_overview(db)
    return success_response(data=data)


@router.get("/admin/analytics/attendance")
async def get_admin_attendance_analytics(
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    data = await AnalyticsService.get_admin_attendance_analytics(db)
    return success_response(data=data)


@router.get("/admin/analytics/leave")
async def get_admin_leave_analytics(
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    data = await AnalyticsService.get_admin_leave_analytics(db)
    return success_response(data=data)


@router.get("/admin/analytics/payroll")
async def get_admin_payroll_analytics(
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    data = await AnalyticsService.get_admin_payroll_analytics(db)
    return success_response(data=data)
