from typing import Optional
from fastapi import APIRouter, Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.exceptions import ForbiddenException
from app.db.enums import Role
from app.db.models.profile import Profile
from app.db.session import get_db
from app.schemas.ai import (
    AiChatRequest,
    AiChatResponse,
    AiAttendanceInsightRequest,
    AiLeaveCheckRequest,
    AiSalaryExplanationRequest,
)
from app.services.attendance_service import AttendanceService
from app.services.leave_service import LeaveService
from app.services.payroll_service import PayrollService
from app.services.analytics_service import AnalyticsService
from app.services.gemini_service import GeminiService
from app.utils.response_formatter import success_response

router = APIRouter(prefix="", tags=["AI"])


@router.post("/ai/chat")
async def ai_chat(
    req: AiChatRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    attendance_summary = await AttendanceService.get_weekly_attendance(db, current_user.id)
    leave_analytics = await AnalyticsService.get_my_leave_analytics(db, current_user.id)
    payroll = await PayrollService.get_my_payroll(db, current_user.id)

    context_data = {
        "employee_profile": {
            "name": current_user.full_name,
            "employee_id": current_user.employee_id,
            "role": current_user.role.value,
            "job_title": current_user.job_title,
        },
        "attendance_summary": attendance_summary.model_dump(),
        "leave_balances": leave_analytics,
        "latest_payroll": {
            "month": str(payroll.payroll_month) if payroll else None,
            "gross_salary": str(payroll.gross_salary) if payroll else None,
            "net_salary": str(payroll.net_salary) if payroll else None,
        }
        if payroll
        else None,
    }

    system_instruction = (
        "You are Dayflow AI, an intelligent HR assistant. Provide accurate, helpful responses "
        "based strictly on the authoritative database context provided. Never invent facts, balances, "
        "or numbers that do not exist in the database."
    )

    answer = await GeminiService.generate_response(system_instruction, context_data, req.message)

    return success_response(data={"answer": answer})


@router.post("/ai/attendance-insight")
async def ai_attendance_insight(
    req: Optional[AiAttendanceInsightRequest] = None,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stats = await AnalyticsService.get_my_attendance_analytics(db, current_user.id)
    context_data = {"attendance_summary": stats}
    system_instruction = (
        "Analyze the provided deterministic attendance statistics and provide a concise, structured "
        "insight report for the employee. Highlight positive patterns or attendance concerns."
    )

    explanation = await GeminiService.generate_response(
        system_instruction, context_data, "Provide attendance insights for my recent records."
    )

    return success_response(data={"summary": stats, "insight_text": explanation})


@router.post("/ai/leave-check")
async def ai_leave_check(
    req: AiLeaveCheckRequest,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    eligibility = await LeaveService.check_eligibility(
        db, current_user.id, req.leave_type_id, req.start_date, req.end_date
    )
    context_data = {"leave_eligibility": eligibility.model_dump()}

    system_instruction = (
        "Explain the leave eligibility calculation result in clear, friendly natural language. "
        "Do not alter the decision or numbers produced by the database."
    )

    explanation = await GeminiService.generate_response(
        system_instruction,
        context_data,
        f"Explain my leave eligibility for request from {req.start_date} to {req.end_date}.",
    )

    return success_response(data={"eligibility": eligibility.model_dump(), "explanation": explanation})


@router.post("/ai/salary-explanation")
async def ai_salary_explanation(
    req: Optional[AiSalaryExplanationRequest] = None,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req and req.payroll_id:
        payroll = await PayrollService.get_payroll_by_id(db, req.payroll_id)
        if current_user.role not in (Role.ADMIN, Role.HR) and str(payroll.employee_id) != str(current_user.id):
            raise ForbiddenException("Access denied to another employee's payroll record")
    else:
        payroll = await PayrollService.get_my_payroll(db, current_user.id)

    if not payroll:
        return success_response(data={"explanation": "No payroll records found to explain."})

    context_data = {
        "salary_record": {
            "payroll_month": str(payroll.payroll_month),
            "basic_salary": str(payroll.basic_salary),
            "hra": str(payroll.hra),
            "allowances": str(payroll.allowances),
            "deductions": str(payroll.deductions),
            "gross_salary": str(payroll.gross_salary),
            "net_salary": str(payroll.net_salary),
            "currency": payroll.currency,
        }
    }

    system_instruction = (
        "Provide a transparent, easy-to-understand breakdown of the employee's salary statement, "
        "explaining how basic, hra, allowances, and deductions compose the net salary."
    )

    explanation = await GeminiService.generate_response(
        system_instruction, context_data, "Explain my salary breakdown."
    )

    return success_response(
        data={"payroll_record": context_data["salary_record"], "explanation": explanation}
    )


@router.post("/admin/ai/workforce-summary")
async def admin_ai_workforce_summary(
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    overview = await AnalyticsService.get_admin_overview(db)
    attendance_stats = await AnalyticsService.get_admin_attendance_analytics(db)
    leave_stats = await AnalyticsService.get_admin_leave_analytics(db)

    context_data = {
        "workforce_summary": overview,
        "attendance_analytics": attendance_stats,
        "leave_analytics": leave_stats,
    }

    system_instruction = (
        "You are an executive HR consultant. Provide a high-level strategic executive summary "
        "of the organization's workforce health, attendance rates, and leave pending metrics."
    )

    summary_text = await GeminiService.generate_response(
        system_instruction, context_data, "Generate executive workforce summary report."
    )

    return success_response(data={"context_data": context_data, "executive_summary": summary_text})


@router.post("/ai/policy-rag")
async def ai_policy_rag(
    req: AiChatRequest,
    current_user: Profile = Depends(get_current_user),
):
    from app.services.pinecone_service import PineconeService
    res = await PineconeService.query_policy_rag(req.message)
    return success_response(data=res)
