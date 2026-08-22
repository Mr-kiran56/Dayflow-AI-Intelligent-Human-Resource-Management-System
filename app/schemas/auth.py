import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.db.enums import Role



class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    employee_id: str = Field(..., min_length=2, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=255)
    role: Role = Role.EMPLOYEE
    phone: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    job_title: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


class UserProfileSummary(BaseModel):
    id: uuid.UUID
    auth_user_id: uuid.UUID
    employee_id: str
    role: Role
    full_name: str
    email: str
    phone: Optional[str] = None
    profile_picture_url: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    job_title: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)



class AuthTokenData(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileSummary
