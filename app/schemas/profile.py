import uuid
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from app.db.enums import Role


class DepartmentSummary(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProfileDetailResponse(BaseModel):
    id: uuid.UUID
    auth_user_id: uuid.UUID
    employee_id: str
    role: Role
    full_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    department: Optional[DepartmentSummary] = None
    job_title: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    joined_date: Optional[date] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



class ProfileMeUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None


class EmployeeAdminUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    job_title: Optional[str] = None
    manager_id: Optional[uuid.UUID] = None
    joined_date: Optional[date] = None
    role: Optional[Role] = None
    is_active: Optional[bool] = None
