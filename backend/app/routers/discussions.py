from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from ..core.dependencies import get_current_user
from ..core.firebase import get_db
from ..utils.response import success_response
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

@router.get("/")
def get_all_discussions():
    return success_response(data=[])

class DiscussionCreate(BaseModel):
    course_id: str
    title: str
    content: str


class ReplyCreate(BaseModel):
    content: str


@router.get("/courses/{course_id}")
def get_course_discussions(
    course_id: str,
    db: Client = Depends(get_db)
):
    docs = db.collection("discussions").where("course_id", "==", course_id).order_by("created_at", direction="DESCENDING").stream()
    results = []
    for d in docs:
        dd = d.to_dict()
        dd["id"] = d.id
        author_doc = db.collection("users").document(dd.get("author_id", "")).get()
        dd["author_name"] = author_doc.to_dict().get("name", "Unknown") if author_doc.exists else "Unknown"
        dd["author_photo"] = author_doc.to_dict().get("photo_url", "") if author_doc.exists else ""
        replies = list(db.collection("discussion_replies").where("thread_id", "==", d.id).order_by("created_at").stream())
        dd["replies"] = []
        for r in replies:
            rd = r.to_dict()
            rd["id"] = r.id
            reply_author = db.collection("users").document(rd.get("author_id", "")).get()
            rd["author_name"] = reply_author.to_dict().get("name", "Unknown") if reply_author.exists else "Unknown"
            dd["replies"].append(rd)
        dd["reply_count"] = len(dd["replies"])
        results.append(dd)
    return success_response(data=results)


@router.post("/courses/{course_id}")
def create_discussion(
    course_id: str,
    discussion: DiscussionCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    data = discussion.model_dump()
    data.update({
        "author_id": current_user["id"],
        "created_at": now,
        "is_pinned": False,
        "is_hidden": False
    })
    _, ref = db.collection("discussions").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Discussion created")


@router.post("/{thread_id}/replies")
def create_reply(
    thread_id: str,
    reply: ReplyCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    thread_ref = db.collection("discussions").document(thread_id)
    if not thread_ref.get().exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    now = datetime.now(timezone.utc)
    data = reply.model_dump()
    data.update({
        "thread_id": thread_id,
        "author_id": current_user["id"],
        "created_at": now
    })
    _, ref = db.collection("discussion_replies").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Reply added")


@router.patch("/{thread_id}/pin")
def toggle_pin_thread(
    thread_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(thread_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    thread_data = doc.to_dict()
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only instructors can pin threads")
    current = thread_data.get("is_pinned", False)
    ref.update({"is_pinned": not current})
    return success_response(message="Thread pin status toggled")


@router.delete("/{thread_id}")
def delete_discussion(
    thread_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(thread_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    thread_data = doc.to_dict()
    if thread_data.get("author_id") != current_user["id"] and current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    replies = db.collection("discussion_replies").where("thread_id", "==", thread_id).stream()
    for r in replies:
        db.collection("discussion_replies").document(r.id).delete()
    ref.delete()
    return success_response(message="Discussion deleted")
