from pydantic import BaseModel
from datetime import datetime

class Certificate(BaseModel):
    id: str
    user_id: str
    course_id: str
    course_title: str
    issued_at: datetime
    certificate_url: str

    class Config:
        from_attributes = True
