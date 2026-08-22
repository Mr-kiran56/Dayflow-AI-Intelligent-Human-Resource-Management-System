from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.models.profile import Profile
from app.db.session import get_db
from app.schemas.profile import ProfileMeUpdate, ProfileDetailResponse
from app.services.employee_service import EmployeeService
from app.utils.response_formatter import success_response

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/me")
async def get_my_profile(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await EmployeeService.get_profile_by_id_or_emp_code(db, str(current_user.id))
    detail = ProfileDetailResponse.model_validate(profile)
    return success_response(data=detail.model_dump())


@router.patch("/me")
async def update_my_profile(
    req: ProfileMeUpdate,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await EmployeeService.update_my_profile(db, current_user, req)
    detail = ProfileDetailResponse.model_validate(updated)
    return success_response(data=detail.model_dump())
