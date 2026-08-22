import uuid
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.db.enums import Role, AttendanceStatus
from app.db.models.profile import Profile
from app.db.session import get_db
from app.schemas.attendance import (
    CheckInRequest,
    CheckOutRequest,
    AttendanceRecordResponse,
)
from app.services.attendance_service import AttendanceService
from app.utils.response_formatter import success_response

router = APIRouter(prefix="", tags=["Attendance"])


@router.post("/attendance/check-in", status_code=status.HTTP_201_CREATED)
async def check_in(
    req: Optional[CheckInRequest] = None,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notes = req.notes if req else None
    record = await AttendanceService.check_in(db, current_user, notes=notes)
    resp = AttendanceRecordResponse.model_validate(record)
    return success_response(data=resp.model_dump(), status_code=status.HTTP_201_CREATED)


@router.post("/attendance/check-out")
async def check_out(
    req: Optional[CheckOutRequest] = None,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notes = req.notes if req else None
    record = await AttendanceService.check_out(db, current_user, notes=notes)
    resp = AttendanceRecordResponse.model_validate(record)
    return success_response(data=resp.model_dump())


@router.get("/attendance/me")
async def get_my_attendance(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    records = await AttendanceService.get_my_attendance(
        db, current_user.id, start_date=start_date, end_date=end_date
    )
    data = [AttendanceRecordResponse.model_validate(r).model_dump() for r in records]
    return success_response(data=data)


@router.get("/attendance/me/daily")
async def get_my_daily_attendance(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await AttendanceService.get_daily_attendance(db, current_user.id)
    data = AttendanceRecordResponse.model_validate(record).model_dump() if record else None
    return success_response(data=data)


@router.get("/attendance/me/weekly")
async def get_my_weekly_attendance(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    summary = await AttendanceService.get_weekly_attendance(db, current_user.id)
    return success_response(data=summary.model_dump())


@router.get("/admin/attendance")
async def admin_get_all_attendance(
    employee_id: Optional[uuid.UUID] = Query(None),
    attendance_date: Optional[date] = Query(None),
    status: Optional[AttendanceStatus] = Query(None),
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    records = await AttendanceService.admin_get_attendance(
        db, employee_id=employee_id, attendance_date=attendance_date, status=status
    )
    data = [AttendanceRecordResponse.model_validate(r).model_dump() for r in records]
    return success_response(data=data)


@router.get("/admin/attendance/{employee_id}")
async def admin_get_employee_attendance(
    employee_id: uuid.UUID,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    records = await AttendanceService.get_my_attendance(
        db, employee_id, start_date=start_date, end_date=end_date
    )
    data = [AttendanceRecordResponse.model_validate(r).model_dump() for r in records]
    return success_response(data=data)
