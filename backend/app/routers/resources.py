from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from ..core.dependencies import get_current_user, require_instructor
from ..core.firebase import get_db
from ..utils.response import success_response
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


class ResourceCreate(BaseModel):
    course_id: str
    title: str
    type: str  # pdf, video, slides, link
    url: Optional[str] = None
    size: Optional[str] = None


@router.get("/resources")
def get_resources(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    enrollments = (
        db.collection("enrollments")
        .where("user_id", "==", uid)
        .stream()
    )
    course_ids = set()
    for e in enrollments:
        course_ids.add(e.to_dict()["course_id"])

    wish_docs = (
        db.collection("wishlist")
        .where("user_id", "==", uid)
        .stream()
    )
    for w in wish_docs:
        course_ids.add(w.to_dict()["course_id"])

    results = []
    for cid in course_ids:
        course_doc = db.collection("courses").document(cid).get()
        course_name = course_doc.to_dict().get("title", "") if course_doc.exists else ""
        resources = (
            db.collection("resources")
            .where("course_id", "==", cid)
            .stream()
        )
        for r in resources:
            rd = r.to_dict()
            rd["id"] = r.id
            rd["course_name"] = course_name
            results.append(rd)

    if not results:
        return success_response(data=[])

    return success_response(data=results)


@router.get("/courses/{course_id}/resources")
def get_course_resources(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    docs = db.collection("resources").where("course_id", "==", course_id).stream()
    results = []
    for d in docs:
        rd = d.to_dict()
        rd["id"] = d.id
        results.append(rd)

    course_doc = db.collection("courses").document(course_id).get()
    course_name = course_doc.to_dict().get("title", "") if course_doc.exists else ""
    for r in results:
        r["course_name"] = course_name

    return success_response(data=results)


@router.post("/resources")
def create_resource(
    resource: ResourceCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    data = resource.model_dump()
    data["created_at"] = now
    _, ref = db.collection("resources").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Resource created")


@router.delete("/resources/{resource_id}")
def delete_resource(
    resource_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("resources").document(resource_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    ref.delete()
    return success_response(message="Resource deleted")
