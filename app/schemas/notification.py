import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: uuid.UUID
    recipient_id: uuid.UUID
    type: str
    title: str
    message: str
    reference_type: Optional[str] = None
    reference_id: Optional[uuid.UUID] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



class UnreadCountResponse(BaseModel):
    unread_count: int
