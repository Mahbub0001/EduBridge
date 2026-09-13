from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from ..core.dependencies import get_current_user, require_instructor
from ..core.firebase import get_db
from ..core.cache import cache_response, invalidate_cache
from ..utils.response import success_response
from ..schemas.assessment import AssignmentSubmit

router = APIRouter()

@router.get("/courses/{course_id}/assignments")
@cache_response(ttl=120, prefix="assignments")
def get_course_assignments(course_id: str, db: Client = Depends(get_db)):
    docs = db.collection("assignments").where("course_id", "==", course_id).stream()
    assignments = []
    for doc in docs:
        a = doc.to_dict()
        a["id"] = doc.id
        assignments.append(a)
    return success_response(data=assignments)

@router.post("/assignments/{assignment_id}/submit")
def submit_assignment(
    assignment_id: str,
    submission: AssignmentSubmit,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    assignment_ref = db.collection("assignments").document(assignment_id)
    assignment_doc = assignment_ref.get()
    if not assignment_doc.exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    assignment_data = assignment_doc.to_dict()
    course_id = assignment_data.get("course_id", "")
    now = datetime.now(timezone.utc)
    submission_data = {
        "assignment_id": assignment_id,
        "course_id": course_id,
        "user_id": current_user["id"],
        "submission_text": submission.submission_text,
        "file_url": submission.file_url,
        "submitted_at": now,
        "status": "pending"
    }
    
    # Check if user already has a submission (e.g. resubmitting after revision)
    existing_docs = list(
        db.collection("assignment_submissions")
        .where("assignment_id", "==", assignment_id)
        .where("user_id", "==", current_user["id"])
        .stream()
    )
    is_resubmission = False
    if existing_docs:
        existing_data = existing_docs[0].to_dict()
        is_resubmission = (
            existing_data.get("status") in ["revision", "returned"]
            or existing_data.get("is_resubmission", False)
            or bool(existing_data.get("feedback"))
        )
        prev_feedback = existing_data.get("feedback") or existing_data.get("previous_feedback")

        submission_data["is_resubmission"] = is_resubmission
        submission_data["status"] = "resubmitted" if is_resubmission else "pending"
        if is_resubmission:
            submission_data["resubmitted_at"] = now
            if prev_feedback:
                submission_data["previous_feedback"] = prev_feedback
            submission_data["revision_count"] = existing_data.get("revision_count", 0) + 1

        doc_ref = existing_docs[0].reference
        doc_ref.update(submission_data)
        submission_data["id"] = doc_ref.id
    else:
        submission_data["is_resubmission"] = False
        submission_data["status"] = "pending"
        _, doc_ref = db.collection("assignment_submissions").add(submission_data)
        submission_data["id"] = doc_ref.id

    # Notify course instructor about the submission
    course_doc = db.collection("courses").document(course_id).get() if course_id else None
    if course_doc and course_doc.exists:
        c_data = course_doc.to_dict()
        instructor_id = c_data.get("instructor_id")
        course_title = c_data.get("title", "Course")
        assign_title = assignment_data.get("title", "Assignment")
        student_name = current_user.get("name", "A student")

        if instructor_id:
            if is_resubmission:
                notif_title = f"Revised Assignment Submitted: {student_name}"
                notif_msg = f"{student_name} has submitted revised work for '{assign_title}' in {course_title}."
            else:
                notif_title = f"New Assignment Submission: {student_name}"
                notif_msg = f"{student_name} submitted '{assign_title}' in {course_title}."

            db.collection("notifications").add({
                "user_id": instructor_id,
                "title": notif_title,
                "message": notif_msg,
                "type": "assignment_submission",
                "course_id": course_id,
                "assignment_id": assignment_id,
                "link": f"/instructor/assignments?courseId={course_id}&assignmentId={assignment_id}",
                "read": False,
                "is_read": False,
                "created_at": now
            })
            invalidate_cache([f"edubridge:instructor:{instructor_id}*"])

    invalidate_cache(["edubridge:analytics*", "edubridge:instructor*", "edubridge:assignments*", "edubridge:submissions*", "edubridge:instructor_submissions*", f"edubridge:student_progress:{current_user['id']}*"])
    
    return success_response(data=submission_data, message="Assignment submitted successfully")


@router.get("/assignments/{assignment_id}/submission")
@cache_response(ttl=60, prefix="submissions", is_user_scoped=True)
def get_my_submission(
    assignment_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    docs = (
        db.collection("assignment_submissions")
        .where("assignment_id", "==", assignment_id)
        .where("user_id", "==", uid)
        .stream()
    )
    all_subs = []
    for d in docs:
        sd = d.to_dict()
        sd["id"] = d.id
        all_subs.append(sd)
    if all_subs:
        all_subs.sort(key=lambda s: str(s.get("submitted_at") or ""), reverse=True)
        return success_response(data=all_subs[0])
    return success_response(data=None)


@router.get("/assignments/{assignment_id}")
def get_assignment(
    assignment_id: str,
    db: Client = Depends(get_db),
):
    doc = db.collection("assignments").document(assignment_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return success_response(data=data)


class AssignmentCreate(BaseModel):
    title: str
    course_id: str
    instructions: Optional[str] = ""
    due_date: Optional[str] = None
    total_marks: Optional[int] = 100


class GradeSubmission(BaseModel):
    score: float
    feedback: Optional[str] = ""


@router.post("/courses/{course_id}/assignments")
def create_assignment(
    course_id: str,
    assignment: AssignmentCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    data = assignment.model_dump()
    data["created_at"] = now
    data["updated_at"] = now
    if data.get("due_date"):
        data["due_date"] = str(data["due_date"])
    _, ref = db.collection("assignments").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Assignment created")


@router.put("/assignments/{assignment_id}")
def update_assignment(
    assignment_id: str,
    assignment: AssignmentCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("assignments").document(assignment_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
    data = assignment.model_dump()
    data["updated_at"] = datetime.now(timezone.utc)
    ref.update(data)
    updated = ref.get().to_dict()
    updated["id"] = assignment_id
    return success_response(data=updated, message="Assignment updated")


@router.delete("/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("assignments").document(assignment_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
    ref.delete()
    return success_response(message="Assignment deleted")


@router.get("/assignments/{assignment_id}/submissions")
def get_assignment_submissions(
    assignment_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    docs = db.collection("assignment_submissions").where("assignment_id", "==", assignment_id).stream()
    submissions = []
    for d in docs:
        sd = d.to_dict()
        sd["id"] = d.id
        user_doc = db.collection("users").document(sd.get("user_id", "")).get()
        sd["student_name"] = user_doc.to_dict().get("name", "Unknown") if user_doc.exists else "Unknown"
        submissions.append(sd)
    return success_response(data=submissions)


@router.patch("/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: str,
    grade: GradeSubmission,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("assignment_submissions").document(submission_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Submission not found")
    now = datetime.now(timezone.utc)
    ref.update({
        "score": grade.score,
        "feedback": grade.feedback,
        "status": "graded",
        "graded_at": now,
        "graded_by": current_user["id"]
    })
    updated = ref.get().to_dict()
    updated["id"] = submission_id
    invalidate_cache(["edubridge:analytics*", "edubridge:instructor*", "edubridge:assignments*"])
    return success_response(data=updated, message="Submission graded")
