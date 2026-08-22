import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.enums import Role
from app.db.models.payroll import PayrollRecord
from app.db.models.profile import Profile
from app.db.session import get_db
from app.schemas.payroll import (
    PayrollRecordResponse,
    PayrollCreateRequest,
    PayrollUpdateRequest,
)
from app.services.payroll_service import PayrollService
from app.utils.response_formatter import success_response

router = APIRouter(prefix="", tags=["Payroll"])


@router.get("/payroll/me")
async def get_my_payroll(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    payroll = await PayrollService.get_my_payroll(db, current_user.id)
    data = PayrollRecordResponse.model_validate(payroll).model_dump() if payroll else None
    return success_response(data=data)


@router.get("/payroll/me/history")
async def get_my_payroll_history(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    records = await PayrollService.get_my_payroll_history(db, current_user.id)
    data = [PayrollRecordResponse.model_validate(r).model_dump() for r in records]
    return success_response(data=data)


@router.get("/payroll/me/{payroll_id}")
async def get_my_payroll_by_id(
    payroll_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = await PayrollService.get_payroll_by_id(db, payroll_id)
    if current_user.role not in (Role.ADMIN, Role.HR) and str(record.employee_id) != str(current_user.id):
        raise ForbiddenException("Access denied to another employee's payroll record")
    resp = PayrollRecordResponse.model_validate(record)
    return success_response(data=resp.model_dump())


@router.get("/admin/payroll")
async def admin_get_all_payroll(
    month: Optional[str] = Query(None),
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(PayrollRecord).order_by(PayrollRecord.payroll_month.desc())
    res = await db.execute(stmt)
    records = res.scalars().all()
    data = [PayrollRecordResponse.model_validate(r).model_dump() for r in records]
    return success_response(data=data)


@router.get("/admin/payroll/{employee_id}")
async def admin_get_employee_payroll(
    employee_id: uuid.UUID,
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    records = await PayrollService.get_my_payroll_history(db, employee_id)
    data = [PayrollRecordResponse.model_validate(r).model_dump() for r in records]
    return success_response(data=data)


@router.post("/admin/payroll", status_code=status.HTTP_201_CREATED)
async def admin_create_payroll(
    req: PayrollCreateRequest,
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    record = await PayrollService.create_payroll(db, current_user, req)
    resp = PayrollRecordResponse.model_validate(record)
    return success_response(data=resp.model_dump(), status_code=status.HTTP_201_CREATED)


@router.patch("/admin/payroll/{payroll_id}")
async def admin_update_payroll(
    payroll_id: uuid.UUID,
    req: PayrollUpdateRequest,
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    updated = await PayrollService.update_payroll(db, current_user, payroll_id, req)
    resp = PayrollRecordResponse.model_validate(updated)
    return success_response(data=resp.model_dump())
