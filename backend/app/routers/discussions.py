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


class ModuleCommentCreate(BaseModel):
    content: str


@router.get("/courses/{course_id}")
def get_course_discussions(
    course_id: str,
    db: Client = Depends(get_db)
):
    docs = db.collection("discussions").where("course_id", "==", course_id).stream()
    results = []
    for d in docs:
        dd = d.to_dict()
        if dd.get("is_module_feedback") is True:
            continue
        dd["id"] = d.id
        author_doc = db.collection("users").document(dd.get("author_id", "")).get()
        dd["author_name"] = author_doc.to_dict().get("name", "Unknown") if author_doc.exists else "Unknown"
        dd["author_photo"] = author_doc.to_dict().get("photo_url", "") if author_doc.exists else ""
        replies_raw = list(db.collection("discussion_replies").where("thread_id", "==", d.id).stream())
        replies_raw.sort(key=lambda r: r.to_dict().get("created_at") or datetime.min.replace(tzinfo=timezone.utc))
        dd["replies"] = []
        for r in replies_raw:
            rd = r.to_dict()
            rd["id"] = r.id
            reply_author = db.collection("users").document(rd.get("author_id", "")).get()
            rd["author_name"] = reply_author.to_dict().get("name", "Unknown") if reply_author.exists else "Unknown"
            dd["replies"].append(rd)
        dd["reply_count"] = len(dd["replies"])
        results.append(dd)
    results.sort(key=lambda x: x.get("created_at") or "", reverse=True)
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


@router.get("/modules/{module_id}")
def get_module_discussion(
    module_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    module_ref = db.collection("modules").document(module_id)
    module_doc = module_ref.get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    module_data = module_doc.to_dict()
    course_id = module_data.get("course_id")

    user_id = current_user["id"]
    user_role = current_user.get("role", "student")
    enrollments = list(db.collection("enrollments").where("user_id", "==", user_id).where("course_id", "==", course_id).stream())
    if user_role not in ["instructor", "admin", "super_admin"] and len(enrollments) == 0:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    existing = list(db.collection("discussions").where("module_id", "==", module_id).limit(1).stream())
    if existing:
        thread_doc = existing[0]
        thread_data = thread_doc.to_dict()
        thread_data["id"] = thread_doc.id
    else:
        now = datetime.now(timezone.utc)
        thread_data = {
            "course_id": course_id,
            "module_id": module_id,
            "title": f"Module: {module_data.get('title', 'Untitled')} \u2014 Feedback & Questions",
            "content": "Ask questions or share feedback about this module.",
            "author_id": "system",
            "is_module_feedback": True,
            "is_pinned": False,
            "is_hidden": False,
            "created_at": now,
            "updated_at": now
        }
        _, ref = db.collection("discussions").add(thread_data)
        thread_data["id"] = ref.id

    replies_raw = list(db.collection("discussion_replies").where("thread_id", "==", thread_data["id"]).stream())
    replies_raw.sort(key=lambda r: r.to_dict().get("created_at") or datetime.min.replace(tzinfo=timezone.utc))
    reply_list = []
    for r in replies_raw:
        rd = r.to_dict()
        rd["id"] = r.id
        author_doc = db.collection("users").document(rd.get("author_id", "")).get()
        rd["author_name"] = author_doc.to_dict().get("name", "Unknown") if author_doc.exists else "Unknown"
        rd["author_photo"] = author_doc.to_dict().get("photo_url", "") if author_doc.exists else ""
        rd["author_role"] = author_doc.to_dict().get("role", "") if author_doc.exists else ""
        reply_list.append(rd)

    return success_response(data={"thread": thread_data, "replies": reply_list})


@router.post("/modules/{module_id}/comments")
def create_module_comment(
    module_id: str,
    comment: ModuleCommentCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    module_doc = db.collection("modules").document(module_id).get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    module_data = module_doc.to_dict()
    course_id = module_data.get("course_id")

    user_id = current_user["id"]
    user_role = current_user.get("role", "student")
    enrollments = list(db.collection("enrollments").where("user_id", "==", user_id).where("course_id", "==", course_id).stream())
    if user_role not in ["instructor", "admin", "super_admin"] and len(enrollments) == 0:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    existing = list(db.collection("discussions").where("module_id", "==", module_id).limit(1).stream())
    if existing:
        thread_id = existing[0].id
    else:
        now = datetime.now(timezone.utc)
        _, ref = db.collection("discussions").add({
            "course_id": course_id,
            "module_id": module_id,
            "title": f"Module: {module_data.get('title', 'Untitled')} \u2014 Feedback & Questions",
            "content": "Ask questions or share feedback about this module.",
            "author_id": "system",
            "is_module_feedback": True,
            "is_pinned": False,
            "is_hidden": False,
            "created_at": now,
            "updated_at": now
        })
        thread_id = ref.id

    now = datetime.now(timezone.utc)
    is_instructor = user_role in ["instructor", "admin", "super_admin"]
    data = {
        "thread_id": thread_id,
        "author_id": user_id,
        "content": comment.content,
        "is_instructor": is_instructor,
        "created_at": now
    }
    _, ref = db.collection("discussion_replies").add(data)
    data["id"] = ref.id
    data["author_name"] = current_user.get("name", "Unknown")

    author_doc = db.collection("users").document(user_id).get()
    if author_doc.exists:
        author_data = author_doc.to_dict()
        data["author_role"] = author_data.get("role", "")
        data["author_photo"] = author_data.get("photo_url", "")

    db.collection("discussions").document(thread_id).update({"updated_at": now})

    if not is_instructor:
        course_doc = db.collection("courses").document(course_id).get()
        if course_doc.exists:
            instructor_id = course_doc.to_dict().get("instructor_id")
            if instructor_id:
                db.collection("notifications").add({
                    "user_id": instructor_id,
                    "type": "module_comment",
                    "thread_id": thread_id,
                    "module_id": module_id,
                    "course_id": course_id,
                    "message": f"New question in {module_data.get('title', 'a module')} by {current_user.get('name', 'A student')}",
                    "is_read": False,
                    "created_at": now
                })

    return success_response(data=data, message="Comment added")
