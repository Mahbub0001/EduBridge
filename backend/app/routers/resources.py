from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from ..core.dependencies import get_current_user, require_instructor
from ..core.firebase import get_db
from ..core.cache import cache_response, invalidate_cache
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
@cache_response(ttl=60, prefix="resources", is_user_scoped=True)
def get_resources(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    enrollments = list(
        db.collection("enrollments")
        .where("user_id", "==", uid)
        .stream()
    )
    course_ids = {e.to_dict()["course_id"] for e in enrollments if e.to_dict().get("course_id")}

    wish_docs = list(
        db.collection("wishlist")
        .where("user_id", "==", uid)
        .stream()
    )
    for w in wish_docs:
        if w.to_dict().get("course_id"):
            course_ids.add(w.to_dict()["course_id"])

    if not course_ids:
        return success_response(data=[])

    course_list = list(course_ids)
    courses_map = {}
    course_refs = [db.collection("courses").document(cid) for cid in course_list]
    course_docs = db.get_all(course_refs)
    for cd in course_docs:
        if cd.exists:
            courses_map[cd.id] = cd.to_dict().get("title", "")

    results = []
    for i in range(0, len(course_list), 10):
        chunk = course_list[i:i+10]
        res_docs = db.collection("resources").where("course_id", "in", chunk).stream()
        for r in res_docs:
            rd = r.to_dict()
            rd["id"] = r.id
            rd["course_name"] = courses_map.get(rd.get("course_id", ""), "")
            results.append(rd)

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
