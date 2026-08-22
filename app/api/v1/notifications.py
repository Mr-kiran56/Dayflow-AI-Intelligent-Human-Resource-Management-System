import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select, update, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundException, ForbiddenException
from app.db.models.notification import Notification
from app.db.models.profile import Profile
from app.db.session import get_db
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.utils.response_formatter import success_response

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_my_notifications(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Notification)
        .where(Notification.recipient_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )
    res = await db.execute(stmt)
    notifications = res.scalars().all()
    data = [NotificationResponse.model_validate(n).model_dump() for n in notifications]
    return success_response(data=data)


@router.get("/unread-count")
async def get_unread_count(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(func.count(Notification.id)).where(
        and_(
            Notification.recipient_id == current_user.id,
            Notification.is_read == False,
        )
    )
    res = await db.execute(stmt)
    count = res.scalar() or 0
    return success_response(data={"unread_count": count})


@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Notification).where(Notification.id == notification_id)
    res = await db.execute(stmt)
    n = res.scalar_one_or_none()

    if not n:
        raise NotFoundException("Notification not found")

    if str(n.recipient_id) != str(current_user.id):
        raise ForbiddenException("Cannot update another user's notification")

    n.is_read = True
    await db.commit()
    await db.refresh(n)

    return success_response(data=NotificationResponse.model_validate(n).model_dump())


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        update(Notification)
        .where(
            and_(
                Notification.recipient_id == current_user.id,
                Notification.is_read == False,
            )
        )
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()

    return success_response(data={"message": "All notifications marked as read"})
