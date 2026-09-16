from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from google.cloud.firestore_v1 import Increment
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from ..core.dependencies import get_current_user
from ..core.firebase import get_db
from ..core.cache import cache_response, invalidate_cache
from ..utils.response import success_response

router = APIRouter()


@router.get("/me/courses")
@cache_response(ttl=60, prefix="enrollments", is_user_scoped=True)
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
        cd["progress"] = ed.get("progress_percent", ed.get("progress", 0))
        raw_status = str(ed.get("status", "active")).lower()
        cd["status"] = "completed" if raw_status == "completed" else "in-progress"
        cd["enrolled_at"] = ed.get("enrolled_at")
        if raw_status == "completed":
            cd["final_grade"] = ed.get("final_grade")
            cd["completed_on"] = ed.get("completed_at")

        inst_id = cd.get("instructor_id", "")
        cd["instructor_name"] = instructors_map.get(inst_id, {}).get("name", "Instructor")
        results.append(cd)

    return success_response(data=results)


@router.get("/me/wishlist")
@cache_response(ttl=60, prefix="wishlist", is_user_scoped=True)
def my_wishlist(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    wish_docs = list(
        db.collection("wishlist")
        .where("user_id", "==", uid)
        .stream()
    )
    if not wish_docs:
        return success_response(data=[])
        
    course_refs = [db.collection("courses").document(w.to_dict().get("course_id")) for w in wish_docs if w.to_dict().get("course_id")]
    course_docs = db.get_all(course_refs)
    
    courses_map = {}
    needed_instructor_ids = set()
    for cdoc in course_docs:
        if cdoc.exists:
            cd = cdoc.to_dict()
            cd["id"] = cdoc.id
            cd["status"] = "wishlist"
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
    for w in wish_docs:
        course_id = w.to_dict().get("course_id")
        if course_id not in courses_map:
            continue
        cd = dict(courses_map[course_id])
        inst_id = cd.get("instructor_id", "")
        cd["instructor_name"] = instructors_map.get(inst_id, {}).get("name", "Instructor")
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
    invalidate_cache(["edubridge:enrollments*", "edubridge:courses*", "edubridge:analytics*", "edubridge:instructor*", "edubridge:calendar*"])
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
    invalidate_cache(["edubridge:wishlist*"])
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
    invalidate_cache(["edubridge:wishlist*"])
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


class CalendarEventCreate(BaseModel):
    title: str
    date: str  # YYYY-MM-DD
    time: Optional[str] = "10:00 AM"
    duration_mins: Optional[int] = 60
    type: Optional[str] = "study"  # study, exam, reminder, personal
    course_id: Optional[str] = ""
    description: Optional[str] = ""
    priority: Optional[str] = "medium"  # high, medium, low
    completed: Optional[bool] = False


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    duration_mins: Optional[int] = None
    type: Optional[str] = None
    course_id: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None


@router.get("/me/calendar")
@cache_response(ttl=60, prefix="calendar", is_user_scoped=True)
def my_calendar(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    enrollments = list(
        db.collection("enrollments")
        .where("user_id", "==", uid)
        .stream()
    )
    enrollments_map = {}
    course_ids = []
    for e in enrollments:
        ed = e.to_dict()
        cid = ed.get("course_id")
        if cid:
            course_ids.append(cid)
            enrollments_map[cid] = ed

    def parse_dt(val):
        if not val:
            return None
        if isinstance(val, datetime):
            return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
        if isinstance(val, str):
            try:
                dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
                return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
            except Exception:
                return None
        return None
    
    courses_map = {}
    if course_ids:
        course_refs = [db.collection("courses").document(cid) for cid in course_ids]
        course_docs = db.get_all(course_refs)
        for cd in course_docs:
            if cd.exists:
                courses_map[cd.id] = cd.to_dict()

    events = []

    # 1. Course Quizzes
    for cid in course_ids:
        c_info = courses_map.get(cid, {})
        enr_info = enrollments_map.get(cid, {})
        enrolled_at = parse_dt(enr_info.get("enrolled_at") or enr_info.get("created_at"))
        quizzes = db.collection("quizzes").where("course_id", "==", cid).stream()
        for q in quizzes:
            qd = q.to_dict()
            due_days = qd.get("due_days")
            is_relative = False
            effective_date = None

            if due_days is not None and enrolled_at:
                try:
                    effective_date = enrolled_at + timedelta(days=int(due_days))
                    is_relative = True
                except Exception:
                    pass

            if not effective_date:
                raw_due = qd.get("available_until") or qd.get("due_date") or qd.get("created_at")
                effective_date = parse_dt(raw_due)

            date_str = effective_date.strftime("%Y-%m-%d") if effective_date else ""

            events.append({
                "id": f"quiz-{q.id}",
                "raw_id": q.id,
                "title": qd.get("title", "Quiz"),
                "type": "quiz",
                "course_id": cid,
                "course_title": c_info.get("title", "Course Quiz"),
                "category": c_info.get("category", "Quiz"),
                "date": date_str,
                "time": "11:59 PM",
                "priority": "high",
                "completed": False,
                "questions_count": len(qd.get("questions", [])),
                "due_days": due_days,
                "is_relative_deadline": is_relative,
            })

    # 2. Course Assignments
    user_submissions_stream = db.collection("assignment_submissions").where("user_id", "==", uid).stream()
    user_submitted_assignment_ids = {s.to_dict().get("assignment_id") for s in user_submissions_stream if s.to_dict().get("assignment_id")}

    for cid in course_ids:
        c_info = courses_map.get(cid, {})
        enr_info = enrollments_map.get(cid, {})
        enrolled_at = parse_dt(enr_info.get("enrolled_at") or enr_info.get("created_at"))
        assignments = db.collection("assignments").where("course_id", "==", cid).stream()
        for a in assignments:
            ad = a.to_dict()
            due_days = ad.get("due_days")
            is_relative = False
            effective_date = None

            if due_days is not None and enrolled_at:
                try:
                    effective_date = enrolled_at + timedelta(days=int(due_days))
                    is_relative = True
                except Exception:
                    pass

            if not effective_date:
                raw_due = ad.get("due_date") or ad.get("created_at")
                effective_date = parse_dt(raw_due)

            date_str = effective_date.strftime("%Y-%m-%d") if effective_date else ""

            sub_exists = a.id in user_submitted_assignment_ids
            events.append({
                "id": f"asg-{a.id}",
                "raw_id": a.id,
                "title": ad.get("title", "Assignment"),
                "type": "assignment",
                "course_id": cid,
                "course_title": c_info.get("title", "Course Assignment"),
                "category": c_info.get("category", "Assignment"),
                "date": date_str,
                "time": "11:59 PM",
                "priority": "high",
                "completed": sub_exists,
                "total_marks": ad.get("total_marks", 100),
                "due_days": due_days,
                "is_relative_deadline": is_relative,
                "late_penalty": ad.get("late_penalty", 0.0),
                "allow_late": ad.get("allow_late", False),
            })

    # 3. Personal Custom Study Events
    custom_events = db.collection("calendar_events").where("user_id", "==", uid).stream()
    for ce in custom_events:
        ced = ce.to_dict()
        cid = ced.get("course_id", "")
        c_info = courses_map.get(cid, {}) if cid else {}
        events.append({
            "id": ce.id,
            "raw_id": ce.id,
            "title": ced.get("title", "Study Session"),
            "description": ced.get("description", ""),
            "type": ced.get("type", "study"),
            "course_id": cid,
            "course_title": c_info.get("title") or ced.get("course_title", ""),
            "date": ced.get("date", ""),
            "time": ced.get("time", "10:00 AM"),
            "duration_mins": ced.get("duration_mins", 60),
            "priority": ced.get("priority", "medium"),
            "completed": ced.get("completed", False),
            "is_custom": True,
        })

    return success_response(data=events)


@router.post("/calendar/events")
def create_calendar_event(
    payload: CalendarEventCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    now = datetime.now(timezone.utc)
    data = payload.model_dump()
    data["user_id"] = uid
    data["created_at"] = now
    data["updated_at"] = now
    
    if data.get("course_id"):
        cdoc = db.collection("courses").document(data["course_id"]).get()
        if cdoc.exists:
            data["course_title"] = cdoc.to_dict().get("title", "")

    _, doc_ref = db.collection("calendar_events").add(data)
    data["id"] = doc_ref.id
    data["raw_id"] = doc_ref.id
    data["is_custom"] = True
    invalidate_cache(["edubridge:calendar*"])
    return success_response(data=data, message="Study event created successfully")


@router.put("/calendar/events/{event_id}")
def update_calendar_event(
    event_id: str,
    payload: CalendarEventUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    doc_ref = db.collection("calendar_events").document(event_id)
    doc = doc_ref.get()
    if not doc.exists or doc.to_dict().get("user_id") != uid:
        raise HTTPException(status_code=404, detail="Event not found")

    update_dict = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)

    if "course_id" in update_dict and update_dict["course_id"]:
        cdoc = db.collection("courses").document(update_dict["course_id"]).get()
        if cdoc.exists:
            update_dict["course_title"] = cdoc.to_dict().get("title", "")

    doc_ref.update(update_dict)
    updated = doc_ref.get().to_dict()
    updated["id"] = event_id
    updated["raw_id"] = event_id
    updated["is_custom"] = True
    invalidate_cache(["edubridge:calendar*"])
    return success_response(data=updated, message="Study event updated")


@router.delete("/calendar/events/{event_id}")
def delete_calendar_event(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    doc_ref = db.collection("calendar_events").document(event_id)
    doc = doc_ref.get()
    if not doc.exists or doc.to_dict().get("user_id") != uid:
        raise HTTPException(status_code=404, detail="Event not found")

    doc_ref.delete()
    invalidate_cache(["edubridge:calendar*"])
    return success_response(message="Event deleted successfully")


@router.patch("/calendar/events/{event_id}/toggle")
def toggle_calendar_event(
    event_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    doc_ref = db.collection("calendar_events").document(event_id)
    doc = doc_ref.get()
    if not doc.exists or doc.to_dict().get("user_id") != uid:
        raise HTTPException(status_code=404, detail="Event not found")

    curr_status = doc.to_dict().get("completed", False)
    new_status = not curr_status
    doc_ref.update({"completed": new_status, "updated_at": datetime.now(timezone.utc)})
    invalidate_cache(["edubridge:calendar*"])
    return success_response(data={"completed": new_status}, message="Event status updated")

