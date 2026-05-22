from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from ..core.dependencies import get_current_user, require_instructor, require_admin
from ..core.firebase import get_db
from ..utils.response import success_response, error_response
from ..schemas.course import CourseCreate, CourseUpdate

router = APIRouter()

@router.get("/")
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
    for doc in docs:
        c = doc.to_dict()
        c["id"] = doc.id
        
        # instructor name lookup
        instructor_id = c.get("instructor_id", "")
        if instructor_id:
            instructor_ref = db.collection("users").document(instructor_id)
            inst_doc = instructor_ref.get()
            c["instructor_name"] = (
                inst_doc.to_dict().get("name", "Instructor") if inst_doc.exists else "Instructor"
            )
        else:
            c["instructor_name"] = "Instructor"
            
        courses.append(c)
    return success_response(data=courses)

@router.get("/me")
def get_instructor_courses(
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    docs = db.collection("courses").stream()
    courses = []
    for doc in docs:
        c = doc.to_dict()
        c["id"] = doc.id
        courses.append(c)
    return success_response(data=courses)

@router.get("/{course_id}")
def get_course(course_id: str, db: Client = Depends(get_db)):
    doc = db.collection("courses").document(course_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Course not found")
    data = doc.to_dict()
    data["id"] = doc.id
    
    # instructor name lookup
    instructor_id = data.get("instructor_id", "")
    if instructor_id:
        instructor_ref = db.collection("users").document(instructor_id)
        inst_doc = instructor_ref.get()
        data["instructor_name"] = (
            inst_doc.to_dict().get("name", "Instructor") if inst_doc.exists else "Instructor"
        )
    else:
        data["instructor_name"] = "Instructor"
        
    return success_response(data=data)

@router.post("/")
def create_course(
    course: CourseCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    course_data = course.model_dump()
    course_data.update({
        "instructor_id": current_user["id"],
        "rating_avg": 0.0,
        "enrollment_count": 0,
        "created_at": now,
        "updated_at": now
    })
    _, doc_ref = db.collection("courses").add(course_data)
    course_data["id"] = doc_ref.id
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
    return success_response(data=data, message="Course updated")

@router.get("/{course_id}/modules")
def get_course_modules(course_id: str, db: Client = Depends(get_db)):
    """Return modules with nested lessons for a course."""
    module_docs = (
        db.collection("modules")
        .where("course_id", "==", course_id)
        .stream()
    )
    result = []
    for m in module_docs:
        md = m.to_dict()
        md["id"] = m.id
        lesson_docs = (
            db.collection("lessons")
            .where("module_id", "==", m.id)
            .stream()
        )
        lessons = []
        for l in lesson_docs:
            ld = l.to_dict()
            ld["id"] = l.id
            lessons.append(ld)
        lessons.sort(key=lambda x: x.get("order", 0))
        md["lessons"] = lessons

        # Fetch resources for this module
        resource_docs = (
            db.collection("resources")
            .where("module_id", "==", m.id)
            .stream()
        )
        resources = []
        for r in resource_docs:
            rd = r.to_dict()
            rd["id"] = r.id
            resources.append(rd)
        resources.sort(key=lambda x: x.get("order", 0))
        md["resources"] = resources

        result.append(md)
        
    result.sort(key=lambda x: x.get("order", 0))
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
    course_ref.delete()
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
    ref.delete()
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
