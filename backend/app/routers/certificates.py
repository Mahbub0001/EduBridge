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


@router.get("/")
def get_my_certificates(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    docs = (
        db.collection("certificates")
        .where("user_id", "==", uid)
        .order_by("issued_at", direction="DESCENDING")
        .stream()
    )
    results = []
    for d in docs:
        cd = d.to_dict()
        cd["id"] = d.id
        course_doc = db.collection("courses").document(cd.get("course_id", "")).get()
        if course_doc.exists:
            cd["course_title"] = course_doc.to_dict().get("title", "Course")
        results.append(cd)

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
        if e.to_dict().get("status") == "completed":
            is_completed = True

    if not is_completed:
        raise HTTPException(status_code=400, detail="Course not yet completed")

    # Check if already exists
    existing = (
        db.collection("certificates")
        .where("user_id", "==", uid)
        .where("course_id", "==", payload.course_id)
        .get()
    )
    for ex in existing:
        ed = ex.to_dict()
        ed["id"] = ex.id
        return success_response(data=ed, message="Certificate already exists")

    course_doc = db.collection("courses").document(payload.course_id).get()
    course_title = course_doc.to_dict().get("title", "Course") if course_doc.exists else "Course"

    now = datetime.now(timezone.utc)
    cert_data = {
        "user_id": uid,
        "course_id": payload.course_id,
        "course_title": course_title,
        "issued_at": now,
        "certificate_url": f"https://edubridge.app/certificates/{uid[:8]}-{payload.course_id[:8]}",
    }
    _, ref = db.collection("certificates").add(cert_data)
    cert_data["id"] = ref.id
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
    user_doc = db.collection("users").document(data.get("user_id", "")).get()
    data["user_name"] = user_doc.to_dict().get("name", "Unknown") if user_doc.exists else "Unknown"
    return success_response(data=data)



