import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import (
    LeaveInsufficientBalanceException,
    LeaveNotPendingException,
    LeaveOverlappingRequestException,
    LeaveReviewCommentRequiredException,
    NotFoundException,
    ValidationException,
    ForbiddenException,
)
from app.db.enums import LeaveStatus
from app.db.models.audit import AuditLog
from app.db.models.leave import LeaveBalance, LeaveRequest, LeaveType
from app.db.models.notification import Notification
from app.db.models.profile import Profile
from app.schemas.leave import LeaveEligibilityResponse


class LeaveService:

    @staticmethod
    def calculate_working_days(start_date: date, end_date: date) -> Decimal:
        """Calculate total requested days (inclusive)."""
        if start_date > end_date:
            raise ValidationException("start_date must be before or equal to end_date")
        days = (end_date - start_date).days + 1
        return Decimal(str(days))

    @staticmethod
    async def check_overlap(
        db: AsyncSession, employee_id: uuid.UUID, start_date: date, end_date: date, exclude_id: Optional[uuid.UUID] = None
    ) -> bool:
        stmt = select(LeaveRequest).where(
            and_(
                LeaveRequest.employee_id == employee_id,
                LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
                or_(
                    and_(LeaveRequest.start_date <= start_date, LeaveRequest.end_date >= start_date),
                    and_(LeaveRequest.start_date <= end_date, LeaveRequest.end_date >= end_date),
                    and_(LeaveRequest.start_date >= start_date, LeaveRequest.end_date <= end_date),
                ),
            )
        )
        if exclude_id:
            stmt = stmt.where(LeaveRequest.id != exclude_id)

        res = await db.execute(stmt)
        return res.scalar_one_or_none() is not None

    @staticmethod
    async def check_eligibility(
        db: AsyncSession, employee_id: uuid.UUID, leave_type_id: uuid.UUID, start_date: date, end_date: date
    ) -> LeaveEligibilityResponse:
        total_days = LeaveService.calculate_working_days(start_date, end_date)

        stmt_type = select(LeaveType).where(LeaveType.id == leave_type_id)
        res_type = await db.execute(stmt_type)
        leave_type = res_type.scalar_one_or_none()
        if not leave_type:
            raise NotFoundException("Leave type not found")

        current_year = start_date.year
        stmt_bal = select(LeaveBalance).where(
            and_(
                LeaveBalance.employee_id == employee_id,
                LeaveBalance.leave_type_id == leave_type_id,
                LeaveBalance.year == current_year,
            )
        )
        res_bal = await db.execute(stmt_bal)
        balance = res_bal.scalar_one_or_none()

        remaining_days = balance.remaining_days if balance else Decimal("0.0")

        if leave_type.is_paid:
            if remaining_days < total_days:
                return LeaveEligibilityResponse(
                    eligible=False,
                    requested_days=total_days,
                    remaining_days=remaining_days,
                    remaining_after_request=remaining_days,
                    reason=f"Insufficient leave balance. Requested {total_days} days, available {remaining_days} days.",
                )

        has_overlap = await LeaveService.check_overlap(db, employee_id, start_date, end_date)
        if has_overlap:
            return LeaveEligibilityResponse(
                eligible=False,
                requested_days=total_days,
                remaining_days=remaining_days,
                remaining_after_request=remaining_days - total_days if leave_type.is_paid else remaining_days,
                reason="Dates overlap with an existing pending or approved leave request.",
            )

        remaining_after = remaining_days - total_days if leave_type.is_paid else remaining_days

        return LeaveEligibilityResponse(
            eligible=True,
            requested_days=total_days,
            remaining_days=remaining_days,
            remaining_after_request=remaining_after,
            reason="Sufficient leave balance and no overlapping requests.",
        )

    @staticmethod
    async def create_request(
        db: AsyncSession, employee: Profile, leave_type_id: uuid.UUID, start_date: date, end_date: date, remarks: Optional[str] = None
    ) -> LeaveRequest:
        eligibility = await LeaveService.check_eligibility(db, employee.id, leave_type_id, start_date, end_date)
        if not eligibility.eligible:
            if "overlap" in eligibility.reason.lower():
                raise LeaveOverlappingRequestException(eligibility.reason)
            raise LeaveInsufficientBalanceException(eligibility.reason)

        request = LeaveRequest(
            employee_id=employee.id,
            leave_type_id=leave_type_id,
            start_date=start_date,
            end_date=end_date,
            total_days=eligibility.requested_days,
            remarks=remarks,
            status=LeaveStatus.PENDING,
        )
        db.add(request)
        await db.flush()

        stmt_type = select(LeaveType).where(LeaveType.id == leave_type_id)
        res_type = await db.execute(stmt_type)
        ltype = res_type.scalar_one()

        notification = Notification(
            recipient_id=employee.id,
            type="LEAVE_SUBMITTED",
            title="Leave Request Submitted",
            message=f"Your request for {eligibility.requested_days} day(s) of {ltype.name} from {start_date} to {end_date} has been submitted.",
            reference_type="LeaveRequest",
            reference_id=request.id,
        )
        db.add(notification)

        await db.commit()

        stmt_fetch = select(LeaveRequest).options(selectinload(LeaveRequest.leave_type)).where(LeaveRequest.id == request.id)
        res_fetch = await db.execute(stmt_fetch)
        return res_fetch.scalar_one()

    @staticmethod
    async def approve_request(
        db: AsyncSession, reviewer: Profile, request_id: uuid.UUID, comment: Optional[str] = None
    ) -> LeaveRequest:
        """Atomic approval transaction."""
        stmt = (
            select(LeaveRequest)
            .options(selectinload(LeaveRequest.leave_type))
            .where(LeaveRequest.id == request_id)
            .with_for_update()
        )
        res = await db.execute(stmt)
        request = res.scalar_one_or_none()

        if not request:
            raise NotFoundException("Leave request not found")

        if request.status != LeaveStatus.PENDING:
            raise LeaveNotPendingException()

        year = request.start_date.year
        stmt_bal = (
            select(LeaveBalance)
            .where(
                and_(
                    LeaveBalance.employee_id == request.employee_id,
                    LeaveBalance.leave_type_id == request.leave_type_id,
                    LeaveBalance.year == year,
                )
            )
            .with_for_update()
        )
        res_bal = await db.execute(stmt_bal)
        balance = res_bal.scalar_one_or_none()

        if request.leave_type.is_paid:
            if not balance or balance.remaining_days < request.total_days:
                raise LeaveInsufficientBalanceException("Remaining leave balance is insufficient for approval")
            balance.used_days += request.total_days
            balance.remaining_days -= request.total_days

        request.status = LeaveStatus.APPROVED
        request.reviewer_id = reviewer.id
        request.reviewer_comment = comment
        request.reviewed_at = datetime.now(timezone.utc)

        notification = Notification(
            recipient_id=request.employee_id,
            type="LEAVE_APPROVED",
            title="Leave Request Approved",
            message=f"Your leave request from {request.start_date} to {request.end_date} has been approved.",
            reference_type="LeaveRequest",
            reference_id=request.id,
        )
        db.add(notification)

        audit = AuditLog(
            actor_id=reviewer.id,
            action="APPROVE_LEAVE",
            entity_type="LeaveRequest",
            entity_id=request.id,
            old_data={"status": LeaveStatus.PENDING.value},
            new_data={"status": LeaveStatus.APPROVED.value, "comment": comment},
        )
        db.add(audit)

        await db.commit()
        await db.refresh(request)
        return request

    @staticmethod
    async def reject_request(
        db: AsyncSession, reviewer: Profile, request_id: uuid.UUID, reviewer_comment: str
    ) -> LeaveRequest:
        """Atomic rejection transaction."""
        if not reviewer_comment or not reviewer_comment.strip():
            raise LeaveReviewCommentRequiredException()

        stmt = (
            select(LeaveRequest)
            .options(selectinload(LeaveRequest.leave_type))
            .where(LeaveRequest.id == request_id)
            .with_for_update()
        )
        res = await db.execute(stmt)
        request = res.scalar_one_or_none()

        if not request:
            raise NotFoundException("Leave request not found")

        if request.status != LeaveStatus.PENDING:
            raise LeaveNotPendingException()

        request.status = LeaveStatus.REJECTED
        request.reviewer_id = reviewer.id
        request.reviewer_comment = reviewer_comment.strip()
        request.reviewed_at = datetime.now(timezone.utc)

        notification = Notification(
            recipient_id=request.employee_id,
            type="LEAVE_REJECTED",
            title="Leave Request Rejected",
            message=f"Your leave request from {request.start_date} to {request.end_date} was rejected. Reason: {reviewer_comment}",
            reference_type="LeaveRequest",
            reference_id=request.id,
        )
        db.add(notification)

        audit = AuditLog(
            actor_id=reviewer.id,
            action="REJECT_LEAVE",
            entity_type="LeaveRequest",
            entity_id=request.id,
            old_data={"status": LeaveStatus.PENDING.value},
            new_data={"status": LeaveStatus.REJECTED.value, "reason": reviewer_comment},
        )
        db.add(audit)

        await db.commit()
        await db.refresh(request)
        return request

    @staticmethod
    async def cancel_request(db: AsyncSession, employee: Profile, request_id: uuid.UUID) -> None:
        stmt = select(LeaveRequest).where(LeaveRequest.id == request_id)
        res = await db.execute(stmt)
        request = res.scalar_one_or_none()

        if not request:
            raise NotFoundException("Leave request not found")

        if str(request.employee_id) != str(employee.id):
            raise ForbiddenException("Cannot delete another employee's leave request")

        if request.status != LeaveStatus.PENDING:
            raise ValidationException("Only pending leave requests can be deleted")

        await db.delete(request)
        await db.commit()
