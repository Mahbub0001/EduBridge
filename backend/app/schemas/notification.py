from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Notification(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    is_read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
