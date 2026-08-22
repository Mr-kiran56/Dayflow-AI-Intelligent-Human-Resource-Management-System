import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.exceptions import ForbiddenException
from app.db.enums import Role
from app.db.models.profile import Profile
from app.db.session import get_db
from app.schemas.profile import EmployeeAdminUpdate, ProfileDetailResponse
from app.services.employee_service import EmployeeService
from app.utils.response_formatter import success_response

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("")
async def list_employees(
    department_id: Optional[uuid.UUID] = Query(None),
    role: Optional[Role] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    employees = await EmployeeService.list_employees(
        db, department_id=department_id, role=role, search=search, is_active=is_active
    )
    data = [ProfileDetailResponse.model_validate(e).model_dump() for e in employees]
    return success_response(data=data)


@router.get("/{employee_id}")
async def get_employee_detail(
    employee_id: str,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    profile = await EmployeeService.get_profile_by_id_or_emp_code(db, employee_id)

    if current_user.role not in (Role.ADMIN, Role.HR):
        if str(current_user.id) != str(profile.id) and current_user.employee_id != profile.employee_id:
            raise ForbiddenException("You are only allowed to view your own profile detail")

    detail = ProfileDetailResponse.model_validate(profile)
    return success_response(data=detail.model_dump())


@router.patch("/{employee_id}")
async def update_employee(
    employee_id: str,
    req: EmployeeAdminUpdate,
    current_user: Profile = Depends(require_roles(Role.ADMIN, Role.HR)),
    db: AsyncSession = Depends(get_db),
):
    updated = await EmployeeService.admin_update_employee(db, current_user, employee_id, req)
    detail = ProfileDetailResponse.model_validate(updated)
    return success_response(data=detail.model_dump())
