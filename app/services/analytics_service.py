import uuid
from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Dict
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.enums import AttendanceStatus, LeaveStatus, Role
from app.db.models.attendance import AttendanceRecord
from app.db.models.department import Department
from app.db.models.leave import LeaveBalance, LeaveRequest, LeaveType
from app.db.models.payroll import PayrollRecord
from app.db.models.profile import Profile


class AnalyticsService:

    @staticmethod
    async def get_my_attendance_analytics(db: AsyncSession, employee_id: uuid.UUID) -> Dict[str, Any]:
        today = date.today()
        start_of_month = date(today.year, today.month, 1)

        stmt = select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == employee_id,
                AttendanceRecord.attendance_date >= start_of_month,
            )
        )
        res = await db.execute(stmt)
        records = res.scalars().all()

        total_records = len(records)
        present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        leave = sum(1 for r in records if r.status == AttendanceStatus.LEAVE)
        half_day = sum(1 for r in records if r.status == AttendanceStatus.HALF_DAY)
        total_work_minutes = sum(r.total_work_minutes or 0 for r in records)

        attendance_rate = round((present / total_records * 100.0), 2) if total_records > 0 else 0.0

        return {
            "month": today.strftime("%B %Y"),
            "total_days_logged": total_records,
            "present": present,
            "absent": absent,
            "leave": leave,
            "half_day": half_day,
            "total_work_hours": round(total_work_minutes / 60.0, 2),
            "attendance_rate_percentage": attendance_rate,
        }

    @staticmethod
    async def get_my_leave_analytics(db: AsyncSession, employee_id: uuid.UUID) -> Dict[str, Any]:
        year = date.today().year
        stmt_bal = select(LeaveBalance).where(
            and_(
                LeaveBalance.employee_id == employee_id,
                LeaveBalance.year == year,
            )
        )
        res_bal = await db.execute(stmt_bal)
        balances = res_bal.scalars().all()

        stmt_req = select(LeaveRequest).where(LeaveRequest.employee_id == employee_id)
        res_req = await db.execute(stmt_req)
        requests = res_req.scalars().all()

        total_allocated = sum((b.allocated_days for b in balances), Decimal("0.0"))
        total_used = sum((b.used_days for b in balances), Decimal("0.0"))
        total_remaining = sum((b.remaining_days for b in balances), Decimal("0.0"))

        pending_requests = sum(1 for r in requests if r.status == LeaveStatus.PENDING)
        approved_requests = sum(1 for r in requests if r.status == LeaveStatus.APPROVED)
        rejected_requests = sum(1 for r in requests if r.status == LeaveStatus.REJECTED)

        return {
            "year": year,
            "total_allocated_days": float(total_allocated),
            "total_used_days": float(total_used),
            "total_remaining_days": float(total_remaining),
            "pending_requests": pending_requests,
            "approved_requests": approved_requests,
            "rejected_requests": rejected_requests,
        }

    @staticmethod
    async def get_admin_overview(db: AsyncSession) -> Dict[str, Any]:
        stmt_emp = select(func.count(Profile.id)).where(Profile.is_active == True)
        res_emp = await db.execute(stmt_emp)
        total_active_employees = res_emp.scalar() or 0

        stmt_dept = select(func.count(Department.id))
        res_dept = await db.execute(stmt_dept)
        total_departments = res_dept.scalar() or 0

        today = date.today()
        stmt_today_att = select(AttendanceRecord).where(AttendanceRecord.attendance_date == today)
        res_today_att = await db.execute(stmt_today_att)
        today_records = res_today_att.scalars().all()

        present_today = sum(1 for r in today_records if r.status == AttendanceStatus.PRESENT)
        leave_today = sum(1 for r in today_records if r.status == AttendanceStatus.LEAVE)

        stmt_pending = select(func.count(LeaveRequest.id)).where(LeaveRequest.status == LeaveStatus.PENDING)
        res_pending = await db.execute(stmt_pending)
        pending_leave_requests = res_pending.scalar() or 0

        return {
            "total_active_employees": total_active_employees,
            "total_departments": total_departments,
            "present_today": present_today,
            "on_leave_today": leave_today,
            "pending_leave_requests": pending_leave_requests,
        }

    @staticmethod
    async def get_admin_attendance_analytics(db: AsyncSession) -> Dict[str, Any]:
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)

        stmt = select(AttendanceRecord).where(AttendanceRecord.attendance_date >= thirty_days_ago)
        res = await db.execute(stmt)
        records = res.scalars().all()

        total = len(records)
        present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        leave = sum(1 for r in records if r.status == AttendanceStatus.LEAVE)
        overall_rate = round((present / total * 100.0), 2) if total > 0 else 0.0

        return {
            "period": "Last 30 days",
            "total_attendance_records": total,
            "present_count": present,
            "absent_count": absent,
            "leave_count": leave,
            "overall_attendance_rate": overall_rate,
        }

    @staticmethod
    async def get_admin_leave_analytics(db: AsyncSession) -> Dict[str, Any]:
        stmt = select(LeaveRequest)
        res = await db.execute(stmt)
        requests = res.scalars().all()

        pending = sum(1 for r in requests if r.status == LeaveStatus.PENDING)
        approved = sum(1 for r in requests if r.status == LeaveStatus.APPROVED)
        rejected = sum(1 for r in requests if r.status == LeaveStatus.REJECTED)

        return {
            "total_leave_requests": len(requests),
            "pending": pending,
            "approved": approved,
            "rejected": rejected,
        }

    @staticmethod
    async def get_admin_payroll_analytics(db: AsyncSession) -> Dict[str, Any]:
        stmt = select(PayrollRecord)
        res = await db.execute(stmt)
        records = res.scalars().all()

        total_gross = sum((r.gross_salary for r in records), Decimal("0.0"))
        total_net = sum((r.net_salary for r in records), Decimal("0.0"))
        total_deductions = sum((r.deductions for r in records), Decimal("0.0"))

        return {
            "total_payroll_records": len(records),
            "total_gross_expenditure": float(total_gross),
            "total_net_disbursed": float(total_net),
            "total_deductions": float(total_deductions),
            "currency": "INR",
        }
