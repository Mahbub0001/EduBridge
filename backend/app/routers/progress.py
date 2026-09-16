from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from pydantic import BaseModel
from datetime import datetime, timezone
from ..core.dependencies import get_current_user
from ..core.firebase import get_db
from ..core.cache import cache_response, invalidate_cache
from ..utils.response import success_response
from .certificates import issue_course_certificate

router = APIRouter()


class LessonCompletePayload(BaseModel):
    lesson_id: str
    course_id: str


@router.get("/courses/{course_id}/progress")
@cache_response(ttl=60, prefix="progress", is_user_scoped=True)
def get_course_progress(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    progress_docs = (
        db.collection("progress")
        .where("user_id", "==", uid)
        .where("course_id", "==", course_id)
        .stream()
    )
    completed_lessons = [p.to_dict().get("lesson_id") for p in progress_docs if p.to_dict().get("lesson_id")]

    total_lessons = len(list(db.collection("lessons").where("course_id", "==", course_id).stream()))
    progress_percent = round((len(completed_lessons) / max(total_lessons, 1)) * 100, 1)

    # find last completed lesson
    last_lesson_id = completed_lessons[-1] if completed_lessons else None

    return success_response(data={
        "course_id": course_id,
        "progress_percent": progress_percent,
        "completed_lessons": completed_lessons,
        "last_lesson_id": last_lesson_id,
        "total_lessons": total_lessons,
    })


@router.post("/lesson-complete")
def mark_lesson_complete(
    payload: LessonCompletePayload,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    existing = list(
        db.collection("progress")
        .where("user_id", "==", uid)
        .where("lesson_id", "==", payload.lesson_id)
        .stream()
    )

    total = len(list(db.collection("lessons").where("course_id", "==", payload.course_id).stream()))

    if existing:
        completed_count = len(list(
            db.collection("progress")
            .where("user_id", "==", uid)
            .where("course_id", "==", payload.course_id)
            .stream()
        ))
        pct = round((completed_count / max(total, 1)) * 100, 1)
        cert_id = None
        if pct >= 100:
            cert = issue_course_certificate(db, uid, payload.course_id, current_user.get("name"))
            cert_id = cert.get("id") if cert else None

        return success_response(
            data={"completed": True, "progress_percent": pct, "is_course_completed": pct >= 100, "certificate_id": cert_id},
            message="Already completed"
        )

    now = datetime.now(timezone.utc)
    db.collection("progress").add({
        "user_id": uid,
        "course_id": payload.course_id,
        "lesson_id": payload.lesson_id,
        "completed": True,
        "completed_at": now,
        "last_accessed_at": now,
    })

    # update enrollment progress
    completed = len(list(
        db.collection("progress")
        .where("user_id", "==", uid)
        .where("course_id", "==", payload.course_id)
        .stream()
    ))
    pct = round((completed / max(total, 1)) * 100, 1)
    is_course_completed = pct >= 100

    enroll_docs = (
        db.collection("enrollments")
        .where("user_id", "==", uid)
        .where("course_id", "==", payload.course_id)
        .limit(1)
        .get()
    )
    for e in enroll_docs:
        update_data = {"progress_percent": pct}
        if is_course_completed:
            update_data["status"] = "completed"
            update_data["completed_at"] = now
            update_data["final_grade"] = round(70 + pct * 0.3, 1)
        e.reference.update(update_data)

    cert_id = None
    if is_course_completed:
        cert = issue_course_certificate(db, uid, payload.course_id, current_user.get("name"))
        cert_id = cert.get("id") if cert else None

    invalidate_cache(["edubridge:progress*", "edubridge:enrollments*", "edubridge:analytics*", "edubridge:courses*", "edubridge:instructor*", "edubridge:certificates*", "edubridge:unlock_status*", "unlock_status"])
    return success_response(
        data={
            "completed": True,
            "progress_percent": pct,
            "is_course_completed": is_course_completed,
            "certificate_id": cert_id,
        },
        message="Lesson marked complete"
    )

