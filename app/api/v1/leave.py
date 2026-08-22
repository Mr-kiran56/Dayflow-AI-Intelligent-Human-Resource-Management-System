import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user, require_roles
from app.core.exceptions import NotFoundException, ForbiddenException
from app.db.enums import Role, LeaveStatus
from app.db.models.leave import LeaveType, LeaveBalance, LeaveRequest
from app.db.models.profile import Profile
from app.db.session import get_db
from app.schemas.leave import (
    LeaveTypeResponse,
    LeaveBalanceResponse,
    LeaveRequestCreate,
    LeaveRequestResponse,
    LeaveEligibilityRequest,
    LeaveApprovalRequest,
    LeaveRejectionRequest,
)
from app.services.leave_service import LeaveService
from app.utils.response_formatter import success_response

router = APIRouter(prefix="", tags=["Leave"])


@router.get("/leave/types")
async def get_leave_types(db: AsyncSession = Depends(get_db)):
    stmt = select(LeaveType).where(LeaveType.is_active == True)
    res = await db.execute(stmt)
    types = res.scalars().all()
    data = [LeaveTypeResponse.model_validate(t).model_dump() for t in types]
    return success_response(data=data)


@router.get("/leave/balances")
async def get_my_leave_balances(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(LeaveBalance)
        .options(selectinload(LeaveBalance.leave_type))
        .where(LeaveBalance.employee_id == current_user.id)
    )
    res = await db.execute(stmt)
    balances = res.scalars().all()
    data = [LeaveBalanceResponse.model_validate(b).model_dump() for b in balances]
    return success_response(data=data)


@router.post("/leave/eligibility")
async def check_leave_eligibility(
    req: LeaveEligibilityRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    eligibility = await LeaveService.check_eligibility(
        db, current_user.id, req.leave_type_id, req.start_date, req.end_date
    )
    return success_response(data=eligibility.model_dump())


@router.post("/leave/requests", status_code=status.HTTP_201_CREATED)
async def create_leave_request(
    req: LeaveRequestCreate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    leave_req = await LeaveService.create_request(
        db, current_user, req.leave_type_id, req.start_date, req.end_date, req.remarks
    )
    resp = LeaveRequestResponse.model_validate(leave_req)
    return success_response(data=resp.model_dump(), status_code=status.HTTP_201_CREATED)


@router.get("/leave/requests")
async def get_my_leave_requests(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(LeaveRequest)
        .options(selectinload(LeaveRequest.leave_type))
        .where(LeaveRequest.employee_id == current_user.id)
        .order_by(LeaveRequest.created_at.desc())
    )
    res = await db.execute(stmt)
    requests = res.scalars().all()
    data = [LeaveRequestResponse.model_validate(r).model_dump() for r in requests]
    return success_response(data=data)


@router.get("/leave/requests/{request_id}")
async def get_leave_request_detail(
    request_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(LeaveRequest)
        .options(selectinload(LeaveRequest.leave_type))
        .where(LeaveRequest.id == request_id)
    )
    res = await db.execute(stmt)
    leave_req = res.scalar_one_or_none()

    if not leave_req:
        raise NotFoundException("Leave request not found")

    if current_user.role not in (Role.ADMIN, Role.HR) and str(leave_req.employee_id) != str(current_user.id):
        raise ForbiddenException("Access denied to another employee's leave request")

    resp = LeaveRequestResponse.model_validate(leave_req)
    return success_response(data=resp.model_dump())


@router.delete("/leave/requests/{request_id}")
async def delete_leave_request(
    request_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await LeaveService.cancel_request(db, current_user, request_id)
    return success_response(data={"message": "Leave request deleted successfully"})


@router.get("/admin/leave/requests")
async def admin_get_leave_requests(
    status_filter: Optional[LeaveStatus] = Query(None, alias="status"),
    employee_id: Optional[uuid.UUID] = Query(None),
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(LeaveRequest).options(selectinload(LeaveRequest.leave_type))

    if status_filter:
        stmt = stmt.where(LeaveRequest.status == status_filter)
    if employee_id:
        stmt = stmt.where(LeaveRequest.employee_id == employee_id)

    stmt = stmt.order_by(LeaveRequest.created_at.desc())
    res = await db.execute(stmt)
    requests = res.scalars().all()
    data = [LeaveRequestResponse.model_validate(r).model_dump() for r in requests]
    return success_response(data=data)


@router.post("/admin/leave/{request_id}/approve")
async def approve_leave_request(
    request_id: uuid.UUID,
    req: Optional[LeaveApprovalRequest] = None,
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    comment = req.comment if req else None
    approved = await LeaveService.approve_request(db, current_user, request_id, comment=comment)
    resp = LeaveRequestResponse.model_validate(approved)
    return success_response(data=resp.model_dump())


@router.post("/admin/leave/{request_id}/reject")
async def reject_leave_request(
    request_id: uuid.UUID,
    req: LeaveRejectionRequest,
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    rejected = await LeaveService.reject_request(db, current_user, request_id, req.reviewer_comment)
    resp = LeaveRequestResponse.model_validate(rejected)
    return success_response(data=resp.model_dump())
