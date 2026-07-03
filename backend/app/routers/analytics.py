from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from ..core.dependencies import get_current_user, require_instructor, require_admin
from ..core.firebase import get_db
from ..utils.response import success_response

router = APIRouter()

@router.get("/")
def get_analytics_root():
    return success_response(data={})

@router.get("/instructor")
def get_instructor_analytics(
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    courses = list(db.collection("courses").stream())
    total_courses = len(courses)
    total_enrollments = 0
    total_published = 0
    for c in courses:
        cd = c.to_dict()
        total_enrollments += cd.get("enrollment_count", 0)
        if cd.get("status") == "published":
            total_published += 1
    quizzes = 0
    assignments = 0
    for c in courses:
        cid = c.id
        quizzes += len(list(db.collection("quizzes").where("course_id", "==", cid).stream()))
        assignments += len(list(db.collection("assignments").where("course_id", "==", cid).stream()))
    data = {
        "total_courses": total_courses,
        "total_published": total_published,
        "total_enrollments": total_enrollments,
        "total_quizzes": quizzes,
        "total_assignments": assignments,
    }
    return success_response(data=data)


@router.get("/instructor/dashboard-summary")
def get_instructor_dashboard_summary(
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    """Comprehensive dashboard summary for instructors."""
    uid = current_user["id"]
    course_docs = list(
        db.collection("courses").where("instructor_id", "==", uid).stream()
    )
    course_ids = [c.id for c in course_docs]

    total_courses = len(course_docs)
    published_courses = 0
    draft_courses = 0
    total_enrollments = 0

    courses_list = []
    all_modules = []
    all_quizzes = []
    all_assignments = []
    all_enrollments = []

    if course_ids:
        for chunk in [course_ids[i:i + 30] for i in range(0, len(course_ids), 30)]:
            all_modules.extend(db.collection("modules").where("course_id", "in", chunk).stream())
            all_quizzes.extend(db.collection("quizzes").where("course_id", "in", chunk).stream())
            all_assignments.extend(db.collection("assignments").where("course_id", "in", chunk).stream())
            all_enrollments.extend(db.collection("enrollments").where("course_id", "in", chunk).stream())

    modules_by_course = {}
    quizzes_by_course = {}
    assignments_by_course = {}
    enrollments_by_course = {}

    for m in all_modules:
        md = m.to_dict()
        cid = md.get("course_id")
        modules_by_course.setdefault(cid, []).append(m.id)

    for q in all_quizzes:
        qd = q.to_dict()
        cid = qd.get("course_id")
        quizzes_by_course.setdefault(cid, []).append(q.id)

    for a in all_assignments:
        ad = a.to_dict()
        cid = ad.get("course_id")
        assignments_by_course.setdefault(cid, []).append(a.id)

    for e in all_enrollments:
        ed = e.to_dict()
        cid = ed.get("course_id")
        enrollments_by_course.setdefault(cid, []).append(e)

    for c in course_docs:
        cd = c.to_dict()
        status = cd.get("status", "draft")
        if status == "published":
            published_courses += 1
        elif status == "draft":
            draft_courses += 1
        total_enrollments += cd.get("enrollment_count", 0)

        cid = c.id
        courses_list.append({
            "id": cid,
            "title": cd.get("title", ""),
            "status": status,
            "enrollment_count": cd.get("enrollment_count", 0),
            "module_count": len(modules_by_course.get(cid, [])),
            "quiz_count": len(quizzes_by_course.get(cid, [])),
            "assignment_count": len(assignments_by_course.get(cid, [])),
            "completion_rate": 0,
            "updated_at": cd.get("updated_at", cd.get("created_at", "")),
        })

    total_quizzes = len(all_quizzes)
    total_assignments = len(all_assignments)

    course_performance = []
    for cl in courses_list:
        cid = cl["id"]
        enrolls = enrollments_by_course.get(cid, [])
        count = len(enrolls)
        completed = sum(1 for e in enrolls if e.to_dict().get("status") == "completed")
        rate = round((completed / max(count, 1)) * 100, 1)
        cl["completion_rate"] = rate
        course_performance.append({
            "course_id": cid,
            "course_title": cl["title"],
            "enrollments": count,
            "completed": completed,
            "completion_rate": rate,
        })

    avg_completion = round(
        sum(cp["completion_rate"] for cp in course_performance) / max(len(course_performance), 1), 1
    )

    needed_user_ids = set()
    pending_submissions_raw = []
    pending_count = 0

    if all_assignments:
        assignment_ids = [a.id for a in all_assignments]
        all_subs = []
        for chunk in [assignment_ids[i:i + 30] for i in range(0, len(assignment_ids), 30)]:
            subs = db.collection("assignment_submissions") \
                    .where("assignment_id", "in", chunk) \
                    .where("status", "==", "pending") \
                    .stream()
            all_subs.extend(subs)

        for s in all_subs:
            sd = s.to_dict()
            sd["id"] = s.id
            uid_sub = sd.get("user_id")
            if uid_sub:
                needed_user_ids.add(uid_sub)
            pending_submissions_raw.append(sd)
            pending_count += 1

    for e in all_enrollments:
        ed = e.to_dict()
        uid_enroll = ed.get("user_id")
        if uid_enroll:
            needed_user_ids.add(uid_enroll)

    user_cache = {}
    if needed_user_ids:
        user_refs = [db.collection("users").document(uid_key) for uid_key in needed_user_ids]
        user_docs = db.get_all(user_refs)
        for udoc in user_docs:
            if udoc.exists:
                user_cache[udoc.id] = udoc.to_dict()

    pending_submissions = []
    for sd in pending_submissions_raw:
        s_uid = sd.get("user_id", "")
        sd["student_name"] = user_cache.get(s_uid, {}).get("name", "Unknown")
        assignment_doc = next((a for a in all_assignments if a.id == sd.get("assignment_id")), None)
        course_title = ""
        assignment_title = ""
        if assignment_doc:
            ad = assignment_doc.to_dict()
            cid = ad.get("course_id")
            course_title = next((cl["title"] for cl in courses_list if cl["id"] == cid), "")
            assignment_title = ad.get("title", "")
        sd["course_title"] = course_title
        sd["assignment_title"] = assignment_title
        pending_submissions.append(sd)

    recent_activity = []
    for e in all_enrollments:
        ed = e.to_dict()
        u_id = ed.get("user_id", "")
        student_name = user_cache.get(u_id, {}).get("name", "Unknown")
        course_title = next(
            (cl["title"] for cl in courses_list if cl["id"] == ed.get("course_id")), ""
        )
        enrolled_at = ed.get("enrolled_at", "")
        recent_activity.append({
            "student_name": student_name,
            "course_title": course_title,
            "activity": "Enrolled",
            "time": str(enrolled_at) if enrolled_at else "",
        })
    recent_activity.sort(key=lambda x: x["time"], reverse=True)
    recent_activity = recent_activity[:10]

    at_risk_students = []
    for e in all_enrollments:
        ed = e.to_dict()
        progress = ed.get("progress_percent", 0)
        if progress < 20 and ed.get("status") != "completed":
            u_id = ed.get("user_id", "")
            student_name = user_cache.get(u_id, {}).get("name", "Unknown")
            course_title = next(
                (cl["title"] for cl in courses_list if cl["id"] == ed.get("course_id")), ""
            )
            at_risk_students.append({
                "student_name": student_name,
                "course_title": course_title,
                "progress": progress,
                "enrolled_at": str(ed.get("enrolled_at", "")),
            })
    at_risk_students = at_risk_students[:10]

    data = {
        "total_courses": total_courses,
        "published_courses": published_courses,
        "draft_courses": draft_courses,
        "total_enrollments": total_enrollments,
        "pending_submissions": pending_count,
        "average_completion_rate": avg_completion,
        "total_quizzes": total_quizzes,
        "total_assignments": total_assignments,
        "courses": courses_list,
        "recent_activity": recent_activity,
        "pending_submissions_list": pending_submissions[:10],
        "course_performance": course_performance,
        "at_risk_students": at_risk_students,
    }
    return success_response(data=data)


@router.get("/admin")
def get_admin_analytics(
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    users = list(db.collection("users").stream())
    total_users = len(users)
    students = sum(1 for u in users if u.to_dict().get("role") == "student")
    instructors = sum(1 for u in users if u.to_dict().get("role") == "instructor")
    courses = list(db.collection("courses").stream())
    total_courses = len(courses)
    published = sum(1 for c in courses if c.to_dict().get("status") == "published")
    total_enrollments = sum(c.to_dict().get("enrollment_count", 0) for c in courses)
    data = {
        "total_users": total_users,
        "total_students": students,
        "total_instructors": instructors,
        "total_courses": total_courses,
        "published_courses": published,
        "total_enrollments": total_enrollments,
    }
    return success_response(data=data)


@router.get("/courses/{course_id}")
def get_course_analytics(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    course_doc = db.collection("courses").document(course_id).get()
    if not course_doc.exists:
        raise HTTPException(status_code=404, detail="Course not found")
    course = course_doc.to_dict()
    enrollments = list(db.collection("enrollments").where("course_id", "==", course_id).stream())
    total_enrollments = len(enrollments)
    completed = sum(1 for e in enrollments if e.to_dict().get("status") == "completed")
    in_progress = sum(1 for e in enrollments if e.to_dict().get("status") == "active")
    quizzes = list(db.collection("quizzes").where("course_id", "==", course_id).stream())
    quiz_attempts = 0
    for q in quizzes:
        quiz_attempts += len(list(db.collection("quiz_attempts").where("quiz_id", "==", q.id).stream()))
    submissions = list(db.collection("assignment_submissions").where("course_id", "==", course_id).stream())
    graded = sum(1 for s in submissions if s.to_dict().get("status") == "graded")
    data = {
        "course_title": course.get("title"),
        "total_enrollments": total_enrollments,
        "completed": completed,
        "in_progress": in_progress,
        "quiz_attempts": quiz_attempts,
        "graded_submissions": graded,
        "completion_rate": round((completed / max(total_enrollments, 1)) * 100, 1),
    }
    return success_response(data=data)
