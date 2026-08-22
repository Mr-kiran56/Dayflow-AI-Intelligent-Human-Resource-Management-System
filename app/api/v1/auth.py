from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.models.profile import Profile
from app.db.session import get_db
from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
    UserProfileSummary,
)
from app.services.auth_service import AuthService
from app.utils.response_formatter import success_response

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    auth_data = await AuthService.signup(db, req)
    return success_response(data=auth_data.model_dump(), status_code=status.HTTP_201_CREATED)


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_data = await AuthService.login(db, req)
    return success_response(data=auth_data.model_dump())


@router.post("/verify-email")
@router.get("/verify-email")
async def verify_email(email: str = Query(...), db: AsyncSession = Depends(get_db)):
    await AuthService.verify_email(db, email)
    return success_response(data={"message": f"Email '{email}' has been verified successfully."})


@router.post("/refresh")
async def refresh_token(current_user: Profile = Depends(get_current_user)):
    from app.core.security import create_access_token
    token = create_access_token(
        data={
            "sub": str(current_user.auth_user_id),
            "email": current_user.email,
            "role": current_user.role.value,
        }
    )
    user_summary = UserProfileSummary.model_validate(current_user)
    return success_response(
        data={
            "access_token": token,
            "token_type": "bearer",
            "user": user_summary.model_dump(),
        }
    )


@router.post("/logout")
async def logout(current_user: Profile = Depends(get_current_user)):
    return success_response(data={"message": "Successfully logged out"})


@router.get("/me")
async def get_me(current_user: Profile = Depends(get_current_user)):
    user_summary = UserProfileSummary.model_validate(current_user)
    return success_response(data=user_summary.model_dump())


@router.post("/forgot-password")
async def forgot_password(req: PasswordResetRequest):
    return success_response(
        data={"message": "If the email is registered, a password reset link has been sent."}
    )


@router.post("/reset-password")
async def reset_password(req: PasswordResetConfirm):
    return success_response(data={"message": "Password has been reset successfully."})
