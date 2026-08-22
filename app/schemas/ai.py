import uuid
from datetime import date
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AiChatRequest(BaseModel):
    message: str


class AiInsightItem(BaseModel):
    type: str
    severity: str
    message: str


class AiChatResponse(BaseModel):
    answer: str
    insights: Optional[List[AiInsightItem]] = None


class AiAttendanceInsightRequest(BaseModel):
    month: Optional[str] = None


class AiLeaveCheckRequest(BaseModel):
    leave_type_id: uuid.UUID
    start_date: date
    end_date: date


class AiSalaryExplanationRequest(BaseModel):
    payroll_id: Optional[uuid.UUID] = None
