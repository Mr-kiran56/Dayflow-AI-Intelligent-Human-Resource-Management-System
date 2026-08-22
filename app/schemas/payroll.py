import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.db.enums import ComponentType



class SalaryComponentResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    component_name: str
    component_type: ComponentType
    amount: Decimal
    effective_from: date
    effective_to: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)



class PayrollRecordResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    payroll_month: date
    basic_salary: Decimal
    hra: Decimal
    allowances: Decimal
    deductions: Decimal
    gross_salary: Decimal
    net_salary: Decimal
    currency: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



class PayrollCreateRequest(BaseModel):
    employee_id: uuid.UUID
    payroll_month: date
    basic_salary: Decimal = Field(..., ge=0)
    hra: Decimal = Field(default=Decimal("0.0"), ge=0)
    allowances: Decimal = Field(default=Decimal("0.0"), ge=0)
    deductions: Decimal = Field(default=Decimal("0.0"), ge=0)
    currency: str = "INR"


class PayrollUpdateRequest(BaseModel):
    basic_salary: Optional[Decimal] = Field(None, ge=0)
    hra: Optional[Decimal] = Field(None, ge=0)
    allowances: Optional[Decimal] = Field(None, ge=0)
    deductions: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = None
