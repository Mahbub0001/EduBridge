from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from pydantic import BaseModel
from datetime import datetime, timezone
from ..core.dependencies import get_current_user
from ..core.firebase import get_db
from ..utils.response import success_response

router = APIRouter()


class LessonCompletePayload(BaseModel):
    lesson_id: str
    course_id: str


@router.get("/courses/{course_id}/progress")
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


@router.post("/progress/lesson-complete")
def mark_lesson_complete(
    payload: LessonCompletePayload,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    existing = (
        db.collection("progress")
        .where("user_id", "==", uid)
        .where("lesson_id", "==", payload.lesson_id)
        .get()
    )
    if existing:
        return success_response(data={"completed": True, "progress_percent": None}, message="Already completed")

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
    total = len(list(db.collection("lessons").where("course_id", "==", payload.course_id).stream()))
    completed = len(list(
        db.collection("progress")
        .where("user_id", "==", uid)
        .where("course_id", "==", payload.course_id)
        .stream()
    ))
    pct = round((completed / max(total, 1)) * 100, 1)

    enroll_docs = (
        db.collection("enrollments")
        .where("user_id", "==", uid)
        .where("course_id", "==", payload.course_id)
        .limit(1)
        .get()
    )
    for e in enroll_docs:
        update_data = {"progress_percent": pct}
        if pct >= 100:
            update_data["status"] = "completed"
            update_data["completed_at"] = now
            update_data["final_grade"] = round(70 + pct * 0.3, 1)
        e.reference.update(update_data)

    return success_response(data={"completed": True, "progress_percent": pct}, message="Lesson marked complete")
