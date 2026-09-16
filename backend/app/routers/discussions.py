from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from ..core.dependencies import get_current_user
from ..core.firebase import get_db
from ..core.cache import cache_response, invalidate_cache
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
    student_id: Optional[str] = None


@router.get("/courses/{course_id}")
@cache_response(ttl=45, prefix="discussions")
def get_course_discussions(
    course_id: str,
    db: Client = Depends(get_db)
):
    docs = list(db.collection("discussions").where("course_id", "==", course_id).stream())
    if not docs:
        return success_response(data=[])

    threads = []
    thread_ids = []
    needed_user_ids = set()

    for d in docs:
        dd = d.to_dict()
        if dd.get("is_module_feedback") is True:
            continue
        dd["id"] = d.id
        threads.append(dd)
        thread_ids.append(d.id)
        if dd.get("author_id"):
            needed_user_ids.add(dd["author_id"])

    if not threads:
        return success_response(data=[])

    # Batch fetch replies for all threads in chunks of 10
    replies_by_thread = {}
    for i in range(0, len(thread_ids), 10):
        chunk = thread_ids[i:i+10]
        reply_docs = db.collection("discussion_replies").where("thread_id", "in", chunk).stream()
        for r in reply_docs:
            rd = r.to_dict()
            rd["id"] = r.id
            tid = rd.get("thread_id")
            if tid:
                replies_by_thread.setdefault(tid, []).append(rd)
            if rd.get("author_id"):
                needed_user_ids.add(rd["author_id"])

    # Batch fetch all unique authors in a single db.get_all call
    users_map = {}
    if needed_user_ids:
        user_refs = [db.collection("users").document(uid) for uid in needed_user_ids]
        user_docs = db.get_all(user_refs)
        for u in user_docs:
            if u.exists:
                users_map[u.id] = u.to_dict()

    results = []
    for dd in threads:
        author = users_map.get(dd.get("author_id", ""), {})
        dd["author_name"] = author.get("name", "Unknown")
        dd["author_photo"] = author.get("photo_url", "")
        
        thread_replies = replies_by_thread.get(dd["id"], [])
        thread_replies.sort(key=lambda r: r.get("created_at") or datetime.min.replace(tzinfo=timezone.utc))
        for rd in thread_replies:
            reply_author = users_map.get(rd.get("author_id", ""), {})
            rd["author_name"] = reply_author.get("name", "Unknown")
            rd["author_photo"] = reply_author.get("photo_url", "")
        
        dd["replies"] = thread_replies
        dd["reply_count"] = len(thread_replies)
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
    invalidate_cache(["edubridge:discussions*"])
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
    invalidate_cache(["edubridge:discussions*"])
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
    invalidate_cache(["edubridge:discussions*"])
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
    invalidate_cache(["edubridge:discussions*"])
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
    
    # Privacy guard: Students only see their own questions & instructor answers addressed to them
    if user_role not in ["instructor", "admin", "super_admin"]:
        filtered = []
        for r in replies_raw:
            rd = r.to_dict()
            s_id = rd.get("student_id")
            a_id = rd.get("author_id")
            if s_id and s_id == user_id:
                filtered.append(r)
            elif not s_id and not rd.get("is_instructor") and a_id == user_id:
                filtered.append(r)
        replies_raw = filtered

    replies_raw.sort(key=lambda r: r.to_dict().get("created_at") or datetime.min.replace(tzinfo=timezone.utc))
    
    needed_uids = {r.to_dict().get("author_id") for r in replies_raw if r.to_dict().get("author_id")}
    authors_map = {}
    if needed_uids:
        user_refs = [db.collection("users").document(uid) for uid in needed_uids]
        user_docs = db.get_all(user_refs)
        for u in user_docs:
            if u.exists:
                authors_map[u.id] = u.to_dict()

    reply_list = []
    for r in replies_raw:
        rd = r.to_dict()
        rd["id"] = r.id
        author = authors_map.get(rd.get("author_id", ""), {})
        rd["author_name"] = author.get("name", "Unknown")
        rd["author_photo"] = author.get("photo_url", "")
        rd["author_role"] = author.get("role", "")
        rd["student_id"] = rd.get("student_id", "")
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
            "title": f"Module: {module_data.get('title', 'Untitled')} — Feedback & Questions",
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
    target_student_id = comment.student_id if (is_instructor and comment.student_id) else (user_id if not is_instructor else "")
    data = {
        "thread_id": thread_id,
        "author_id": user_id,
        "student_id": target_student_id,
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
