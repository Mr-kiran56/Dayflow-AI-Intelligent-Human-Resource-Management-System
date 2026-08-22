import uuid
from typing import List, Optional
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundException, ForbiddenException, ValidationException
from app.db.enums import Role
from app.db.models.profile import Profile
from app.db.models.audit import AuditLog
from app.schemas.profile import ProfileMeUpdate, EmployeeAdminUpdate


class EmployeeService:

    @staticmethod
    async def get_profile_by_id_or_emp_code(
        db: AsyncSession, identifier: str
    ) -> Profile:
        query = select(Profile).options(selectinload(Profile.department))

        try:
            val_uuid = uuid.UUID(identifier)
            query = query.where(or_(Profile.id == val_uuid, Profile.employee_id == identifier))
        except ValueError:
            query = query.where(Profile.employee_id == identifier)

        result = await db.execute(query)
        profile = result.scalar_one_or_none()

        if not profile:
            raise NotFoundException(f"Employee '{identifier}' not found")

        return profile

    @staticmethod
    async def update_my_profile(
        db: AsyncSession, current_user: Profile, req: ProfileMeUpdate
    ) -> Profile:
        old_data = {
            "phone": current_user.phone,
            "address": current_user.address,
            "profile_picture_url": current_user.profile_picture_url,
        }

        update_data = req.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(current_user, key, val)

        audit = AuditLog(
            actor_id=current_user.id,
            action="UPDATE_SELF_PROFILE",
            entity_type="Profile",
            entity_id=current_user.id,
            old_data=old_data,
            new_data=update_data,
        )
        db.add(audit)

        await db.commit()
        await db.refresh(current_user)
        query = (
            select(Profile)
            .options(selectinload(Profile.department))
            .where(Profile.id == current_user.id)
        )
        res = await db.execute(query)
        return res.scalar_one()

    @staticmethod
    async def admin_update_employee(
        db: AsyncSession,
        actor: Profile,
        employee_identifier: str,
        req: EmployeeAdminUpdate,
    ) -> Profile:
        target_profile = await EmployeeService.get_profile_by_id_or_emp_code(
            db, employee_identifier
        )

        old_data = {
            "full_name": target_profile.full_name,
            "email": target_profile.email,
            "role": target_profile.role.value,
            "job_title": target_profile.job_title,
            "department_id": str(target_profile.department_id) if target_profile.department_id else None,
            "is_active": target_profile.is_active,
        }

        update_data = req.model_dump(exclude_unset=True)

        if "role" in update_data and update_data["role"] is not None:
            if actor.role not in (Role.ADMIN, Role.HR):
                raise ForbiddenException("Only ADMIN or HR can alter user roles")
            target_profile.role = update_data["role"]
            del update_data["role"]


        for key, val in update_data.items():
            if hasattr(target_profile, key):
                setattr(target_profile, key, val)

        audit = AuditLog(
            actor_id=actor.id,
            action="ADMIN_UPDATE_PROFILE",
            entity_type="Profile",
            entity_id=target_profile.id,
            old_data=old_data,
            new_data=req.model_dump(exclude_unset=True, mode="json"),
        )
        db.add(audit)

        await db.commit()
        await db.refresh(target_profile)
        query = (
            select(Profile)
            .options(selectinload(Profile.department))
            .where(Profile.id == target_profile.id)
        )
        res = await db.execute(query)
        return res.scalar_one()

    @staticmethod
    async def list_employees(
        db: AsyncSession,
        department_id: Optional[uuid.UUID] = None,
        role: Optional[Role] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[Profile]:
        query = select(Profile).options(selectinload(Profile.department))

        if department_id:
            query = query.where(Profile.department_id == department_id)
        if role:
            query = query.where(Profile.role == role)
        if is_active is not None:
            query = query.where(Profile.is_active == is_active)

        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    Profile.full_name.ilike(search_pattern),
                    Profile.email.ilike(search_pattern),
                    Profile.employee_id.ilike(search_pattern),
                    Profile.job_title.ilike(search_pattern),
                )
            )

        query = query.order_by(Profile.employee_id.asc())
        result = await db.execute(query)
        return list(result.scalars().all())
