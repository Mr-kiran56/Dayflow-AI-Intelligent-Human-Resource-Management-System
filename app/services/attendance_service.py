import uuid
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AttendanceAlreadyCheckedInException,
    AttendanceAlreadyCheckedOutException,
    AttendanceCheckoutBeforeCheckinException,
    NotFoundException,
)
from app.db.enums import AttendanceStatus
from app.db.models.attendance import AttendanceRecord
from app.db.models.profile import Profile
from app.schemas.attendance import AttendanceSummaryResponse, AttendanceRecordResponse


class AttendanceService:

    @staticmethod
    async def check_in(
        db: AsyncSession, employee: Profile, notes: Optional[str] = None
    ) -> AttendanceRecord:
        today = date.today()
        now = datetime.now(timezone.utc)

        stmt = select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == employee.id,
                AttendanceRecord.attendance_date == today,
            )
        )
        res = await db.execute(stmt)
        record = res.scalar_one_or_none()

        if record:
            if record.check_in is not None:
                raise AttendanceAlreadyCheckedInException()
            record.check_in = now
            record.status = AttendanceStatus.PRESENT
            if notes:
                record.notes = notes
        else:
            record = AttendanceRecord(
                employee_id=employee.id,
                attendance_date=today,
                check_in=now,
                status=AttendanceStatus.PRESENT,
                notes=notes,
            )
            db.add(record)

        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def check_out(
        db: AsyncSession, employee: Profile, notes: Optional[str] = None
    ) -> AttendanceRecord:
        today = date.today()
        now = datetime.now(timezone.utc)

        stmt = select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == employee.id,
                AttendanceRecord.attendance_date == today,
            )
        )
        res = await db.execute(stmt)
        record = res.scalar_one_or_none()

        if not record or record.check_in is None:
            raise AttendanceCheckoutBeforeCheckinException()

        if record.check_out is not None:
            raise AttendanceAlreadyCheckedOutException()

        record.check_out = now
        duration_seconds = (now - record.check_in.replace(tzinfo=timezone.utc)).total_seconds()
        record.total_work_minutes = max(0, int(duration_seconds // 60))

        if notes:
            record.notes = f"{record.notes}\nCheckout notes: {notes}" if record.notes else notes

        await db.commit()
        await db.refresh(record)
        return record

    @staticmethod
    async def get_my_attendance(
        db: AsyncSession,
        employee_id: uuid.UUID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> List[AttendanceRecord]:
        query = select(AttendanceRecord).where(AttendanceRecord.employee_id == employee_id)

        if start_date:
            query = query.where(AttendanceRecord.attendance_date >= start_date)
        if end_date:
            query = query.where(AttendanceRecord.attendance_date <= end_date)

        query = query.order_by(AttendanceRecord.attendance_date.desc())
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_daily_attendance(db: AsyncSession, employee_id: uuid.UUID) -> Optional[AttendanceRecord]:
        today = date.today()
        stmt = select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.attendance_date == today,
            )
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()

    @staticmethod
    async def get_weekly_attendance(db: AsyncSession, employee_id: uuid.UUID) -> AttendanceSummaryResponse:
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())
        records = await AttendanceService.get_my_attendance(
            db, employee_id, start_date=start_of_week, end_date=today
        )

        present_days = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        absent_days = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        leave_days = sum(1 for r in records if r.status == AttendanceStatus.LEAVE)
        half_days = sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY)

        total_minutes = sum(r.total_work_minutes or 0 for r in records)
        total_hours = round(total_minutes / 60.0, 2)

        return AttendanceSummaryResponse(
            total_days=len(records),
            present_days=present_days,
            absent_days=absent_days,
            leave_days=leave_days,
            half_days=half_days,
            total_work_hours=total_hours,
            records=[AttendanceRecordResponse.model_validate(r) for r in records],
        )

    @staticmethod
    async def admin_get_attendance(
        db: AsyncSession,
        employee_id: Optional[uuid.UUID] = None,
        attendance_date: Optional[date] = None,
        status: Optional[AttendanceStatus] = None,
    ) -> List[AttendanceRecord]:
        query = select(AttendanceRecord)

        if employee_id:
            query = query.where(AttendanceRecord.employee_id == employee_id)
        if attendance_date:
            query = query.where(AttendanceRecord.attendance_date == attendance_date)
        if status:
            query = query.where(AttendanceRecord.status == status)

        query = query.order_by(AttendanceRecord.attendance_date.desc())
        result = await db.execute(query)
        return list(result.scalars().all())
