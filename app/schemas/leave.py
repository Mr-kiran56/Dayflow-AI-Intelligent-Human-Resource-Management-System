import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.db.enums import LeaveStatus



class LeaveTypeResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    description: Optional[str] = None
    default_days_per_year: Decimal
    is_paid: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)



class LeaveBalanceResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    leave_type: Optional[LeaveTypeResponse] = None
    year: int
    allocated_days: Decimal
    used_days: Decimal
    remaining_days: Decimal

    model_config = ConfigDict(from_attributes=True)



class LeaveRequestCreate(BaseModel):
    leave_type_id: uuid.UUID
    start_date: date
    end_date: date
    remarks: Optional[str] = None


class LeaveEligibilityRequest(BaseModel):
    leave_type_id: uuid.UUID
    start_date: date
    end_date: date


class LeaveEligibilityResponse(BaseModel):
    eligible: bool
    requested_days: Decimal
    remaining_days: Decimal
    remaining_after_request: Decimal
    reason: str


class LeaveApprovalRequest(BaseModel):
    comment: Optional[str] = None


class LeaveRejectionRequest(BaseModel):
    reviewer_comment: str = Field(..., min_length=1)


class LeaveRequestResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    leave_type: Optional[LeaveTypeResponse] = None
    start_date: date
    end_date: date
    total_days: Decimal
    remarks: Optional[str] = None
    status: LeaveStatus
    reviewer_id: Optional[uuid.UUID] = None
    reviewer_comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

