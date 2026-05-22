from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EnrollmentBase(BaseModel):
    course_id: str

class EnrollmentCreate(EnrollmentBase):
    pass

class Enrollment(EnrollmentBase):
    id: str
    user_id: str
    progress_percent: float = 0.0
    status: str = "active" # active, completed, dropped
    enrolled_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
