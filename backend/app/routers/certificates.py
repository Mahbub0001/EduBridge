from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from typing import Optional
from ..core.dependencies import get_current_user
from ..core.firebase import get_db
from ..utils.response import success_response
from pydantic import BaseModel

router = APIRouter()


class GenerateCertificatePayload(BaseModel):
    course_id: str


def issue_course_certificate(db: Client, uid: str, course_id: str, student_name_override: Optional[str] = None):
    """Helper to issue or retrieve a course completion certificate."""
    existing = (
        db.collection("certificates")
        .where("user_id", "==", uid)
        .where("course_id", "==", course_id)
        .limit(1)
        .get()
    )
    for ex in existing:
        ed = ex.to_dict()
        ed["id"] = ex.id
        ed["valid"] = True
        return ed

    course_doc = db.collection("courses").document(course_id).get()
    course_data = course_doc.to_dict() if course_doc.exists else {}
    course_title = course_data.get("title", "Course")
    instructor_name = course_data.get("instructor_name") or "EduBridge Academy Instructor"
    instructor_signature_url = course_data.get("instructor_signature_url") or ""

    user_doc = db.collection("users").document(uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}
    student_name = student_name_override or user_data.get("name") or user_data.get("full_name") or "Student"

    now = datetime.now(timezone.utc)
    cert_data = {
        "user_id": uid,
        "course_id": course_id,
        "course_title": course_title,
        "student_name": student_name,
        "instructor_name": instructor_name,
        "instructor_signature_url": instructor_signature_url,
        "issued_at": now.isoformat(),
        "valid": True,
    }
    _, ref = db.collection("certificates").add(cert_data)
    cert_data["id"] = ref.id
    cert_data["certificate_url"] = f"/verify-certificate/{ref.id}"
    ref.update({"certificate_url": cert_data["certificate_url"]})
    return cert_data


@router.get("/")
def get_my_certificates(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    docs = (
        db.collection("certificates")
        .where("user_id", "==", uid)
        .stream()
    )
    results = []
    for d in docs:
        cd = d.to_dict()
        cd["id"] = d.id
        cd["valid"] = True
        if not cd.get("course_title"):
            course_doc = db.collection("courses").document(cd.get("course_id", "")).get()
            if course_doc.exists:
                cd["course_title"] = course_doc.to_dict().get("title", "Course")
        results.append(cd)

    results.sort(key=lambda c: str(c.get("issued_at") or ""), reverse=True)
    return success_response(data=results)


@router.post("/generate")
def generate_certificate(
    payload: GenerateCertificatePayload,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]

    # Check enrollment is completed
    enrollments = (
        db.collection("enrollments")
        .where("user_id", "==", uid)
        .where("course_id", "==", payload.course_id)
        .limit(1)
        .get()
    )
    is_completed = False
    for e in enrollments:
        if e.to_dict().get("status") == "completed" or (e.to_dict().get("progress_percent") or 0) >= 100:
            is_completed = True

    if not is_completed:
        raise HTTPException(status_code=400, detail="Course not yet completed")

    student_name = current_user.get("name") or current_user.get("full_name")
    cert_data = issue_course_certificate(db, uid, payload.course_id, student_name_override=student_name)
    return success_response(data=cert_data, message="Certificate generated")


@router.get("/verify/{certificate_id}")
def verify_certificate(
    certificate_id: str,
    db: Client = Depends(get_db),
):
    doc = db.collection("certificates").document(certificate_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Certificate not found")
    data = doc.to_dict()
    data["id"] = doc.id
    data["valid"] = True
    user_doc = db.collection("users").document(data.get("user_id", "")).get()
    data["student_name"] = data.get("student_name") or (user_doc.to_dict().get("name") if user_doc.exists else "Student")
    data["user_name"] = data["student_name"]

    course_doc = db.collection("courses").document(data.get("course_id", "")).get()
    if course_doc.exists:
        cdata = course_doc.to_dict()
        data["course_title"] = data.get("course_title") or cdata.get("title", "Course")
        data["instructor_name"] = data.get("instructor_name") or cdata.get("instructor_name", "EduBridge Academy Instructor")
        data["instructor_signature_url"] = data.get("instructor_signature_url") or cdata.get("instructor_signature_url", "")
    return success_response(data=data)




