from fastapi import APIRouter, Depends, HTTPException, Query
from google.cloud.firestore_v1.client import Client
from google.cloud.firestore_v1 import Increment
from firebase_admin import auth
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr
from ..core.dependencies import require_admin
from ..core.firebase import get_db
from ..core.cache import invalidate_cache, cache_response
from ..utils.response import success_response, error_response

router = APIRouter()


# -------------------------------------------------------------
# Models
# -------------------------------------------------------------
class AdminUserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "student"
    title: Optional[str] = ""
    phone_number: Optional[str] = ""


class AdminPasswordReset(BaseModel):
    new_password: str


class AdminManualEnrollment(BaseModel):
    user_id: str
    course_id: str


class AdminEnrollmentUpdate(BaseModel):
    status: Optional[str] = None
    progress_percent: Optional[float] = None


class PlatformSettings(BaseModel):
    platform_name: Optional[str] = "EduBridge Academy"
    support_email: Optional[str] = "support@edubridge.edu"
    contact_phone: Optional[str] = "+1 (555) 019-2834"
    allow_registration: Optional[bool] = True
    maintenance_mode: Optional[bool] = False
    enable_community: Optional[bool] = True
    auto_issue_certificates: Optional[bool] = True
    default_language: Optional[str] = "English"


# -------------------------------------------------------------
# 1. Dashboard Executive Stats
# -------------------------------------------------------------
@router.get("/dashboard-stats")
@cache_response(ttl=30, prefix="admin_dashboard")
def get_admin_dashboard_stats(
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    # Users breakdown
    user_docs = list(db.collection("users").stream())
    total_users = len(user_docs)
    total_students = 0
    total_instructors = 0
    total_admins = 0
    active_users = 0
    blocked_users = 0
    user_map = {}

    for ud in user_docs:
        u = ud.to_dict()
        u["id"] = ud.id
        user_map[ud.id] = u
        role = u.get("role", "student")
        if role == "student":
            total_students += 1
        elif role == "instructor":
            total_instructors += 1
        elif role in ["admin", "super_admin"]:
            total_admins += 1

        if u.get("status") == "blocked":
            blocked_users += 1
        else:
            active_users += 1

    # Courses breakdown
    course_docs = list(db.collection("courses").stream())
    total_courses = len(course_docs)
    published_courses = 0
    draft_courses = 0
    archived_courses = 0
    course_map = {}

    for cd in course_docs:
        c = cd.to_dict()
        c["id"] = cd.id
        course_map[cd.id] = c
        st = c.get("status", "draft")
        if st == "published":
            published_courses += 1
        elif st == "archived":
            archived_courses += 1
        else:
            draft_courses += 1

    # Enrollments breakdown
    enroll_docs = list(db.collection("enrollments").stream())
    total_enrollments = len(enroll_docs)
    active_enrollments = 0
    completed_enrollments = 0
    raw_enrollments = []

    for ed in enroll_docs:
        e = ed.to_dict()
        e["id"] = ed.id
        raw_enrollments.append(e)
        st = e.get("status", "active")
        if st == "completed" or (e.get("progress_percent") or 0) >= 100:
            completed_enrollments += 1
        else:
            active_enrollments += 1

    # Certificates count
    cert_docs = list(db.collection("certificates").stream())
    total_certificates = len(cert_docs)

    completion_rate = round((completed_enrollments / max(total_enrollments, 1)) * 100, 1)

    # Recent 8 users
    sorted_users = sorted(
        user_docs,
        key=lambda x: str(x.to_dict().get("created_at") or ""),
        reverse=True
    )[:8]
    recent_users = []
    for ud in sorted_users:
        u = ud.to_dict()
        recent_users.append({
            "id": ud.id,
            "name": u.get("name") or "User",
            "email": u.get("email") or "",
            "role": u.get("role") or "student",
            "status": u.get("status") or "active",
            "photo_url": u.get("photo_url") or "",
            "created_at": str(u.get("created_at") or ""),
        })

    # Recent 8 enrollments
    sorted_enrolls = sorted(
        raw_enrollments,
        key=lambda x: str(x.get("enrolled_at") or x.get("created_at") or ""),
        reverse=True
    )[:8]
    recent_enrollments = []
    for e in sorted_enrolls:
        u = user_map.get(e.get("user_id"), {})
        c = course_map.get(e.get("course_id"), {})
        recent_enrollments.append({
            "id": e.get("id"),
            "user_id": e.get("user_id"),
            "student_name": u.get("name") or "Student",
            "student_email": u.get("email") or "",
            "student_photo": u.get("photo_url") or "",
            "course_id": e.get("course_id"),
            "course_title": c.get("title") or "Course",
            "course_image": c.get("thumbnail_url") or c.get("image") or "",
            "progress_percent": e.get("progress_percent") or 0,
            "status": e.get("status") or "active",
            "enrolled_at": str(e.get("enrolled_at") or e.get("created_at") or ""),
        })

    # Monthly trends (Past 6 months)
    now = datetime.now(timezone.utc)
    monthly_data = []
    for i in range(5, -1, -1):
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1
        month_label = datetime(year, month, 1).strftime("%b %y")
        
        month_enroll_count = 0
        month_comp_count = 0
        for e in raw_enrollments:
            date_str = str(e.get("enrolled_at") or e.get("created_at") or "")
            if date_str.startswith(f"{year}-{month:02d}"):
                month_enroll_count += 1
                if e.get("status") == "completed":
                    month_comp_count += 1

        monthly_data.append({
            "month": month_label,
            "enrollments": month_enroll_count,
            "completions": month_comp_count,
        })

    # Top Courses by enrollment count
    courses_with_stats = []
    for cid, c in course_map.items():
        c_enrolls = [e for e in raw_enrollments if e.get("course_id") == cid]
        c_completed = sum(1 for e in c_enrolls if e.get("status") == "completed")
        c_rate = round((c_completed / max(len(c_enrolls), 1)) * 100, 1)
        inst = user_map.get(c.get("instructor_id"), {})
        courses_with_stats.append({
            "id": cid,
            "title": c.get("title") or "Untitled Course",
            "instructor_name": inst.get("name") or c.get("instructor_name") or "Instructor",
            "category": c.get("category") or "General",
            "enrollments": len(c_enrolls),
            "completions": c_completed,
            "completion_rate": c_rate,
            "status": c.get("status") or "draft",
            "thumbnail_url": c.get("thumbnail_url") or c.get("image") or "",
        })
    courses_with_stats.sort(key=lambda x: x["enrollments"], reverse=True)
    top_courses = courses_with_stats[:5]

    data = {
        "stats": {
            "total_users": total_users,
            "total_students": total_students,
            "total_instructors": total_instructors,
            "total_admins": total_admins,
            "active_users": active_users,
            "blocked_users": blocked_users,
            "total_courses": total_courses,
            "published_courses": published_courses,
            "draft_courses": draft_courses,
            "archived_courses": archived_courses,
            "total_enrollments": total_enrollments,
            "active_enrollments": active_enrollments,
            "completed_enrollments": completed_enrollments,
            "completion_rate": completion_rate,
            "total_certificates": total_certificates,
        },
        "recent_users": recent_users,
        "recent_enrollments": recent_enrollments,
        "monthly_trends": monthly_data,
        "top_courses": top_courses,
    }
    return success_response(data=data)


# -------------------------------------------------------------
# 2. Detailed Analytics
# -------------------------------------------------------------
@router.get("/analytics-detailed")
@cache_response(ttl=60, prefix="admin_analytics_detailed")
def get_admin_detailed_analytics(
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    course_docs = list(db.collection("courses").stream())
    courses = [dict(c.to_dict(), id=c.id) for c in course_docs]
    enroll_docs = list(db.collection("enrollments").stream())
    enrollments = [dict(e.to_dict(), id=e.id) for e in enroll_docs]
    user_docs = list(db.collection("users").stream())
    users = [dict(u.to_dict(), id=u.id) for u in user_docs]

    # Category breakdown
    category_counts: Dict[str, int] = {}
    category_enrollments: Dict[str, int] = {}
    for c in courses:
        cat = c.get("category") or "Uncategorized"
        category_counts[cat] = category_counts.get(cat, 0) + 1
        c_enrolls = sum(1 for e in enrollments if e.get("course_id") == c["id"])
        category_enrollments[cat] = category_enrollments.get(cat, 0) + c_enrolls

    category_data = [
        {"category": cat, "courses": category_counts[cat], "enrollments": category_enrollments.get(cat, 0)}
        for cat in category_counts
    ]
    category_data.sort(key=lambda x: x["enrollments"], reverse=True)

    # Instructor performance
    instructors = [u for u in users if u.get("role") == "instructor"]
    instructor_stats = []
    for inst in instructors:
        inst_id = inst["id"]
        inst_courses = [c for c in courses if c.get("instructor_id") == inst_id]
        inst_course_ids = {c["id"] for c in inst_courses}
        inst_enrolls = [e for e in enrollments if e.get("course_id") in inst_course_ids]
        inst_completed = sum(1 for e in inst_enrolls if e.get("status") == "completed")
        rate = round((inst_completed / max(len(inst_enrolls), 1)) * 100, 1)
        instructor_stats.append({
            "id": inst_id,
            "name": inst.get("name") or "Instructor",
            "email": inst.get("email") or "",
            "photo_url": inst.get("photo_url") or "",
            "courses_count": len(inst_courses),
            "students_count": len(inst_enrolls),
            "completed_count": inst_completed,
            "completion_rate": rate,
        })
    instructor_stats.sort(key=lambda x: x["students_count"], reverse=True)

    # Quiz performance
    attempts = list(db.collection("quiz_attempts").stream())
    total_attempts = len(attempts)
    passed_attempts = sum(1 for a in attempts if a.to_dict().get("passed") is True)
    scores = [a.to_dict().get("score", 0) for a in attempts if isinstance(a.to_dict().get("score"), (int, float))]
    avg_score = round(sum(scores) / max(len(scores), 1), 1)

    data = {
        "category_distribution": category_data,
        "instructor_performance": instructor_stats,
        "quiz_metrics": {
            "total_attempts": total_attempts,
            "passed_attempts": passed_attempts,
            "pass_rate": round((passed_attempts / max(total_attempts, 1)) * 100, 1),
            "avg_score": avg_score,
        },
        "total_courses": len(courses),
        "total_enrollments": len(enrollments),
        "total_users": len(users),
    }
    return success_response(data=data)


# -------------------------------------------------------------
# 3. User Administration
# -------------------------------------------------------------
@router.post("/users")
def create_admin_user(
    payload: AdminUserCreate,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    if payload.role not in ["student", "instructor", "admin"]:
        raise HTTPException(status_code=400, detail="Role must be student, instructor, or admin")

    now = datetime.now(timezone.utc)
    try:
        user_record = auth.create_user(
            email=payload.email,
            password=payload.password,
            display_name=payload.name
        )
        uid = user_record.uid
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Firebase Auth error: {str(e)}")

    user_data = {
        "firebase_uid": uid,
        "email": payload.email,
        "name": payload.name,
        "role": payload.role,
        "title": payload.title or "",
        "phone_number": payload.phone_number or "",
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }

    db.collection("users").document(uid).set(user_data)
    user_data["id"] = uid

    invalidate_cache(["edubridge:users*", "edubridge:analytics*", "edubridge:admin*"])
    return success_response(data=user_data, message="User successfully created")


@router.delete("/users/{user_id}")
def delete_admin_user(
    user_id: str,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    if user_id == current_user.get("id"):
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    user_ref = db.collection("users").document(user_id)
    doc = user_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        auth.delete_user(user_id)
    except Exception:
        pass

    user_ref.delete()
    invalidate_cache(["edubridge:users*", "edubridge:analytics*", "edubridge:admin*"])
    return success_response(message="User deleted successfully")


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    payload: AdminPasswordReset,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user_ref = db.collection("users").document(user_id)
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        auth.update_user(user_id, password=payload.new_password)
        return success_response(message="Password reset successfully")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to reset password: {str(e)}")


@router.get("/users/{user_id}/details")
def get_user_details(
    user_id: str,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_doc.to_dict()
    user_data["id"] = user_id

    enrollments_docs = list(db.collection("enrollments").where("user_id", "==", user_id).stream())
    enrollments = []
    for ed in enrollments_docs:
        edata = ed.to_dict()
        edata["id"] = ed.id
        course_doc = db.collection("courses").document(edata.get("course_id", "")).get()
        if course_doc.exists:
            edata["course_title"] = course_doc.to_dict().get("title")
            edata["course_image"] = course_doc.to_dict().get("thumbnail_url")
        enrollments.append(edata)

    certs_docs = list(db.collection("certificates").where("user_id", "==", user_id).stream())
    certificates = [dict(c.to_dict(), id=c.id) for c in certs_docs]

    authored_courses = []
    if user_data.get("role") in ["instructor", "admin"]:
        c_docs = list(db.collection("courses").where("instructor_id", "==", user_id).stream())
        authored_courses = [dict(c.to_dict(), id=c.id) for c in c_docs]

    return success_response(data={
        "user": user_data,
        "enrollments": enrollments,
        "certificates": certificates,
        "authored_courses": authored_courses,
    })


# -------------------------------------------------------------
# 4. Enrollment Management
# -------------------------------------------------------------
@router.get("/enrollments")
def get_admin_enrollments(
    search: Optional[str] = None,
    course_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    query = db.collection("enrollments")
    if course_id:
        query = query.where("course_id", "==", course_id)
    if status:
        query = query.where("status", "==", status)

    docs = list(query.limit(300).stream())

    needed_user_ids = {d.to_dict().get("user_id") for d in docs if d.to_dict().get("user_id")}
    needed_course_ids = {d.to_dict().get("course_id") for d in docs if d.to_dict().get("course_id")}

    users_map = {}
    for uid in needed_user_ids:
        udoc = db.collection("users").document(uid).get()
        if udoc.exists:
            users_map[uid] = udoc.to_dict()

    courses_map = {}
    for cid in needed_course_ids:
        cdoc = db.collection("courses").document(cid).get()
        if cdoc.exists:
            courses_map[cid] = cdoc.to_dict()

    results = []
    for d in docs:
        ed = d.to_dict()
        ed["id"] = d.id
        uid = ed.get("user_id")
        cid = ed.get("course_id")
        u = users_map.get(uid, {})
        c = courses_map.get(cid, {})

        student_name = u.get("name") or "Student"
        student_email = u.get("email") or ""
        course_title = c.get("title") or "Course"

        if search:
            search_lower = search.lower()
            if search_lower not in student_name.lower() and search_lower not in student_email.lower() and search_lower not in course_title.lower():
                continue

        ed["student_name"] = student_name
        ed["student_email"] = student_email
        ed["student_photo"] = u.get("photo_url") or ""
        ed["course_title"] = course_title
        ed["course_image"] = c.get("thumbnail_url") or c.get("image") or ""
        ed["instructor_name"] = c.get("instructor_name") or "Instructor"

        results.append(ed)

    results.sort(key=lambda x: str(x.get("enrolled_at") or x.get("created_at") or ""), reverse=True)
    return success_response(data=results)


@router.post("/enrollments")
def create_admin_enrollment(
    payload: AdminManualEnrollment,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    user_doc = db.collection("users").document(payload.user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")

    course_doc = db.collection("courses").document(payload.course_id).get()
    if not course_doc.exists:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = list(
        db.collection("enrollments")
        .where("user_id", "==", payload.user_id)
        .where("course_id", "==", payload.course_id)
        .stream()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Student is already enrolled in this course")

    now = datetime.now(timezone.utc)
    enroll_data = {
        "user_id": payload.user_id,
        "course_id": payload.course_id,
        "status": "active",
        "progress_percent": 0.0,
        "enrolled_at": now,
        "created_at": now,
        "updated_at": now,
    }

    _, ref = db.collection("enrollments").add(enroll_data)
    enroll_data["id"] = ref.id

    db.collection("courses").document(payload.course_id).update({
        "enrollment_count": Increment(1)
    })

    invalidate_cache(["edubridge:enrollments*", "edubridge:analytics*", "edubridge:admin*"])
    return success_response(data=enroll_data, message="Student enrolled successfully")


@router.patch("/enrollments/{enrollment_id}")
def update_admin_enrollment(
    enrollment_id: str,
    payload: AdminEnrollmentUpdate,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    doc_ref = db.collection("enrollments").document(enrollment_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    update_dict = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc)

    if payload.status == "completed":
        update_dict["completed_at"] = datetime.now(timezone.utc)
        if payload.progress_percent is None:
            update_dict["progress_percent"] = 100.0

    doc_ref.update(update_dict)
    invalidate_cache(["edubridge:enrollments*", "edubridge:analytics*", "edubridge:admin*"])
    return success_response(message="Enrollment updated successfully")


@router.delete("/enrollments/{enrollment_id}")
def delete_admin_enrollment(
    enrollment_id: str,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    doc_ref = db.collection("enrollments").document(enrollment_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    course_id = doc.to_dict().get("course_id")
    doc_ref.delete()

    if course_id:
        try:
            db.collection("courses").document(course_id).update({
                "enrollment_count": Increment(-1)
            })
        except Exception:
            pass

    invalidate_cache(["edubridge:enrollments*", "edubridge:analytics*", "edubridge:admin*"])
    return success_response(message="Student unenrolled successfully")


# -------------------------------------------------------------
# 5. Certificates Management
# -------------------------------------------------------------
@router.get("/certificates")
def get_admin_certificates(
    search: Optional[str] = None,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    docs = list(db.collection("certificates").stream())
    results = []
    for d in docs:
        cd = d.to_dict()
        cd["id"] = d.id

        student_name = cd.get("student_name") or "Student"
        course_title = cd.get("course_title") or "Course"
        cert_id = cd.get("id")

        if search:
            s = search.lower()
            if s not in student_name.lower() and s not in course_title.lower() and s not in cert_id.lower():
                continue

        results.append(cd)

    results.sort(key=lambda x: str(x.get("issued_at") or ""), reverse=True)
    return success_response(data=results)


@router.delete("/certificates/{certificate_id}")
def revoke_admin_certificate(
    certificate_id: str,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    doc_ref = db.collection("certificates").document(certificate_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Certificate not found")

    doc_ref.delete()
    invalidate_cache(["edubridge:certificates*", "edubridge:admin*"])
    return success_response(message="Certificate revoked successfully")


# -------------------------------------------------------------
# 6. Course Deletion
# -------------------------------------------------------------
@router.delete("/courses/{course_id}")
def delete_admin_course(
    course_id: str,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    course_ref = db.collection("courses").document(course_id)
    if not course_ref.get().exists:
        raise HTTPException(status_code=404, detail="Course not found")

    modules = db.collection("modules").where("course_id", "==", course_id).stream()
    for m in modules:
        lessons = db.collection("lessons").where("module_id", "==", m.id).stream()
        for l in lessons:
            db.collection("lessons").document(l.id).delete()
        db.collection("modules").document(m.id).delete()

    quizzes = db.collection("quizzes").where("course_id", "==", course_id).stream()
    for q in quizzes:
        db.collection("quizzes").document(q.id).delete()

    assignments = db.collection("assignments").where("course_id", "==", course_id).stream()
    for a in assignments:
        db.collection("assignments").document(a.id).delete()

    course_ref.delete()
    invalidate_cache(["edubridge:courses*", "edubridge:analytics*", "edubridge:admin*"])
    return success_response(message="Course and associated resources deleted successfully")


# -------------------------------------------------------------
# 7. Platform Settings
# -------------------------------------------------------------
@router.get("/settings")
def get_platform_settings(
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    doc = db.collection("system_settings").document("platform").get()
    if doc.exists:
        return success_response(data=doc.to_dict())
    return success_response(data=PlatformSettings().model_dump())


@router.put("/settings")
def update_platform_settings(
    payload: PlatformSettings,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    data = payload.model_dump()
    data["updated_at"] = datetime.now(timezone.utc)
    db.collection("system_settings").document("platform").set(data, merge=True)
    return success_response(data=data, message="Platform settings updated successfully")
