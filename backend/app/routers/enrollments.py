from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from google.cloud.firestore_v1 import Increment
from typing import List
from datetime import datetime, timezone
from ..core.dependencies import get_current_user
from ..core.firebase import get_db
from ..utils.response import success_response

router = APIRouter()


@router.get("/me/courses")
def my_courses(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    enrollment_docs = list(
        db.collection("enrollments")
        .where("user_id", "==", uid)
        .stream()
    )
    if not enrollment_docs:
        return success_response(data=[])

    course_refs = [db.collection("courses").document(e.to_dict().get("course_id")) for e in enrollment_docs if e.to_dict().get("course_id")]
    course_docs = db.get_all(course_refs)
    
    courses_map = {}
    needed_instructor_ids = set()
    for cdoc in course_docs:
        if cdoc.exists:
            cd = cdoc.to_dict()
            cd["id"] = cdoc.id
            courses_map[cdoc.id] = cd
            inst_id = cd.get("instructor_id")
            if inst_id:
                needed_instructor_ids.add(inst_id)

    instructors_map = {}
    if needed_instructor_ids:
        inst_refs = [db.collection("users").document(iid) for iid in needed_instructor_ids]
        inst_docs = db.get_all(inst_refs)
        for idoc in inst_docs:
            if idoc.exists:
                instructors_map[idoc.id] = idoc.to_dict()

    results = []
    for e in enrollment_docs:
        ed = e.to_dict()
        course_id = ed.get("course_id")
        if course_id not in courses_map:
            continue
        cd = dict(courses_map[course_id])
        cd["progress"] = ed.get("progress_percent", 0)
        raw_status = ed.get("status", "active")
        cd["status"] = "completed" if raw_status == "completed" else "in-progress"
        cd["enrolled_at"] = ed.get("enrolled_at")
        if ed.get("status") == "completed":
            cd["final_grade"] = ed.get("final_grade")
            cd["completed_on"] = ed.get("completed_at")
            
        inst_id = cd.get("instructor_id", "")
        cd["instructor_name"] = instructors_map.get(inst_id, {}).get("name", "Instructor")
        results.append(cd)

    return success_response(data=results)


@router.get("/me/wishlist")
def my_wishlist(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    wish_docs = (
        db.collection("wishlist")
        .where("user_id", "==", uid)
        .stream()
    )
    results = []
    for w in wish_docs:
        wd = w.to_dict()
        course_id = wd.get("course_id")
        course_doc = db.collection("courses").document(course_id).get()
        if not course_doc.exists:
            continue
        cd = course_doc.to_dict()
        cd["id"] = course_doc.id
        cd["status"] = "wishlist"
        instructor_ref = db.collection("users").document(cd.get("instructor_id", ""))
        inst_doc = instructor_ref.get()
        cd["instructor_name"] = (
            inst_doc.to_dict().get("name", "Instructor") if inst_doc.exists else "Instructor"
        )
        results.append(cd)
    return success_response(data=results)


@router.post("/courses/{course_id}/enroll")
def enroll_course(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    course_ref = db.collection("courses").document(course_id)
    if not course_ref.get().exists:
        raise HTTPException(status_code=404, detail="Course not found")
    existing = (
        db.collection("enrollments")
        .where("user_id", "==", uid)
        .where("course_id", "==", course_id)
        .get()
    )
    if existing:
        return success_response(message="Already enrolled")
    now = datetime.now(timezone.utc)
    db.collection("enrollments").add({
        "user_id": uid,
        "course_id": course_id,
        "progress_percent": 0.0,
        "status": "active",
        "enrolled_at": now,
        "completed_at": None,
    })
    course_ref.update({"enrollment_count": Increment(1)})
    return success_response(message="Enrolled successfully")


@router.post("/courses/{course_id}/wishlist")
def add_wishlist(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    existing = (
        db.collection("wishlist")
        .where("user_id", "==", uid)
        .where("course_id", "==", course_id)
        .get()
    )
    if existing:
        return success_response(message="Already in wishlist")
    db.collection("wishlist").add({
        "user_id": uid,
        "course_id": course_id,
        "created_at": datetime.now(timezone.utc),
    })
    return success_response(message="Added to wishlist")


@router.delete("/courses/{course_id}/wishlist")
def remove_wishlist(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    docs = (
        db.collection("wishlist")
        .where("user_id", "==", uid)
        .where("course_id", "==", course_id)
        .get()
    )
    for d in docs:
        d.reference.delete()
    return success_response(message="Removed from wishlist")


@router.get("/courses/{course_id}/enrollment")
def my_enrollment(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    docs = (
        db.collection("enrollments")
        .where("user_id", "==", uid)
        .where("course_id", "==", course_id)
        .limit(1)
        .get()
    )
    for d in docs:
        ed = d.to_dict()
        ed["id"] = d.id
        return success_response(data=ed)
    return success_response(data=None)


@router.get("/me/calendar")
def my_calendar(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    enrollments = (
        db.collection("enrollments")
        .where("user_id", "==", uid)
        .stream()
    )
    course_ids = [e.to_dict().get("course_id") for e in enrollments if e.to_dict().get("course_id")]
    events = []
    for cid in course_ids:
        quizzes = (
            db.collection("quizzes")
            .where("course_id", "==", cid)
            .stream()
        )
        for q in quizzes:
            qd = q.to_dict()
            events.append({
                "id": q.id,
                "title": qd.get("title", "Quiz"),
                "type": "quiz",
                "course_id": cid,
            })
        assignments = (
            db.collection("assignments")
            .where("course_id", "==", cid)
            .stream()
        )
        for a in assignments:
            ad = a.to_dict()
            due = ad.get("due_date")
            events.append({
                "id": a.id,
                "title": ad.get("title", "Assignment"),
                "type": "assignment",
                "course_id": cid,
                "date": due.isoformat() if hasattr(due, "isoformat") else str(due),
            })
    return success_response(data=events)

