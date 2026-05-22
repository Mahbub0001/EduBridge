from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from ..core.dependencies import get_current_user, require_instructor
from ..core.firebase import get_db
from ..utils.response import success_response
from ..schemas.assessment import AssignmentSubmit

router = APIRouter()

@router.get("/courses/{course_id}/assignments")
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
    if not assignment_ref.get().exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    now = datetime.now(timezone.utc)
    submission_data = {
        "assignment_id": assignment_id,
        "user_id": current_user["id"],
        "submission_text": submission.submission_text,
        "file_url": submission.file_url,
        "submitted_at": now,
        "status": "pending"
    }
    
    _, doc_ref = db.collection("assignment_submissions").add(submission_data)
    submission_data["id"] = doc_ref.id
    
    return success_response(data=submission_data, message="Assignment submitted successfully")


@router.get("/assignments/{assignment_id}/submission")
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
        .limit(1)
        .get()
    )
    for d in docs:
        sd = d.to_dict()
        sd["id"] = d.id
        return success_response(data=sd)
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
    return success_response(data=updated, message="Submission graded")
