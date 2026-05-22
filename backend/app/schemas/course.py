from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CourseBase(BaseModel):
    title: str
    short_description: str = ""
    description: str = ""
    category: str = ""
    level: str = "Beginner"  # Beginner, Intermediate, Advanced
    language: str = "English"
    estimated_hours: float = 0
    thumbnail_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    banner_image_url: Optional[str] = None
    learning_outcomes: List[str] = []
    prerequisites: List[str] = []
    target_learners: str = ""
    requirements: str = ""
    price_type: str = "free"  # free, paid
    price: float = 0.0
    certificate_available: bool = False
    enrollment_open: bool = True
    allow_discussion: bool = True
    status: str = "draft"  # draft, published, archived

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    language: Optional[str] = None
    estimated_hours: Optional[float] = None
    thumbnail_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    banner_image_url: Optional[str] = None
    learning_outcomes: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    target_learners: Optional[str] = None
    requirements: Optional[str] = None
    price_type: Optional[str] = None
    price: Optional[float] = None
    certificate_available: Optional[bool] = None
    enrollment_open: Optional[bool] = None
    allow_discussion: Optional[bool] = None
    status: Optional[str] = None

class Course(CourseBase):
    id: str
    instructor_id: str
    rating_avg: float = 0.0
    enrollment_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
