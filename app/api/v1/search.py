from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.enums import Role
from app.db.models.attendance import AttendanceRecord
from app.db.models.leave import LeaveRequest
from app.db.models.payroll import PayrollRecord
from app.db.models.profile import Profile
from app.db.session import get_db
from app.utils.response_formatter import success_response

router = APIRouter(prefix="", tags=["Search"])


@router.get("/search")
async def global_search(
    q: str = Query(..., min_length=1),
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    search_term = f"%{q}%"
    results: List[Dict[str, Any]] = []

    is_admin_or_hr = current_user.role in (Role.ADMIN, Role.HR)

    stmt_emp = select(Profile).where(
        or_(
            Profile.full_name.ilike(search_term),
            Profile.email.ilike(search_term),
            Profile.employee_id.ilike(search_term),
            Profile.job_title.ilike(search_term),
        )
    )
    if not is_admin_or_hr:
        stmt_emp = stmt_emp.where(Profile.id == current_user.id)

    res_emp = await db.execute(stmt_emp)
    profiles = res_emp.scalars().all()
    for p in profiles:
        results.append(
            {
                "type": "employee",
                "id": str(p.id),
                "title": p.full_name,
                "subtitle": f"{p.employee_id} - {p.job_title or 'Employee'}",
                "url": f"/employees/{p.employee_id}",
            }
        )

    stmt_leave = select(LeaveRequest).where(
        or_(
            LeaveRequest.remarks.ilike(search_term),
            LeaveRequest.reviewer_comment.ilike(search_term),
        )
    )
    if not is_admin_or_hr:
        stmt_leave = stmt_leave.where(LeaveRequest.employee_id == current_user.id)

    res_leave = await db.execute(stmt_leave)
    leaves = res_leave.scalars().all()
    for l in leaves:
        results.append(
            {
                "type": "leave_request",
                "id": str(l.id),
                "title": f"Leave Request ({l.status.value})",
                "subtitle": f"{l.start_date} to {l.end_date} ({l.total_days} days)",
                "url": f"/leave/{l.id}",
            }
        )

    stmt_att = select(AttendanceRecord).where(AttendanceRecord.notes.ilike(search_term))
    if not is_admin_or_hr:
        stmt_att = stmt_att.where(AttendanceRecord.employee_id == current_user.id)

    res_att = await db.execute(stmt_att)
    atts = res_att.scalars().all()
    for a in atts:
        results.append(
            {
                "type": "attendance",
                "id": str(a.id),
                "title": f"Attendance on {a.attendance_date}",
                "subtitle": f"Status: {a.status.value}",
                "url": f"/attendance",
            }
        )

    return success_response(data={"query": q, "results": results})
