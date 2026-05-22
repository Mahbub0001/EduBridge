from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    photo_url: Optional[str] = None
    role: str = "student" # student, instructor, admin, super_admin
    status: str = "active"

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    photo_url: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class User(UserBase):
    id: str
    firebase_uid: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
