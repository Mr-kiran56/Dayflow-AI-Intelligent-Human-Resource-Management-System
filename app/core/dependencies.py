import uuid
from typing import Callable, List, Optional
from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthInvalidCredentialsException, ForbiddenException
from app.core.security import decode_access_token
from app.db.enums import Role
from app.db.models.profile import Profile
from app.db.session import get_db


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    """Extract and validate bearer token to return authenticated user profile."""
    if not authorization:
        raise AuthInvalidCredentialsException("Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise AuthInvalidCredentialsException("Invalid Authorization header format")

    token = parts[1]
    payload = decode_access_token(token)

    auth_user_id_str = payload.get("sub") or payload.get("user_id") or payload.get("auth_user_id")
    if not auth_user_id_str:
        raise AuthInvalidCredentialsException("Invalid token payload: missing user subject")

    try:

        auth_user_id = uuid.UUID(str(auth_user_id_str))
    except ValueError:
        raise AuthInvalidCredentialsException("Invalid user ID format in token")

    query = select(Profile).where(Profile.auth_user_id == auth_user_id)
    result = await db.execute(query)
    profile = result.scalar_one_or_none()

    if not profile:

        email = payload.get("email")
        if email:
            query_email = select(Profile).where(Profile.email == email)
            res_email = await db.execute(query_email)
            profile = res_email.scalar_one_or_none()

    if not profile:
        raise AuthInvalidCredentialsException("User profile not found")

    if not profile.is_active:
        raise ForbiddenException("User account is inactive")

    return profile


def require_roles(*allowed_roles: Role) -> Callable:
    """Dependency factory enforcing role-based access control."""

    async def role_checker(current_user: Profile = Depends(get_current_user)) -> Profile:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                f"Role '{current_user.role.value}' is not authorized to access this resource"
            )
        return current_user

    return role_checker
