from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from ..core.dependencies import get_current_user, require_admin
from ..core.firebase import get_db
from ..utils.response import success_response
from datetime import datetime

router = APIRouter()


@router.get("/")
def get_announcements(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    docs = (
        db.collection("announcements")
        .order_by("created_at", direction="DESCENDING")
        .limit(10)
        .stream()
    )
    results = []
    for d in docs:
        ad = d.to_dict()
        ad["id"] = d.id
        author_doc = db.collection("users").document(ad.get("author_id", "")).get()
        ad["author_name"] = author_doc.to_dict().get("name", "Admin") if author_doc.exists else "Admin"
        results.append(ad)

    if not results:
        results = [
            {"id": "sample-1", "author_name": "EduBridge Admin", "title": "Welcome to EduBridge!", "content": "Explore our courses and start your learning journey.", "created_at": datetime.now(timezone.utc)},
        ]

    return success_response(data=results)


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    course_id: Optional[str] = None
    type: Optional[str] = "global"


@router.post("/")
def create_announcement(
    announcement: AnnouncementCreate,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    data = announcement.model_dump()
    data["author_id"] = current_user["id"]
    data["created_at"] = now
    _, ref = db.collection("announcements").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Announcement created")


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    ref = db.collection("announcements").document(announcement_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Announcement not found")
    ref.delete()
    return success_response(message="Announcement deleted")


@router.get("/course/{course_id}")
def get_student_course_announcements(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    docs = (
        db.collection("announcements")
        .where("course_id", "==", course_id)
        .where("status", "==", "published")
        .stream()
    )
    results = []
    for d in docs:
        ad = d.to_dict()
        ad["id"] = d.id
        
        author_doc = db.collection("users").document(ad.get("author_id", "")).get()
        ad["author_name"] = author_doc.to_dict().get("name", "Instructor") if author_doc.exists else "Instructor"
        results.append(ad)
        
    def safe_sort_key(item):
        val = item.get("published_at") or item.get("created_at")
        if isinstance(val, datetime):
            return val.isoformat()
        return str(val)

    results.sort(key=safe_sort_key, reverse=True)
    return success_response(data=results)

