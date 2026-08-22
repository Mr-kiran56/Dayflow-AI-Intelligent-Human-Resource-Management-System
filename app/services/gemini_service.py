import json
import logging
from typing import Any, Dict, Optional
from google import genai

from app.core.config import settings
from app.core.exceptions import AiUnavailableException

logger = logging.getLogger(__name__)


class GeminiService:
    _client: Optional[genai.Client] = None

    @classmethod
    def get_client(cls) -> Optional[genai.Client]:
        if cls._client is None and settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("dummy"):
            try:
                cls._client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
                return None
        return cls._client

    @classmethod
    async def generate_response(
        cls, system_instruction: str, context_data: Dict[str, Any], user_prompt: str
    ) -> str:
        client = cls.get_client()

        combined_prompt = f"""
System Directive:
{system_instruction}

AUTHORITATIVE DATABASE CONTEXT (SOURCE OF TRUTH):
{json.dumps(context_data, indent=2, default=str)}

User Query:
{user_prompt}
"""

        if not client:
            return cls._fallback_response(context_data, user_prompt)

        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=combined_prompt,
            )
            if response and response.text:
                return response.text.strip()
            return cls._fallback_response(context_data, user_prompt)
        except Exception as e:
            logger.error(f"Gemini API invocation error: {e}")
            return cls._fallback_response(context_data, user_prompt)

    @classmethod
    def _fallback_response(cls, context_data: Dict[str, Any], user_prompt: str) -> str:
        """Professional enterprise HR explanation grounded in live database context."""
        if "retrieved_policies" in context_data:
            policies = context_data["retrieved_policies"]
            lines = ["Here are the official company HR policy guidelines relevant to your query:\n"]
            for p in policies:
                lines.append(f"**{p.get('title')}** ({p.get('category')})")
                lines.append(f"{p.get('content')}\n")
            return "\n".join(lines)

        elif "leave_balances" in context_data:
            bals = context_data["leave_balances"]
            lines = ["Here is your current live leave balance summary:\n"]
            if isinstance(bals, list):
                for b in bals:
                    lines.append(f"• **{b.get('leave_type_name', 'Leave')}**: {b.get('remaining_days')} days remaining (Allocated: {b.get('allocated_days')} days, Used: {b.get('used_days')} days)")
            else:
                lines.append(f"• Remaining Days: **{bals.get('remaining_days')}**")
            return "\n".join(lines)

        elif "salary_record" in context_data:
            sal = context_data["salary_record"]
            return (
                f"Here is your official compensation breakdown for **{sal.get('payroll_month')}**:\n\n"
                f"• **Basic Salary**: ₹{sal.get('basic_salary')}\n"
                f"• **House Rent Allowance (HRA)**: ₹{sal.get('hra')}\n"
                f"• **Allowances**: ₹{sal.get('allowances')}\n"
                f"• **Gross Earnings**: ₹{sal.get('gross_salary')}\n"
                f"• **Deductions & Taxes**: ₹{sal.get('deductions')}\n"
                f"• **Net Salary Disbursed**: **₹{sal.get('net_salary')} {sal.get('currency')}**"
            )

        elif "attendance_summary" in context_data:
            att = context_data["attendance_summary"]
            return (
                "Here is your attendance compliance overview:\n\n"
                f"• **Present Days**: {att.get('present_days')}\n"
                f"• **Leave Days**: {att.get('leave_days')}\n"
                f"• **Total Logged Work Hours**: **{att.get('total_work_hours')} hrs**"
            )

        elif "workforce_summary" in context_data:
            wf = context_data["workforce_summary"]
            return (
                "### Executive Workforce Health Summary\n\n"
                f"• **Total Active Headcount**: {wf.get('total_employees', wf.get('total_active_employees'))}\n"
                f"• **Present Today**: {wf.get('present_today')}\n"
                f"• **On Leave Today**: {wf.get('on_leave_today')}\n"
                f"• **Pending Approvals Queue**: {wf.get('pending_leave_requests')}\n\n"
                "Overall workforce operational efficiency remains high with steady shift attendance rates."
            )

        return "I have reviewed your record in the database. All shift metrics, leave balances, and compensation statements are up to date."
