from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from typing import List, Optional
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from pydantic import BaseModel
from ..core.dependencies import get_current_user, require_instructor, require_admin
from ..core.firebase import get_db
from ..core.cache import cache_response, invalidate_cache, cache_manager
from ..utils.response import success_response, error_response
from ..schemas.course import CourseCreate, CourseUpdate

router = APIRouter()

@router.get("/")
@cache_response(ttl=120, prefix="courses")
def get_all_courses(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Client = Depends(get_db)
):
    courses_ref = db.collection("courses")
    if status:
        courses_ref = courses_ref.where("status", "==", status)
    courses_ref = courses_ref.limit(limit).offset(skip)
    
    docs = courses_ref.stream()
    courses = []
    needed_instructor_ids = set()
    for doc in docs:
        c = doc.to_dict()
        c["id"] = doc.id
        courses.append(c)
        inst_id = c.get("instructor_id")
        if inst_id:
            needed_instructor_ids.add(inst_id)
            
    instructors_map = {}
    if needed_instructor_ids:
        inst_refs = [db.collection("users").document(iid) for iid in needed_instructor_ids]
        inst_docs = db.get_all(inst_refs)
        for idoc in inst_docs:
            if idoc.exists:
                instructors_map[idoc.id] = idoc.to_dict()
                
    for c in courses:
        inst_id = c.get("instructor_id", "")
        c["instructor_name"] = instructors_map.get(inst_id, {}).get("name", "Instructor")
        
    return success_response(data=courses)


