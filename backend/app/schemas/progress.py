from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProgressBase(BaseModel):
    course_id: str
    module_id: str
    lesson_id: str

class ProgressCreate(ProgressBase):
    pass

class Progress(ProgressBase):
    id: str
    user_id: str
    completed: bool = True
    completed_at: datetime
    last_accessed_at: datetime

    class Config:
        from_attributes = True
