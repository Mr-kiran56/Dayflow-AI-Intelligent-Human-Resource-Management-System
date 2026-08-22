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
        """Deterministic fallback explanation when live AI service is unreachable or unconfigured."""
        if "leave_balance" in context_data:
            bal_info = context_data["leave_balance"]
            return f"Based on your database records, your leave balance details are: {json.dumps(bal_info, default=str)}. (AI Explanation Service operating in offline mode)."
        elif "salary_record" in context_data:
            sal = context_data["salary_record"]
            return f"Your gross salary is {sal.get('gross_salary')} and net salary is {sal.get('net_salary')} after deductions of {sal.get('deductions')}. (AI Explanation Service operating in offline mode)."
        elif "attendance_summary" in context_data:
            att = context_data["attendance_summary"]
            return f"Your attendance summary for the period shows {att.get('present_days')} present days and {att.get('leave_days')} leave days. Total work hours: {att.get('total_work_hours')}. (AI Explanation Service operating in offline mode)."
        elif "workforce_summary" in context_data:
            wf = context_data["workforce_summary"]
            return f"Workforce Summary: Total Active Employees = {wf.get('total_active_employees')}, Present Today = {wf.get('present_today')}, On Leave Today = {wf.get('on_leave_today')}, Pending Requests = {wf.get('pending_leave_requests')}. (AI Explanation Service operating in offline mode)."
        return f"Database query completed successfully for context: {json.dumps(context_data, default=str)}."
