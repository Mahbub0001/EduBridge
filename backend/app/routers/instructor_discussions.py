from fastapi import APIRouter, Depends, HTTPException, Query
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from typing import Optional
from ..core.dependencies import require_instructor
from ..core.firebase import get_db
from ..utils.response import success_response

router = APIRouter()


@router.get("/discussions")
def get_instructor_discussions(
    course_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    query = db.collection("discussions").order_by("created_at", direction="DESCENDING")

    discussions = list(query.stream())
    results = []
    seen_module_ids = set()

    for d in discussions:
        dd = d.to_dict()
        dd["id"] = d.id

        # Apply filters
        if course_id and dd.get("course_id") != course_id:
            continue
        if module_id and dd.get("module_id") != module_id:
            continue

        # Hydrate course title
        course_doc = db.collection("courses").document(dd.get("course_id", "")).get()
        dd["course_title"] = course_doc.to_dict().get("title", "Unknown Course") if course_doc.exists else "Unknown Course"

        # Hydrate module title for module discussions
        if dd.get("is_module_feedback") and dd.get("module_id"):
            module_doc = db.collection("modules").document(dd["module_id"]).get()
            dd["module_title"] = module_doc.to_dict().get("title", "Unknown Module") if module_doc.exists else "Unknown Module"

        # Count replies
        replies = list(db.collection("discussion_replies").where("thread_id", "==", d.id).stream())
        dd["reply_count"] = len(replies)

        # Author info
        author_doc = db.collection("users").document(dd.get("author_id", "")).get()
        dd["author_name"] = author_doc.to_dict().get("name", "Unknown") if author_doc.exists else "Unknown"
        dd["author_photo"] = author_doc.to_dict().get("photo_url", "") if author_doc.exists else ""

        results.append(dd)

        if dd.get("module_id"):
            seen_module_ids.add(dd["module_id"])

    return success_response(data=results)


@router.get("/discussions/{thread_id}")
def get_instructor_discussion_detail(
    thread_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    thread_ref = db.collection("discussions").document(thread_id)
    thread_doc = thread_ref.get()
    if not thread_doc.exists:
        raise HTTPException(status_code=404, detail="Discussion not found")

    dd = thread_doc.to_dict()
    dd["id"] = thread_doc.id

    # Hydrate course
    course_doc = db.collection("courses").document(dd.get("course_id", "")).get()
    dd["course_title"] = course_doc.to_dict().get("title", "Unknown Course") if course_doc.exists else "Unknown Course"

    # Author
    author_doc = db.collection("users").document(dd.get("author_id", "")).get()
    dd["author_name"] = author_doc.to_dict().get("name", "Unknown") if author_doc.exists else "Unknown"
    dd["author_photo"] = author_doc.to_dict().get("photo_url", "") if author_doc.exists else ""

    # Replies
    replies = list(db.collection("discussion_replies").where("thread_id", "==", thread_id).order_by("created_at").stream())
    reply_list = []
    for r in replies:
        rd = r.to_dict()
        rd["id"] = r.id
        reply_author = db.collection("users").document(rd.get("author_id", "")).get()
        rd["author_name"] = reply_author.to_dict().get("name", "Unknown") if reply_author.exists else "Unknown"
        rd["author_photo"] = reply_author.to_dict().get("photo_url", "") if reply_author.exists else ""
        rd["author_role"] = reply_author.to_dict().get("role", "") if reply_author.exists else ""
        rd["is_instructor"] = rd.get("author_role") in ["instructor", "admin", "super_admin"]
        reply_list.append(rd)

    dd["replies"] = reply_list
    dd["reply_count"] = len(reply_list)
    return success_response(data=dd)


@router.post("/discussions/{thread_id}/reply")
def instructor_reply_to_discussion(
    thread_id: str,
    body: dict,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    thread_ref = db.collection("discussions").document(thread_id)
    thread_doc = thread_ref.get()
    if not thread_doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")

    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content is required")

    now = datetime.now(timezone.utc)
    data = {
        "thread_id": thread_id,
        "author_id": current_user["id"],
        "content": content,
        "is_instructor": True,
        "created_at": now
    }
    _, ref = db.collection("discussion_replies").add(data)
    data["id"] = ref.id

    # Notify students who have commented in this thread
    thread_data = thread_doc.to_dict()
    course_id = thread_data.get("course_id")
    commenters = set()
    existing_replies = db.collection("discussion_replies").where("thread_id", "==", thread_id).stream()
    for r in existing_replies:
        rd = r.to_dict()
        author_id = rd.get("author_id")
        if author_id and author_id != current_user["id"]:
            commenters.add(author_id)

    module_title = "a module"
    if thread_data.get("module_id"):
        mod_doc = db.collection("modules").document(thread_data["module_id"]).get()
        if mod_doc.exists:
            module_title = mod_doc.to_dict().get("title", "a module")

    for commenter_id in commenters:
        db.collection("notifications").add({
            "user_id": commenter_id,
            "type": "module_reply",
            "thread_id": thread_id,
            "module_id": thread_data.get("module_id", ""),
            "course_id": course_id or "",
            "message": f"Instructor replied in {module_title}",
            "is_read": False,
            "created_at": now
        })

    return success_response(data=data, message="Reply posted")


@router.patch("/discussions/{thread_id}/pin")
def instructor_pin_discussion(
    thread_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(thread_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    current = doc.to_dict().get("is_pinned", False)
    ref.update({"is_pinned": not current})
    return success_response(message="Pin status toggled")


@router.patch("/discussions/{thread_id}/hide")
def instructor_hide_discussion(
    thread_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(thread_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    current = doc.to_dict().get("is_hidden", False)
    ref.update({"is_hidden": not current})
    return success_response(message="Visibility toggled")


@router.patch("/discussions/{thread_id}/answered")
def instructor_toggle_answered(
    thread_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(thread_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    current = doc.to_dict().get("is_answered", False)
    ref.update({"is_answered": not current})
    return success_response(message="Answered status toggled")


@router.delete("/discussions/{thread_id}")
def instructor_delete_discussion(
    thread_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(thread_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    replies = db.collection("discussion_replies").where("thread_id", "==", thread_id).stream()
    for r in replies:
        db.collection("discussion_replies").document(r.id).delete()
    ref.delete()
    return success_response(message="Discussion deleted")