@router.get("/me")
@cache_response(ttl=60, prefix="courses", is_user_scoped=True)
def get_instructor_courses(
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    query = db.collection("courses")
    if current_user.get("role") == "instructor":
        docs = query.where("instructor_id", "==", current_user["id"]).stream()
    else:
        docs = query.stream()
    courses = []
    for doc in docs:
        c = doc.to_dict()
        c["id"] = doc.id
        courses.append(c)
    return success_response(data=courses)

@router.get("/{course_id}")
@cache_response(ttl=120, prefix="courses")
def get_course(course_id: str, db: Client = Depends(get_db)):
    doc = db.collection("courses").document(course_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Course not found")
    data = doc.to_dict()
    data["id"] = doc.id
    
    # instructor name lookup with in-memory caching
    instructor_id = data.get("instructor_id", "")
    if instructor_id:
        inst_cache_key = f"inst_name:{instructor_id}"
        cached_name = cache_manager.get(inst_cache_key)
        if cached_name:
            data["instructor_name"] = cached_name
        else:
            instructor_ref = db.collection("users").document(instructor_id)
            inst_doc = instructor_ref.get()
            inst_name = (
                inst_doc.to_dict().get("name", "Instructor") if inst_doc.exists else "Instructor"
            )
            cache_manager.set(inst_cache_key, inst_name, ttl=300)
            data["instructor_name"] = inst_name
    else:
        data["instructor_name"] = "Instructor"
        
    return success_response(data=data)

import random

DEFAULT_COURSE_LOGOS = [
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1580894732413-a75151b96f01?w=800&auto=format&fit=crop&q=80",
]

@router.post("/")
def create_course(
    course: CourseCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    course_data = course.model_dump()

    if not course_data.get("thumbnail_url") and not course_data.get("image") and not course_data.get("thumbnail"):
        course_data["thumbnail_url"] = random.choice(DEFAULT_COURSE_LOGOS)

    course_data.update({
        "instructor_id": current_user["id"],
        "rating_avg": 0.0,
        "enrollment_count": 0,
        "created_at": now,
        "updated_at": now
    })
    _, doc_ref = db.collection("courses").add(course_data)
    course_data["id"] = doc_ref.id
    invalidate_cache(["edubridge:courses*", "edubridge:instructor*", "edubridge:analytics*"])
    return success_response(data=course_data, message="Course created")

@router.patch("/{course_id}")
def update_course(
    course_id: str,
    course_update: CourseUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    course_ref = db.collection("courses").document(course_id)
    doc = course_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = course_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    course_ref.update(update_data)
    
    updated_doc = course_ref.get()
    data = updated_doc.to_dict()
    data["id"] = updated_doc.id
    invalidate_cache(["edubridge:courses*", "edubridge:instructor*", "edubridge:analytics*"])
    return success_response(data=data, message="Course updated")

@router.get("/{course_id}/modules")
@cache_response(ttl=120, prefix="courses")
def get_course_modules(course_id: str, db: Client = Depends(get_db)):
    """Return modules with nested lessons for a course in only 3 batched queries."""
    module_docs = list(
        db.collection("modules")
        .where("course_id", "==", course_id)
        .stream()
    )
    if not module_docs:
        return success_response(data=[])

    # Batch fetch all lessons for this course in a single query
    lesson_docs = list(
        db.collection("lessons")
        .where("course_id", "==", course_id)
        .stream()
    )
    lessons_by_module = {}
    for l in lesson_docs:
        ld = l.to_dict()
        ld["id"] = l.id
        mid = ld.get("module_id")
        if mid:
            lessons_by_module.setdefault(mid, []).append(ld)

    # Batch fetch all resources for this course in a single query
    resource_docs = list(
        db.collection("resources")
        .where("course_id", "==", course_id)
        .stream()
    )
    resources_by_module = {}
    for r in resource_docs:
        rd = r.to_dict()
        rd["id"] = r.id
        mid = rd.get("module_id")
        if mid:
            resources_by_module.setdefault(mid, []).append(rd)

    result = []
    for m in module_docs:
        md = m.to_dict()
        md["id"] = m.id
        lessons = lessons_by_module.get(m.id, [])
        lessons.sort(key=lambda x: x.get("order", 0))
        md["lessons"] = lessons

        resources = resources_by_module.get(m.id, [])
        resources.sort(key=lambda x: x.get("order", 0))
        md["resources"] = resources

        result.append(md)
        
    result.sort(key=lambda x: (x.get("order", 0), str(x.get("created_at") or "")))
    return success_response(data=result)


@router.delete("/{course_id}")
def delete_course(
    course_id: str,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    course_ref = db.collection("courses").document(course_id)
    if not course_ref.get().exists:
        raise HTTPException(status_code=404, detail="Course not found")

    modules = db.collection("modules").where("course_id", "==", course_id).stream()
    for m in modules:
        discussions = db.collection("discussions").where("module_id", "==", m.id).stream()
        for d in discussions:
            replies = db.collection("discussion_replies").where("thread_id", "==", d.id).stream()
            for r in replies:
                db.collection("discussion_replies").document(r.id).delete()
            db.collection("discussions").document(d.id).delete()

    course_ref.delete()
    invalidate_cache(["edubridge:courses*", "edubridge:instructor*", "edubridge:analytics*"])
    return success_response(message="Course deleted successfully")


class ModuleCreate(BaseModel):
    title: str
    description: Optional[str] = ""


class LessonCreate(BaseModel):
    title: str
    type: Optional[str] = "video"
    content: Optional[str] = ""
    video_url: Optional[str] = ""
    file_url: Optional[str] = ""
    duration_minutes: Optional[int] = 0
    estimated_duration: Optional[int] = 0
    required_completion: Optional[bool] = True


@router.post("/{course_id}/publish")
def publish_course(
    course_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    course_ref = db.collection("courses").document(course_id)
    doc = course_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    course_ref.update({"status": "published", "updated_at": datetime.now(timezone.utc)})
    invalidate_cache(["edubridge:courses*", "edubridge:instructor*", "edubridge:analytics*"])
    return success_response(message="Course published")


@router.post("/{course_id}/archive")
def archive_course(
    course_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    course_ref = db.collection("courses").document(course_id)
    doc = course_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    course_ref.update({"status": "archived", "updated_at": datetime.now(timezone.utc)})
    invalidate_cache(["edubridge:courses*", "edubridge:instructor*", "edubridge:analytics*"])
    return success_response(message="Course archived")


@router.post("/{course_id}/modules")
def create_module(
    course_id: str,
    module: ModuleCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    course_ref = db.collection("courses").document(course_id)
    course_doc = course_ref.get()
    if not course_doc.exists:
        raise HTTPException(status_code=404, detail="Course not found")
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = list(db.collection("modules").where("course_id", "==", course_id).stream())
    now = datetime.now(timezone.utc)
    data = module.model_dump()
    data.update({
        "course_id": course_id,
        "order": len(existing) + 1,
        "created_at": now,
        "updated_at": now
    })
    _, ref = db.collection("modules").add(data)
    data["id"] = ref.id
    invalidate_cache(["edubridge:courses*", "edubridge:unlock_status*", "unlock_status"])
    return success_response(data=data, message="Module created")


@router.put("/modules/{module_id}")
def update_module(
    module_id: str,
    module: ModuleCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("modules").document(module_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    course_id = doc.to_dict().get("course_id")
    course_doc = db.collection("courses").document(course_id).get()
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    data = module.model_dump()
    data["updated_at"] = datetime.now(timezone.utc)
    ref.update(data)
    updated = ref.get().to_dict()
    updated["id"] = module_id
    invalidate_cache(["edubridge:courses*", "edubridge:unlock_status*", "unlock_status"])
    return success_response(data=updated, message="Module updated")


@router.delete("/modules/{module_id}")
def delete_module(
    module_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("modules").document(module_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    course_id = doc.to_dict().get("course_id")
    course_doc = db.collection("courses").document(course_id).get()
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    lessons = db.collection("lessons").where("module_id", "==", module_id).stream()
    for l in lessons:
        db.collection("lessons").document(l.id).delete()

    discussions = db.collection("discussions").where("module_id", "==", module_id).stream()
    for d in discussions:
        replies = db.collection("discussion_replies").where("thread_id", "==", d.id).stream()
        for r in replies:
            db.collection("discussion_replies").document(r.id).delete()
        db.collection("discussions").document(d.id).delete()

    ref.delete()
    invalidate_cache(["edubridge:courses*", "edubridge:unlock_status*", "unlock_status"])
    return success_response(message="Module deleted")


@router.post("/modules/{module_id}/lessons")
def create_lesson(
    module_id: str,
    lesson: LessonCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    module_ref = db.collection("modules").document(module_id)
    module_doc = module_ref.get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    course_id = module_doc.to_dict().get("course_id")
    course_doc = db.collection("courses").document(course_id).get()
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    existing = list(db.collection("lessons").where("module_id", "==", module_id).stream())
    now = datetime.now(timezone.utc)
    data = lesson.model_dump()
    data.update({
        "module_id": module_id,
        "course_id": course_id,
        "order": len(existing) + 1,
        "created_at": now,
        "updated_at": now
    })
    _, ref = db.collection("lessons").add(data)
    data["id"] = ref.id
    invalidate_cache(["edubridge:courses*", "edubridge:unlock_status*", "unlock_status"])
    return success_response(data=data, message="Lesson created")


@router.put("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: str,
    lesson: LessonCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("lessons").document(lesson_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Lesson not found")
    module_id = doc.to_dict().get("module_id")
    module_doc = db.collection("modules").document(module_id).get()
    course_doc = db.collection("courses").document(module_doc.to_dict().get("course_id")).get()
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    data = lesson.model_dump()
    data["updated_at"] = datetime.now(timezone.utc)
    ref.update(data)
    updated = ref.get().to_dict()
    updated["id"] = lesson_id
    invalidate_cache(["edubridge:courses*", "edubridge:unlock_status*", "unlock_status"])
    return success_response(data=updated, message="Lesson updated")


@router.delete("/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("lessons").document(lesson_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Lesson not found")
    module_id = doc.to_dict().get("module_id")
    module_doc = db.collection("modules").document(module_id).get()
    course_doc = db.collection("courses").document(module_doc.to_dict().get("course_id")).get()
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    ref.delete()
    invalidate_cache(["edubridge:courses*", "edubridge:unlock_status*", "unlock_status"])
    return success_response(message="Lesson deleted")


@router.patch("/{course_id}/status")
def admin_update_course_status(
    course_id: str,
    body: dict,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    course_ref = db.collection("courses").document(course_id)
    if not course_ref.get().exists:
        raise HTTPException(status_code=404, detail="Course not found")
    status = body.get("status")
    if status not in ["draft", "published", "archived"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    course_ref.update({"status": status, "updated_at": datetime.now(timezone.utc)})
    return success_response(message=f"Course status updated to {status}")


def _get_course_curriculum_structure(course_id: str, db: Client):
    cache_key = f"course_curriculum:{course_id}"
    cached = cache_manager.get(cache_key)
    if cached and isinstance(cached, dict):
        return cached["modules"], cached["lessons_by_module"], cached["quizzes_by_module"]

    # Parallelize curriculum fetching
    with ThreadPoolExecutor(max_workers=3) as executor:
        f_mods = executor.submit(lambda: list(db.collection("modules").where("course_id", "==", course_id).stream()))
        f_lessons = executor.submit(lambda: list(db.collection("lessons").where("course_id", "==", course_id).stream()))
        f_quizzes = executor.submit(lambda: list(db.collection("quizzes").where("course_id", "==", course_id).stream()))

        module_docs = f_mods.result()
        lesson_docs = f_lessons.result()
        quiz_docs = f_quizzes.result()

    modules = []
    for m in module_docs:
        md = m.to_dict()
        md["id"] = m.id
        modules.append(md)
    modules.sort(key=lambda x: (x.get("order", 0), str(x.get("created_at") or "")))

    lessons_by_module = {}
    for l in lesson_docs:
        ld = l.to_dict()
        ld["id"] = l.id
        mid = ld.get("module_id")
        if mid:
            lessons_by_module.setdefault(mid, []).append(ld)

    quizzes_by_module = {}
    for q in quiz_docs:
        qd = q.to_dict()
        qd["id"] = q.id
        status = qd.get("status")
        if status and status != "published":
            continue
        mid = qd.get("module_id")
        if mid:
            quizzes_by_module.setdefault(mid, []).append(qd)

    cache_manager.set(cache_key, {
        "modules": modules,
        "lessons_by_module": lessons_by_module,
        "quizzes_by_module": quizzes_by_module
    }, ttl=180)

    return modules, lessons_by_module, quizzes_by_module


@router.get("/{course_id}/modules/unlock-status")
@cache_response(ttl=15, prefix="unlock_status", is_user_scoped=True)
def get_module_unlock_status(
    course_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    
    # 1. Fetch curriculum structure with in-memory cache
    modules, lessons_by_module, quizzes_by_module = _get_course_curriculum_structure(course_id, db)

    # 2. Fetch user progress & passed quiz attempts concurrently
    with ThreadPoolExecutor(max_workers=2) as executor:
        f_prog = executor.submit(lambda: {
            p.to_dict().get("lesson_id")
            for p in db.collection("progress").where("user_id", "==", uid).where("course_id", "==", course_id).stream()
            if p.to_dict().get("lesson_id") and p.to_dict().get("completed", True) is not False
        })
        f_quiz = executor.submit(lambda: {
            pa.to_dict().get("quiz_id")
            for pa in db.collection("quiz_attempts").where("user_id", "==", uid).where("passed", "==", True).stream()
            if pa.to_dict().get("quiz_id")
        })
        completed_lesson_ids = f_prog.result()
        passed_quiz_ids = f_quiz.result()

    # 3. Evaluate modules unlock and completed status in strict sequential order
    result = []
    previous_completed = True
    now = datetime.now(timezone.utc)

    for i, mod in enumerate(modules):
        mid = mod["id"]
        unlock_rule = mod.get("unlock_rule", "previous_completed")
        unlock_date_str = mod.get("unlock_date", "")

        # Compute locked status
        locked = False

        if i == 0:
            # First module is open by default unless a specific future date is configured
            if unlock_rule == "specific_date" and unlock_date_str:
                try:
                    unlock_date = datetime.strptime(unlock_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                    if now < unlock_date:
                        locked = True
                except Exception:
                    now_date_str = now.strftime("%Y-%m-%d")
                    if now_date_str < unlock_date_str:
                        locked = True
        else:
            # For all subsequent modules (i > 0):
            # Strict sequential lock: If previous module was not completed, this module is LOCKED!
            if not previous_completed:
                locked = True
            elif unlock_rule == "specific_date" and unlock_date_str:
                try:
                    unlock_date = datetime.strptime(unlock_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                    if now < unlock_date:
                        locked = True
                except Exception:
                    now_date_str = now.strftime("%Y-%m-%d")
                    if now_date_str < unlock_date_str:
                        locked = True

        # Compute completed status for this module
        mod_lessons = lessons_by_module.get(mid, [])
        required_lessons = [l for l in mod_lessons if l.get("required_completion", True)]
        
        lessons_completed = True
        if required_lessons:
            lessons_completed = all(l["id"] in completed_lesson_ids for l in required_lessons)
        elif mod_lessons:
            lessons_completed = all(l["id"] in completed_lesson_ids for l in mod_lessons)
        
        mod_quizzes = quizzes_by_module.get(mid, [])
        has_quiz = len(mod_quizzes) > 0
        quizzes_completed = True
        if has_quiz:
            quizzes_completed = all(q["id"] in passed_quiz_ids for q in mod_quizzes)

        # If module has a quiz: both lessons and quiz must be done.
        # If module has no quiz: completing all required lessons immediately completes the module!
        module_completed = lessons_completed and quizzes_completed

        if locked:
            module_completed = False
            
        previous_completed = previous_completed and module_completed

        result.append({
            "module_id": mid,
            "locked": locked,
            "passed": module_completed,
            "has_quiz": has_quiz,
            "quizzes_completed": quizzes_completed,
            "lessons_completed": lessons_completed,
            "total_lessons": len(mod_lessons),
            "completed_lessons": sum(1 for l in mod_lessons if l["id"] in completed_lesson_ids),
        })

    return success_response(data=result)
