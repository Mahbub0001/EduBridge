from fastapi import APIRouter, Depends, HTTPException, Query
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from ..core.dependencies import get_current_user, require_admin
from ..core.firebase import get_db
from ..core.cache import cache_response, invalidate_cache
from ..utils.response import success_response

router = APIRouter()


@router.get("/")
@cache_response(ttl=60, prefix="announcements")
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
    invalidate_cache(["edubridge:announcements*"])
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
    invalidate_cache(["edubridge:announcements*"])
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


# ── STUDENT ANNOUNCEMENTS & UNREAD TRACKING ──

@router.get("/student")
def get_student_all_announcements(
    course_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    unread_only: Optional[bool] = Query(False),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]

    # 1. Fetch student's enrollments to determine their courses
    enroll_docs = list(db.collection("enrollments").where("user_id", "==", uid).stream())
    enrolled_course_ids = [e.to_dict().get("course_id") for e in enroll_docs if e.to_dict().get("course_id")]

    if not enrolled_course_ids:
        return success_response(data={"announcements": [], "unread_count": 0, "enrolled_courses": []})

    # Filter by specific course if provided
    if course_id:
        target_course_ids = [course_id] if course_id in enrolled_course_ids else []
    else:
        target_course_ids = enrolled_course_ids

    # 2. Batch fetch enrolled courses for titles
    course_map = {}
    for i in range(0, len(enrolled_course_ids), 100):
        chunk = enrolled_course_ids[i:i+100]
        refs = [db.collection("courses").document(cid) for cid in chunk]
        for cdoc in db.get_all(refs):
            if cdoc.exists:
                course_map[cdoc.id] = cdoc.to_dict().get("title", "Course")

    courses_list = [{"id": cid, "title": course_map.get(cid, "Course")} for cid in enrolled_course_ids]

    if not target_course_ids:
        return success_response(data={"announcements": [], "unread_count": 0, "enrolled_courses": courses_list})

    # 3. Fetch published announcements for target courses
    raw_announcements = []
    for i in range(0, len(target_course_ids), 30):
        chunk = target_course_ids[i:i+30]
        docs = db.collection("announcements").where("course_id", "in", chunk).where("status", "==", "published").stream()
        for d in docs:
            ad = d.to_dict()
            ad["id"] = d.id
            raw_announcements.append(ad)

    if not raw_announcements:
        return success_response(data={"announcements": [], "unread_count": 0, "enrolled_courses": courses_list})

    # 4. Fetch student's read receipts from announcement_reads
    read_docs = list(db.collection("announcement_reads").where("user_id", "==", uid).stream())
    read_ann_ids = {rd.to_dict().get("announcement_id") for rd in read_docs}

    # 5. Batch fetch module titles for module-targeted announcements
    module_ids = list({ad["module_id"] for ad in raw_announcements if ad.get("target") == "module" and ad.get("module_id")})
    module_map = {}
    if module_ids:
        for i in range(0, len(module_ids), 100):
            chunk = module_ids[i:i+100]
            refs = [db.collection("modules").document(mid) for mid in chunk]
            for mdoc in db.get_all(refs):
                if mdoc.exists:
                    module_map[mdoc.id] = mdoc.to_dict().get("title", "Module")

    # 6. Batch fetch author names
    author_ids = list({ad.get("author_id") for ad in raw_announcements if ad.get("author_id")})
    author_map = {}
    if author_ids:
        for i in range(0, len(author_ids), 100):
            chunk = author_ids[i:i+100]
            refs = [db.collection("users").document(aid) for aid in chunk]
            for udoc in db.get_all(refs):
                if udoc.exists:
                    author_map[udoc.id] = udoc.to_dict().get("name", "Instructor")

    total_unread = 0
    formatted = []
    for ad in raw_announcements:
        is_read = ad["id"] in read_ann_ids
        if not is_read:
            total_unread += 1

        # Filter by module if specified
        if module_id and ad.get("module_id") != module_id:
            continue

        # Filter by unread if specified
        if unread_only and is_read:
            continue

        ad["is_read"] = is_read
        ad["course_title"] = course_map.get(ad.get("course_id"), "Course")
        if ad.get("target") == "module" and ad.get("module_id"):
            ad["module_title"] = module_map.get(ad.get("module_id"), "Module")
        else:
            ad["module_title"] = None

        ad["author_name"] = author_map.get(ad.get("author_id"), "Instructor")
        formatted.append(ad)

    def safe_sort_key(item):
        val = item.get("published_at") or item.get("created_at")
        if isinstance(val, datetime):
            return val.isoformat()
        return str(val or "")

    formatted.sort(key=safe_sort_key, reverse=True)

    return success_response(data={
        "announcements": formatted,
        "unread_count": total_unread,
        "enrolled_courses": courses_list
    })


@router.get("/student/unread-count")
def get_student_unread_count(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    enroll_docs = list(db.collection("enrollments").where("user_id", "==", uid).stream())
    enrolled_course_ids = [e.to_dict().get("course_id") for e in enroll_docs if e.to_dict().get("course_id")]
    if not enrolled_course_ids:
        return success_response(data={"unread_count": 0})

    ann_ids = []
    for i in range(0, len(enrolled_course_ids), 30):
        chunk = enrolled_course_ids[i:i+30]
        docs = db.collection("announcements").where("course_id", "in", chunk).where("status", "==", "published").stream()
        ann_ids.extend([d.id for d in docs])

    if not ann_ids:
        return success_response(data={"unread_count": 0})

    read_docs = list(db.collection("announcement_reads").where("user_id", "==", uid).stream())
    read_ann_ids = {rd.to_dict().get("announcement_id") for rd in read_docs}

    unread_count = sum(1 for aid in ann_ids if aid not in read_ann_ids)
    return success_response(data={"unread_count": unread_count})


@router.post("/student/read-all")
def mark_all_announcements_read(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    enroll_docs = list(db.collection("enrollments").where("user_id", "==", uid).stream())
    enrolled_course_ids = [e.to_dict().get("course_id") for e in enroll_docs if e.to_dict().get("course_id")]
    if not enrolled_course_ids:
        return success_response(message="All announcements marked as read")

    ann_ids = []
    for i in range(0, len(enrolled_course_ids), 30):
        chunk = enrolled_course_ids[i:i+30]
        docs = db.collection("announcements").where("course_id", "in", chunk).where("status", "==", "published").stream()
        ann_ids.extend([d.id for d in docs])

    now = datetime.now(timezone.utc)
    batch = db.batch()
    for aid in ann_ids:
        ref = db.collection("announcement_reads").document(f"{uid}_{aid}")
        batch.set(ref, {
            "user_id": uid,
            "announcement_id": aid,
            "read_at": now
        }, merge=True)
    batch.commit()

    return success_response(message="All announcements marked as read")


@router.post("/{announcement_id}/read")
def mark_announcement_read(
    announcement_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    doc_id = f"{uid}_{announcement_id}"
    now = datetime.now(timezone.utc)
    db.collection("announcement_reads").document(doc_id).set({
        "user_id": uid,
        "announcement_id": announcement_id,
        "read_at": now
    }, merge=True)
    return success_response(message="Announcement marked as read")

