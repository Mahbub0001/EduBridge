from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from google.cloud.firestore_v1.client import Client
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from concurrent.futures import ThreadPoolExecutor
import os
import uuid
import shutil
from ..core.dependencies import require_instructor
from ..core.firebase import get_db
from ..core.cache import cache_response, invalidate_cache
from ..utils.response import success_response

router = APIRouter()

@router.post("/upload")
def upload_material(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_instructor)
):
    try:
        # Resolve uploads directory (backend/uploads)
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Save file with a unique ID to prevent name collisions
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(uploads_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Build absolute access URL using the requesting base URL
        base_url = str(request.base_url).rstrip("/")
        file_url = f"{base_url}/uploads/{unique_filename}"
        
        return success_response(data={"url": file_url}, message="File uploaded successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

# ── Permission Helper ──
def check_course_permission(course_id: str, current_user: dict, db: Client):
    course_doc = db.collection("courses").document(course_id).get()
    if not course_doc.exists:
        raise HTTPException(status_code=404, detail="Course not found")
    course_data = course_doc.to_dict()
    if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to manage this course")
    return course_data

# ── Schemas ──
class ModuleCreateUpdate(BaseModel):
    title: str
    description: Optional[str] = ""
    estimated_duration: Optional[int] = 0
    required_for_certificate: Optional[bool] = False
    unlock_rule: Optional[str] = "always"  # always, previous_completed, specific_date
    unlock_date: Optional[str] = ""

class LessonCreateUpdate(BaseModel):
    title: str
    type: str  # video, text, pdf, ppt, link
    content: Optional[str] = ""
    video_url: Optional[str] = ""
    file_url: Optional[str] = ""
    estimated_duration: Optional[int] = 0
    required_completion: Optional[bool] = True

class ResourceCreateUpdate(BaseModel):
    title: str
    type: str  # pdf, ppt, video, link, document
    url: str
    downloadable: Optional[bool] = True

# ── GET /instructor/courses ──
@router.get("/courses")
@cache_response(ttl=600, prefix="instructor", is_user_scoped=True)
def get_instructor_courses_list(
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

# ── GET /instructor/courses/{course_id}/builder ──
@router.get("/courses/{course_id}/builder")
@cache_response(ttl=60, prefix="instructor")
def get_course_builder_data(
    course_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    course_data = check_course_permission(course_id, current_user, db)
    course_data["id"] = course_id

    # Fetch nested modules
    module_docs = (
        db.collection("modules")
        .where("course_id", "==", course_id)
        .stream()
    )
    modules = []
    for m in module_docs:
        md = m.to_dict()
        md["id"] = m.id

        # Lessons
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

        # Resources
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

        # Quizzes
        quiz_docs = (
            db.collection("quizzes")
            .where("module_id", "==", m.id)
            .stream()
        )
        quizzes = []
        for q in quiz_docs:
            qd = q.to_dict()
            qd["id"] = q.id
            quizzes.append(qd)
        md["quizzes"] = quizzes

        # Assignments
        assignment_docs = (
            db.collection("assignments")
            .where("module_id", "==", m.id)
            .stream()
        )
        assignments = []
        for a in assignment_docs:
            ad = a.to_dict()
            ad["id"] = a.id
            assignments.append(ad)
        md["assignments"] = assignments

        modules.append(md)

    modules.sort(key=lambda x: x.get("order", 0))
    course_data["modules"] = modules
    return success_response(data=course_data)

# ── POST /instructor/courses/{course_id}/modules ──
@router.post("/courses/{course_id}/modules")
def create_course_module(
    course_id: str,
    payload: ModuleCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    check_course_permission(course_id, current_user, db)
    existing_modules = list(db.collection("modules").where("course_id", "==", course_id).stream())
    now = datetime.now(timezone.utc)
    data = payload.model_dump()
    data.update({
        "course_id": course_id,
        "order": len(existing_modules) + 1,
        "created_at": now,
        "updated_at": now
    })
    _, ref = db.collection("modules").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Module created successfully")

# ── PATCH /instructor/modules/{module_id} ──
@router.patch("/modules/{module_id}")
def update_course_module(
    module_id: str,
    payload: ModuleCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    module_ref = db.collection("modules").document(module_id)
    module_doc = module_ref.get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    course_id = module_doc.to_dict().get("course_id")
    check_course_permission(course_id, current_user, db)

    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.now(timezone.utc)
    module_ref.update(data)
    
    updated = module_ref.get().to_dict()
    updated["id"] = module_id
    return success_response(data=updated, message="Module updated successfully")

# ── DELETE /instructor/modules/{module_id} ──
@router.delete("/modules/{module_id}")
def delete_course_module(
    module_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    module_ref = db.collection("modules").document(module_id)
    module_doc = module_ref.get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    course_id = module_doc.to_dict().get("course_id")
    check_course_permission(course_id, current_user, db)

    # Clean up lessons & resources
    lessons = db.collection("lessons").where("module_id", "==", module_id).stream()
    for l in lessons:
        db.collection("lessons").document(l.id).delete()
    resources = db.collection("resources").where("module_id", "==", module_id).stream()
    for r in resources:
        db.collection("resources").document(r.id).delete()

    module_ref.delete()
    return success_response(message="Module deleted successfully")

# ── POST /instructor/modules/{module_id}/lessons ──
@router.post("/modules/{module_id}/lessons")
def create_module_lesson(
    module_id: str,
    payload: LessonCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    module_doc = db.collection("modules").document(module_id).get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    course_id = module_doc.to_dict().get("course_id")
    check_course_permission(course_id, current_user, db)

    existing_lessons = list(db.collection("lessons").where("module_id", "==", module_id).stream())
    now = datetime.now(timezone.utc)
    data = payload.model_dump()
    data.update({
        "module_id": module_id,
        "course_id": course_id,
        "order": len(existing_lessons) + 1,
        "created_at": now,
        "updated_at": now
    })
    _, ref = db.collection("lessons").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Lesson created successfully")

# ── PATCH /instructor/lessons/{lesson_id} ──
@router.patch("/lessons/{lesson_id}")
def update_module_lesson(
    lesson_id: str,
    payload: LessonCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    lesson_ref = db.collection("lessons").document(lesson_id)
    lesson_doc = lesson_ref.get()
    if not lesson_doc.exists:
        raise HTTPException(status_code=404, detail="Lesson not found")
    module_id = lesson_doc.to_dict().get("module_id")
    module_doc = db.collection("modules").document(module_id).get()
    course_id = module_doc.to_dict().get("course_id")
    check_course_permission(course_id, current_user, db)

    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.now(timezone.utc)
    lesson_ref.update(data)
    
    updated = lesson_ref.get().to_dict()
    updated["id"] = lesson_id
    return success_response(data=updated, message="Lesson updated successfully")

# ── DELETE /instructor/lessons/{lesson_id} ──
@router.delete("/lessons/{lesson_id}")
def delete_module_lesson(
    lesson_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    lesson_ref = db.collection("lessons").document(lesson_id)
    lesson_doc = lesson_ref.get()
    if not lesson_doc.exists:
        raise HTTPException(status_code=404, detail="Lesson not found")
    module_id = lesson_doc.to_dict().get("module_id")
    module_doc = db.collection("modules").document(module_id).get()
    course_id = module_doc.to_dict().get("course_id")
    check_course_permission(course_id, current_user, db)

    lesson_ref.delete()
    return success_response(message="Lesson deleted successfully")

# ── POST /instructor/modules/{module_id}/resources ──
@router.post("/modules/{module_id}/resources")
def create_module_resource(
    module_id: str,
    payload: ResourceCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    module_doc = db.collection("modules").document(module_id).get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    course_id = module_doc.to_dict().get("course_id")
    check_course_permission(course_id, current_user, db)

    existing_resources = list(db.collection("resources").where("module_id", "==", module_id).stream())
    now = datetime.now(timezone.utc)
    data = payload.model_dump()
    data.update({
        "module_id": module_id,
        "course_id": course_id,
        "order": len(existing_resources) + 1,
        "created_at": now,
        "updated_at": now
    })
    _, ref = db.collection("resources").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Resource created successfully")

# ── PATCH /instructor/resources/{resource_id} ──
@router.patch("/resources/{resource_id}")
def update_module_resource(
    resource_id: str,
    payload: ResourceCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    resource_ref = db.collection("resources").document(resource_id)
    resource_doc = resource_ref.get()
    if not resource_doc.exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    module_id = resource_doc.to_dict().get("module_id")
    module_doc = db.collection("modules").document(module_id).get()
    course_id = module_doc.to_dict().get("course_id")
    check_course_permission(course_id, current_user, db)

    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.now(timezone.utc)
    resource_ref.update(data)
    
    updated = resource_ref.get().to_dict()
    updated["id"] = resource_id
    return success_response(data=updated, message="Resource updated successfully")

# ── DELETE /instructor/resources/{resource_id} ──
@router.delete("/resources/{resource_id}")
def delete_module_resource(
    resource_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    resource_ref = db.collection("resources").document(resource_id)
    resource_doc = resource_ref.get()
    if not resource_doc.exists:
        raise HTTPException(status_code=404, detail="Resource not found")
    module_id = resource_doc.to_dict().get("module_id")
    module_doc = db.collection("modules").document(module_id).get()
    course_id = module_doc.to_dict().get("course_id")
    check_course_permission(course_id, current_user, db)

    resource_ref.delete()
    return success_response(message="Resource deleted successfully")

# ── POST /instructor/courses/{course_id}/publish-check ──
@router.post("/courses/{course_id}/publish-check")
def publish_validation_check(
    course_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    course_data = check_course_permission(course_id, current_user, db)
    
    checklist = []
    is_valid = True

    # 1. Course Title & Description
    if not course_data.get("title", "").strip():
        checklist.append({"item": "Course title is filled", "passed": False})
        is_valid = False
    else:
        checklist.append({"item": "Course title is filled", "passed": True})

    if not course_data.get("description", "").strip():
        checklist.append({"item": "Course description is filled", "passed": False})
        is_valid = False
    else:
        checklist.append({"item": "Course description is filled", "passed": True})

    # 2. Thumbnail
    if not course_data.get("thumbnail_url", "").strip():
        checklist.append({"item": "Course thumbnail image provided", "passed": False})
        is_valid = False
    else:
        checklist.append({"item": "Course thumbnail image provided", "passed": True})

    # 3. Learning Outcomes
    outcomes = [o for o in course_data.get("learning_outcomes", []) if o.strip()]
    if len(outcomes) == 0:
        checklist.append({"item": "At least one learning outcome defined", "passed": False})
        is_valid = False
    else:
        checklist.append({"item": "At least one learning outcome defined", "passed": True})

    # 4. Modules
    modules = list(db.collection("modules").where("course_id", "==", course_id).stream())
    if len(modules) == 0:
        checklist.append({"item": "At least one module defined", "passed": False})
        is_valid = False
    else:
        checklist.append({"item": "At least one module defined", "passed": True})

        # 5. Nested lessons/resources check
        nested_passed = True
        for m in modules:
            lessons_count = len(list(db.collection("lessons").where("module_id", "==", m.id).stream()))
            resources_count = len(list(db.collection("resources").where("module_id", "==", m.id).stream()))
            if lessons_count == 0 and resources_count == 0:
                nested_passed = False
                break
        
        if not nested_passed:
            checklist.append({"item": "Every module has at least one lesson or resource", "passed": False})
            is_valid = False
        else:
            checklist.append({"item": "Every module has at least one lesson or resource", "passed": True})

    return success_response(data={"is_valid": is_valid, "checklist": checklist})


# ── INSTRUCTOR QUIZ SCHEMAS ──
class QuizCreateUpdate(BaseModel):
    title: str
    instructions: Optional[str] = ""
    module_id: Optional[str] = None
    passing_score: Optional[int] = 60
    total_marks: Optional[int] = 100
    time_limit: Optional[int] = 30
    max_attempts: Optional[int] = 3
    shuffle_questions: Optional[bool] = False
    shuffle_options: Optional[bool] = False
    show_correct_answers: Optional[bool] = True
    available_from: Optional[str] = ""
    available_until: Optional[str] = ""
    due_days: Optional[int] = None
    status: Optional[str] = "draft"

class QuestionCreateUpdate(BaseModel):
    type: str  # mcq, true_false, short_answer
    question_text: str
    options: Optional[List[str]] = None
    correct_answer: str
    marks: Optional[int] = 1
    explanation: Optional[str] = ""


# ── INSTRUCTOR QUIZ ENDPOINTS ──

# 1. GET /instructor/courses/{course_id}/quizzes
@router.get("/courses/{course_id}/quizzes")
def get_instructor_course_quizzes(
    course_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    check_course_permission(course_id, current_user, db)
    docs = db.collection("quizzes").where("course_id", "==", course_id).stream()
    quizzes = []
    for doc in docs:
        q = doc.to_dict()
        q["id"] = doc.id
        
        # Append question count
        q["question_count"] = len(list(db.collection("questions").where("quiz_id", "==", doc.id).stream()))
        quizzes.append(q)
    return success_response(data=quizzes)

# 2. POST /instructor/courses/{course_id}/quizzes
@router.post("/courses/{course_id}/quizzes")
def create_instructor_course_quiz(
    course_id: str,
    payload: QuizCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    check_course_permission(course_id, current_user, db)
    now = datetime.now(timezone.utc)
    data = payload.model_dump()
    data.update({
        "course_id": course_id,
        "created_at": now,
        "updated_at": now
    })
    _, ref = db.collection("quizzes").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Quiz created successfully")

# 3. PATCH /instructor/quizzes/{quiz_id}
@router.patch("/quizzes/{quiz_id}")
def update_instructor_quiz(
    quiz_id: str,
    payload: QuizCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("quizzes").document(quiz_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz_data = doc.to_dict()
    check_course_permission(quiz_data.get("course_id"), current_user, db)

    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.now(timezone.utc)
    ref.update(data)
    
    updated = ref.get().to_dict()
    updated["id"] = quiz_id
    return success_response(data=updated, message="Quiz updated successfully")

# 4. DELETE /instructor/quizzes/{quiz_id}
@router.delete("/quizzes/{quiz_id}")
def delete_instructor_quiz(
    quiz_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("quizzes").document(quiz_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz_data = doc.to_dict()
    check_course_permission(quiz_data.get("course_id"), current_user, db)

    # Clean up nested questions
    questions = db.collection("questions").where("quiz_id", "==", quiz_id).stream()
    for q in questions:
        db.collection("questions").document(q.id).delete()
    
    ref.delete()
    return success_response(message="Quiz deleted successfully")

# 5. POST /instructor/quizzes/{quiz_id}/questions
@router.post("/quizzes/{quiz_id}/questions")
def create_instructor_quiz_question(
    quiz_id: str,
    payload: QuestionCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    quiz_ref = db.collection("quizzes").document(quiz_id)
    quiz_doc = quiz_ref.get()
    if not quiz_doc.exists:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz_data = quiz_doc.to_dict()
    check_course_permission(quiz_data.get("course_id"), current_user, db)

    existing = list(db.collection("questions").where("quiz_id", "==", quiz_id).stream())
    now = datetime.now(timezone.utc)
    data = payload.model_dump()
    data.update({
        "quiz_id": quiz_id,
        "order": len(existing) + 1,
        "created_at": now,
        "updated_at": now
    })
    _, ref = db.collection("questions").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Question added successfully")

# 6. PATCH /instructor/questions/{question_id}
@router.patch("/questions/{question_id}")
def update_instructor_question(
    question_id: str,
    payload: QuestionCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("questions").document(question_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Question not found")
    question_data = doc.to_dict()
    
    quiz_doc = db.collection("quizzes").document(question_data.get("quiz_id")).get()
    if not quiz_doc.exists:
        raise HTTPException(status_code=404, detail="Parent Quiz not found")
    check_course_permission(quiz_doc.to_dict().get("course_id"), current_user, db)

    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.now(timezone.utc)
    ref.update(data)
    
    updated = ref.get().to_dict()
    updated["id"] = question_id
    return success_response(data=updated, message="Question updated successfully")

# 7. DELETE /instructor/questions/{question_id}
@router.delete("/questions/{question_id}")
def delete_instructor_question(
    question_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("questions").document(question_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Question not found")
    question_data = doc.to_dict()

    quiz_doc = db.collection("quizzes").document(question_data.get("quiz_id")).get()
    if not quiz_doc.exists:
        raise HTTPException(status_code=404, detail="Parent Quiz not found")
    check_course_permission(quiz_doc.to_dict().get("course_id"), current_user, db)

    ref.delete()
    return success_response(message="Question deleted successfully")

# 8. PATCH /instructor/quizzes/{quiz_id}/publish
@router.patch("/quizzes/{quiz_id}/publish")
def publish_instructor_quiz_endpoint(
    quiz_id: str,
    body: dict,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    quiz_ref = db.collection("quizzes").document(quiz_id)
    quiz_doc = quiz_ref.get()
    if not quiz_doc.exists:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz_data = quiz_doc.to_dict()
    check_course_permission(quiz_data.get("course_id"), current_user, db)

    status = body.get("status", "draft")
    if status == "published":
        # Validate Passing Score
        passing = quiz_data.get("passing_score", 60)
        if passing < 0 or passing > 100:
            raise HTTPException(status_code=400, detail="Passing score must be between 0 and 100")
        
        # Validate time limit & max attempts
        time_limit = quiz_data.get("time_limit", 0)
        if time_limit is not None and time_limit < 0:
            raise HTTPException(status_code=400, detail="Time limit must be positive")
        
        max_attempts = quiz_data.get("max_attempts", 3)
        if max_attempts is not None and max_attempts <= 0:
            raise HTTPException(status_code=400, detail="Max attempts must be greater than 0")

        # Must have at least one question
        questions = list(db.collection("questions").where("quiz_id", "==", quiz_id).stream())
        if len(questions) == 0:
            raise HTTPException(status_code=400, detail="Quiz cannot be published without at least one question")

        # Validate MCQ questions
        for q in questions:
            qd = q.to_dict()
            q_type = qd.get("type", "mcq")
            if q_type == "mcq":
                options = qd.get("options", [])
                if len(options) < 2:
                    raise HTTPException(status_code=400, detail=f"MCQ Question '{qd.get('question_text')}' must have at least 2 options")
                if not qd.get("correct_answer"):
                    raise HTTPException(status_code=400, detail=f"MCQ Question '{qd.get('question_text')}' must have a correct answer selected")

    quiz_ref.update({
        "status": status,
        "updated_at": datetime.now(timezone.utc)
    })
    return success_response(message=f"Quiz successfully {status}!")

# 9. GET /instructor/quizzes/{quiz_id}/preview
@router.get("/quizzes/{quiz_id}/preview")
def preview_instructor_quiz(
    quiz_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    quiz_doc = db.collection("quizzes").document(quiz_id).get()
    if not quiz_doc.exists:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz_data = quiz_doc.to_dict()
    check_course_permission(quiz_data.get("course_id"), current_user, db)

    quiz_data["id"] = quiz_id
    question_docs = db.collection("questions").where("quiz_id", "==", quiz_id).stream()
    questions = []
    for q in question_docs:
        qd = q.to_dict()
        qd["id"] = q.id
        questions.append(qd)
    questions.sort(key=lambda x: x.get("order", 1))
    
    quiz_data["questions"] = questions
    return success_response(data=quiz_data)


# ── INSTRUCTOR ASSIGNMENT SCHEMAS ──
class RubricCriterion(BaseModel):
    name: str
    description: Optional[str] = ""
    max_marks: int

class AssignmentCreateUpdate(BaseModel):
    title: str
    instructions: Optional[str] = ""
    module_id: Optional[str] = None
    due_date: Optional[str] = None
    due_days: Optional[int] = None
    deadline_type: Optional[str] = "days"
    total_marks: Optional[int] = 100
    submission_type: Optional[str] = "both"  # text, file, both
    allow_late: Optional[bool] = False
    late_penalty: Optional[float] = 0.0
    allow_resubmission: Optional[bool] = True
    rubrics: Optional[List[RubricCriterion]] = None
    accepted_file_types: Optional[str] = ""
    max_file_size: Optional[str] = ""
    require_student_comment: Optional[bool] = False
    status: Optional[str] = "draft"

class RubricScore(BaseModel):
    criterion_name: str
    score: float

class GradeSubmissionInstructor(BaseModel):
    score: float
    feedback: Optional[str] = ""
    rubric_scores: Optional[List[RubricScore]] = None
    status: Optional[str] = "graded"  # graded / revision


# ── INSTRUCTOR ASSIGNMENT ENDPOINTS ──

# 1. GET /instructor/courses/{course_id}/assignments
@router.get("/courses/{course_id}/assignments")
def get_instructor_course_assignments(
    course_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    check_course_permission(course_id, current_user, db)
    docs = db.collection("assignments").where("course_id", "==", course_id).stream()
    assignments = []
    for doc in docs:
        a = doc.to_dict()
        a["id"] = doc.id
        
        # Add submission statistics
        sub_docs = list(db.collection("assignment_submissions").where("assignment_id", "==", doc.id).stream())
        a["submissions_count"] = len(sub_docs)
        a["graded_count"] = len([s for s in sub_docs if s.to_dict().get("status") == "graded"])
        
        assignments.append(a)
    return success_response(data=assignments)

# 2. POST /instructor/courses/{course_id}/assignments
@router.post("/courses/{course_id}/assignments")
def create_instructor_course_assignment(
    course_id: str,
    payload: AssignmentCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    check_course_permission(course_id, current_user, db)
    
    # Validation: Rubric marks must not exceed total marks
    if payload.rubrics:
        total_rubric = sum(r.max_marks for r in payload.rubrics)
        if total_rubric > payload.total_marks:
            raise HTTPException(status_code=400, detail=f"Total Rubrics score ({total_rubric}) cannot exceed Assignment max score ({payload.total_marks})")

    now = datetime.now(timezone.utc)
    data = payload.model_dump()
    data.update({
        "course_id": course_id,
        "created_at": now,
        "updated_at": now
    })
    _, ref = db.collection("assignments").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Assignment created successfully")

# 3. PATCH /instructor/assignments/{assignment_id}
@router.patch("/assignments/{assignment_id}")
def update_instructor_assignment(
    assignment_id: str,
    payload: AssignmentCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("assignments").document(assignment_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assign_data = doc.to_dict()
    check_course_permission(assign_data.get("course_id"), current_user, db)

    # Validation: Rubric marks must not exceed total marks
    if payload.rubrics:
        total_rubric = sum(r.max_marks for r in payload.rubrics)
        if total_rubric > payload.total_marks:
            raise HTTPException(status_code=400, detail=f"Total Rubrics score ({total_rubric}) cannot exceed Assignment max score ({payload.total_marks})")

    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.now(timezone.utc)
    ref.update(data)
    
    updated = ref.get().to_dict()
    updated["id"] = assignment_id
    return success_response(data=updated, message="Assignment updated successfully")

# 4. DELETE /instructor/assignments/{assignment_id}
@router.delete("/assignments/{assignment_id}")
def delete_instructor_assignment(
    assignment_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("assignments").document(assignment_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assign_data = doc.to_dict()
    check_course_permission(assign_data.get("course_id"), current_user, db)

    # Clean up submissions
    subs = db.collection("assignment_submissions").where("assignment_id", "==", assignment_id).stream()
    for s in subs:
        db.collection("assignment_submissions").document(s.id).delete()
    
    ref.delete()
    return success_response(message="Assignment deleted successfully")

# 5. GET /instructor/assignments/{assignment_id}/submissions
@router.get("/assignments/{assignment_id}/submissions")
@cache_response(ttl=45, prefix="instructor_submissions")
def get_instructor_assignment_submissions(
    assignment_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    assign_ref = db.collection("assignments").document(assignment_id)
    assign_doc = assign_ref.get()
    if not assign_doc.exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assign_data = assign_doc.to_dict()
    check_course_permission(assign_data.get("course_id"), current_user, db)

    docs = list(db.collection("assignment_submissions").where("assignment_id", "==", assignment_id).stream())
    submissions = []
    needed_user_ids = set()
    for d in docs:
        sd = d.to_dict()
        sd["id"] = d.id
        submissions.append(sd)
        if sd.get("user_id"):
            needed_user_ids.add(sd["user_id"])

    users_map = {}
    if needed_user_ids:
        user_refs = [db.collection("users").document(uid) for uid in needed_user_ids]
        user_docs = db.get_all(user_refs)
        for u in user_docs:
            if u.exists:
                users_map[u.id] = u.to_dict()

    for sd in submissions:
        user = users_map.get(sd.get("user_id", ""), {})
        sd["student_name"] = user.get("name", "Unknown student")
        sd["student_email"] = user.get("email", "")

    return success_response(data=submissions)

def _notify_student_assignment_status(db: Client, sub_data: dict, assign_doc_data: dict, status: str, feedback: Optional[str], score: Optional[float]):
    student_id = sub_data.get("user_id")
    if not student_id:
        return
    course_id = assign_doc_data.get("course_id", "")
    course_title = "Course"
    if course_id:
        c_doc = db.collection("courses").document(course_id).get()
        if c_doc.exists:
            course_title = c_doc.to_dict().get("title", "Course")
    assign_title = assign_doc_data.get("title", "Assignment")
    now = datetime.now(timezone.utc)

    is_revision = status in ["revision", "returned"]
    if is_revision:
        notif_title = f"Assignment Returned: {assign_title}"
        notif_msg = f"Your assignment '{assign_title}' in {course_title} was returned for revision by your instructor."
        if feedback:
            notif_msg += f" Feedback: \"{feedback}\""
    else:
        notif_title = f"Assignment Graded: {assign_title}"
        total_m = assign_doc_data.get("total_marks", 100)
        notif_msg = f"Your assignment '{assign_title}' in {course_title} has been graded: {score}/{total_m} marks."
        if feedback:
            notif_msg += f" Feedback: \"{feedback}\""

    db.collection("notifications").add({
        "user_id": student_id,
        "title": notif_title,
        "message": notif_msg,
        "type": "assignment",
        "course_id": course_id,
        "assignment_id": sub_data.get("assignment_id"),
        "link": f"/student/courses/{course_id}/learn?assignmentId={sub_data.get('assignment_id')}",
        "read": False,
        "is_read": False,
        "created_at": now
    })
    invalidate_cache([
        "edubridge:assignments*",
        f"edubridge:student_progress:{student_id}*",
        "edubridge:analytics*",
        "edubridge:instructor*"
    ])

# 6. PATCH /instructor/submissions/{submission_id}/grade
@router.patch("/submissions/{submission_id}/grade")
def grade_instructor_submission(
    submission_id: str,
    payload: GradeSubmissionInstructor,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    sub_ref = db.collection("assignment_submissions").document(submission_id)
    sub_doc = sub_ref.get()
    if not sub_doc.exists:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub_data = sub_doc.to_dict()

    assign_doc = db.collection("assignments").document(sub_data.get("assignment_id")).get()
    if not assign_doc.exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assign_doc_data = assign_doc.to_dict()
    check_course_permission(assign_doc_data.get("course_id"), current_user, db)

    now = datetime.now(timezone.utc)
    update_data = {
        "score": payload.score,
        "feedback": payload.feedback,
        "status": payload.status,  # graded / revision
        "graded_at": now,
        "graded_by": current_user["id"]
    }
    if payload.rubric_scores:
        update_data["rubric_scores"] = [r.model_dump() for r in payload.rubric_scores]

    sub_ref.update(update_data)
    
    _notify_student_assignment_status(
        db=db,
        sub_data=sub_data,
        assign_doc_data=assign_doc_data,
        status=payload.status or "graded",
        feedback=payload.feedback,
        score=payload.score
    )

    updated = sub_ref.get().to_dict()
    updated["id"] = submission_id
    invalidate_cache(["edubridge:instructor_submissions*", "edubridge:submissions*", "edubridge:analytics*"])
    return success_response(data=updated, message="Submission successfully graded!")

# 7. PATCH /instructor/assignments/{assignment_id}/publish
@router.patch("/assignments/{assignment_id}/publish")
def publish_instructor_assignment_endpoint(
    assignment_id: str,
    body: dict,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("assignments").document(assignment_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
    assign_data = doc.to_dict()
    check_course_permission(assign_data.get("course_id"), current_user, db)

    status = body.get("status", "draft")
    if status == "published":
        # Validations: title, instructions, due_date, marks
        if not assign_data.get("title", "").strip():
            raise HTTPException(status_code=400, detail="Assignment cannot be published without a title")
        if not assign_data.get("instructions", "").strip():
            raise HTTPException(status_code=400, detail="Assignment cannot be published without instructions")
        if not assign_data.get("due_date"):
            raise HTTPException(status_code=400, detail="Assignment cannot be published without a due date")
        if not assign_data.get("total_marks") or assign_data.get("total_marks") <= 0:
            raise HTTPException(status_code=400, detail="Assignment must have positive total marks")

    ref.update({
        "status": status,
        "updated_at": datetime.now(timezone.utc)
    })
    return success_response(message=f"Assignment successfully {status}!")


# ── INSTRUCTOR SUBMISSIONS GENERAL ENDPOINTS ──

# 10. GET /instructor/submissions
@router.get("/submissions")
@cache_response(ttl=30, prefix="instructor_submissions", is_user_scoped=True)
def get_instructor_all_submissions(
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    role = current_user.get("role", "student")
    
    # Get all courses (admin/super_admin see all, instructor sees only their own)
    if role in ["admin", "super_admin"]:
        courses = list(db.collection("courses").stream())
    else:
        courses = list(db.collection("courses").where("instructor_id", "==", uid).stream())
        
    course_ids = [c.id for c in courses]
    if not course_ids:
        return success_response(data=[])

    submissions = []
    
    # Chunk course assignment lookups to prevent IN limits
    assignments_docs = []
    for i in range(0, len(course_ids), 10):
        chunk = course_ids[i:i+10]
        chunk_docs = db.collection("assignments").where("course_id", "in", chunk).stream()
        assignments_docs.extend(list(chunk_docs))
        
    assignment_map = {}
    for a in assignments_docs:
        ad = a.to_dict()
        ad["id"] = a.id
        course_doc = next((c for c in courses if c.id == ad.get("course_id")), None)
        ad["course_title"] = course_doc.to_dict().get("title", "") if course_doc else "Unknown Course"
        assignment_map[a.id] = ad

    if not assignment_map:
        return success_response(data=[])

    # Fetch submissions in chunks of 10
    assign_ids = list(assignment_map.keys())
    sub_docs = []
    for i in range(0, len(assign_ids), 10):
        chunk = assign_ids[i:i+10]
        chunk_docs = db.collection("assignment_submissions").where("assignment_id", "in", chunk).stream()
        sub_docs.extend(list(chunk_docs))

    needed_user_ids = set()
    for d in sub_docs:
        sd = d.to_dict()
        sd["id"] = d.id
        
        assign = assignment_map.get(sd.get("assignment_id"))
        if assign:
            sd["assignment_title"] = assign.get("title")
            sd["course_title"] = assign.get("course_title")
            sd["course_id"] = assign.get("course_id")
            sd["due_date"] = assign.get("due_date")
            sd["total_marks"] = assign.get("total_marks", 100)
            sd["rubrics"] = assign.get("rubrics", [])
            submissions.append(sd)
            if sd.get("user_id"):
                needed_user_ids.add(sd["user_id"])

    users_map = {}
    if needed_user_ids:
        user_refs = [db.collection("users").document(uid) for uid in needed_user_ids]
        user_docs = db.get_all(user_refs)
        for u in user_docs:
            if u.exists:
                users_map[u.id] = u.to_dict()

    for sd in submissions:
        user = users_map.get(sd.get("user_id", ""), {})
        sd["student_name"] = user.get("name", "Unknown student")
        sd["student_email"] = user.get("email", "")

    submissions.sort(key=lambda x: x.get("submitted_at", ""), reverse=True)
    return success_response(data=submissions)

# 11. GET /instructor/submissions/{submission_id}
@router.get("/submissions/{submission_id}")
def get_instructor_single_submission(
    submission_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    sub_doc = db.collection("assignment_submissions").document(submission_id).get()
    if not sub_doc.exists:
        raise HTTPException(status_code=404, detail="Submission not found")
    sd = sub_doc.to_dict()
    sd["id"] = sub_doc.id

    assign_doc = db.collection("assignments").document(sd.get("assignment_id")).get()
    if not assign_doc.exists:
        raise HTTPException(status_code=404, detail="Parent Assignment not found")
    assign_data = assign_doc.to_dict()
    check_course_permission(assign_data.get("course_id"), current_user, db)

    sd["assignment_title"] = assign_data.get("title")
    sd["due_date"] = assign_data.get("due_date")
    sd["total_marks"] = assign_data.get("total_marks", 100)
    sd["rubrics"] = assign_data.get("rubrics", [])
    
    user_doc = db.collection("users").document(sd.get("user_id", "")).get()
    sd["student_name"] = user_doc.to_dict().get("name", "Unknown student") if user_doc.exists else "Unknown student"
    sd["student_email"] = user_doc.to_dict().get("email", "") if user_doc.exists else ""

    return success_response(data=sd)

# 12. PATCH /instructor/submissions/{submission_id}/return
@router.patch("/submissions/{submission_id}/return")
def return_instructor_submission_for_revision(
    submission_id: str,
    body: dict,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    sub_ref = db.collection("assignment_submissions").document(submission_id)
    sub_doc = sub_ref.get()
    if not sub_doc.exists:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub_data = sub_doc.to_dict()

    assign_doc = db.collection("assignments").document(sub_data.get("assignment_id")).get()
    if not assign_doc.exists:
        raise HTTPException(status_code=404, detail="Assignment not found")
    check_course_permission(assign_doc.to_dict().get("course_id"), current_user, db)

    now = datetime.now(timezone.utc)
    feedback_text = body.get("feedback", "Revision requested by instructor.")
    sub_ref.update({
        "status": "revision",
        "feedback": feedback_text,
        "returned_at": now,
        "returned_by": current_user["id"]
    })

    _notify_student_assignment_status(
        db=db,
        sub_data=sub_data,
        assign_doc_data=assign_doc.to_dict(),
        status="revision",
        feedback=feedback_text,
        score=None
    )

    updated = sub_ref.get().to_dict()
    updated["id"] = submission_id
    invalidate_cache(["edubridge:instructor_submissions*", "edubridge:submissions*", "edubridge:analytics*"])
    return success_response(data=updated, message="Submission returned for revision successfully!")


# ── INSTRUCTOR COMPREHENSIVE ANALYTICS ENDPOINT ──

@router.get("/analytics")
@cache_response(ttl=600, prefix="instructor_analytics", is_user_scoped=True)
def get_instructor_comprehensive_analytics(
    course_id: Optional[str] = None,
    date_range: Optional[str] = "all",
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    role = current_user.get("role", "student")

    # Get instructor's courses (admin/super_admin see all, instructor sees only their own)
    if role in ["admin", "super_admin"]:
        course_query = db.collection("courses")
    else:
        course_query = db.collection("courses").where("instructor_id", "==", uid)
        
    courses = list(course_query.stream())
    course_ids = [c.id for c in courses]
    course_map = {c.id: c.to_dict().get("title", "EduBridge Course") for c in courses}
    
    if course_id:
        if course_id not in course_ids:
            raise HTTPException(status_code=403, detail="You do not have permission to view this course analytics")
        active_ids = [course_id]
    else:
        active_ids = course_ids

    if not active_ids:
        # Return empty template
        return success_response(data={
            "summary": {"total_students": 0, "average_progress": 0, "completion_rate": 0, "quiz_pass_rate": 0, "assignment_rate": 0, "inactive_students": 0},
            "enrollment_trend": [], "progress_distribution": [], "quiz_performance": [], "assignment_status": [], "module_completion": [], "top_students": [], "at_risk_students": []
        })

    # Helper to parse dates safely
    def _parse_dt(val):
        if not val:
            return None
        if isinstance(val, datetime):
            return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
        try:
            dt = datetime.fromisoformat(str(val).replace("Z", "+00:00"))
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None

    now = datetime.now(timezone.utc)

    # ── HIGH-CONCURRENCY PARALLEL DATA INGESTION (PHASE 1) ──
    # Run independent Firestore queries concurrently
    def _fetch_enrollments():
        res = []
        for i in range(0, len(active_ids), 30):
            chunk = active_ids[i:i+30]
            res.extend([d.to_dict() for d in db.collection("enrollments").where("course_id", "in", chunk).stream()])
        return res

    def _fetch_quizzes():
        res = {}
        for i in range(0, len(active_ids), 30):
            chunk = active_ids[i:i+30]
            for q in db.collection("quizzes").where("course_id", "in", chunk).stream():
                qd = q.to_dict()
                qd["id"] = q.id
                res[q.id] = qd
        return res

    def _fetch_assignments():
        res = {}
        for i in range(0, len(active_ids), 30):
            chunk = active_ids[i:i+30]
            for a in db.collection("assignments").where("course_id", "in", chunk).stream():
                ad = a.to_dict()
                ad["id"] = a.id
                res[a.id] = ad
        return res

    def _fetch_modules():
        res = []
        for i in range(0, len(active_ids), 30):
            chunk = active_ids[i:i+30]
            for m in db.collection("modules").where("course_id", "in", chunk).stream():
                md = m.to_dict()
                md["id"] = m.id
                res.append(md)
        return res

    def _fetch_lessons():
        res = []
        for i in range(0, len(active_ids), 30):
            chunk = active_ids[i:i+30]
            for l in db.collection("lessons").where("course_id", "in", chunk).stream():
                ld = l.to_dict()
                ld["id"] = l.id
                res.append(ld)
        return res

    def _fetch_progress():
        res = []
        for i in range(0, len(active_ids), 30):
            chunk = active_ids[i:i+30]
            for p in db.collection("progress").where("course_id", "in", chunk).stream():
                res.append(p.to_dict())
        return res

    with ThreadPoolExecutor(max_workers=6) as executor:
        fut_enr = executor.submit(_fetch_enrollments)
        fut_qzs = executor.submit(_fetch_quizzes)
        fut_asg = executor.submit(_fetch_assignments)
        fut_mod = executor.submit(_fetch_modules)
        fut_les = executor.submit(_fetch_lessons)
        fut_prg = executor.submit(_fetch_progress)

        enrollments = fut_enr.result()
        quizzes_by_id = fut_qzs.result()
        assignments_by_id = fut_asg.result()
        modules_list = fut_mod.result()
        lessons_list = fut_les.result()
        progress_docs_list = fut_prg.result()

    # ── HIGH-CONCURRENCY PARALLEL DATA INGESTION (PHASE 2) ──
    # Run quiz_attempts and assignment_submissions queries concurrently
    def _fetch_quiz_attempts():
        res = []
        if quizzes_by_id:
            quiz_ids = list(quizzes_by_id.keys())
            for i in range(0, len(quiz_ids), 30):
                chunk = quiz_ids[i:i+30]
                for ad in db.collection("quiz_attempts").where("quiz_id", "in", chunk).stream():
                    res.append(ad.to_dict())
        return res

    def _fetch_assignment_submissions():
        res = []
        if assignments_by_id:
            assign_ids = list(assignments_by_id.keys())
            for i in range(0, len(assign_ids), 30):
                chunk = assign_ids[i:i+30]
                for s in db.collection("assignment_submissions").where("assignment_id", "in", chunk).stream():
                    res.append(s.to_dict())
        return res

    with ThreadPoolExecutor(max_workers=2) as executor:
        fut_att = executor.submit(_fetch_quiz_attempts)
        fut_sub = executor.submit(_fetch_assignment_submissions)
        quiz_attempts_list = fut_att.result()
        assignment_subs_list = fut_sub.result()

    # 1. Summary calculations
    enrolled_uids = list({e.get("user_id") for e in enrollments if e.get("user_id")})
    total_students = len(enrolled_uids)
    avg_progress = round(sum(e.get("progress_percent", 0) for e in enrollments) / len(enrollments), 1) if enrollments else 0.0
    completed_count = sum(1 for e in enrollments if e.get("status") == "completed" or e.get("progress_percent", 0) >= 100)
    completion_rate = round((completed_count / len(enrollments)) * 100, 1) if enrollments else 0.0

    # 2. Quizzes & Quiz Pass Rate & Quiz Performance
    quiz_pass_rate = 0.0
    quiz_performance = []

    if quizzes_by_id:
        attempts_passed = 0
        total_attempts = len(quiz_attempts_list)
        quiz_attempts_by_qid = {qid: [] for qid in quizzes_by_id}

        for att in quiz_attempts_list:
            qid = att.get("quiz_id")
            if qid in quiz_attempts_by_qid:
                quiz_attempts_by_qid[qid].append(att)
                if att.get("passed", False):
                    attempts_passed += 1

        if total_attempts > 0:
            quiz_pass_rate = round((attempts_passed / total_attempts) * 100, 1)

        for qid, qd in quizzes_by_id.items():
            atts = quiz_attempts_by_qid.get(qid, [])
            avg_score = round(sum(a.get("score", 0) for a in atts) / len(atts), 1) if atts else 0.0
            quiz_performance.append({
                "quiz_title": qd.get("title", "Assessment"),
                "average_score": avg_score
            })

    # 3. Assignment Submission Rate & Status
    assignment_rate = 0.0
    graded_count = 0
    pending_count = 0
    revision_count = 0

    if assignments_by_id:
        total_subs = len(assignment_subs_list)
        for sd in assignment_subs_list:
            status = sd.get("status", "pending")
            if status == "graded":
                graded_count += 1
            elif status == "revision":
                revision_count += 1
            else:
                pending_count += 1

        potential_total = len(enrollments) * len(assignments_by_id)
        if potential_total > 0:
            assignment_rate = round((total_subs / potential_total) * 100, 1)
            assignment_rate = min(assignment_rate, 100.0)

    assignment_status = [
        {"status": "Graded", "value": graded_count},
        {"status": "Pending Evaluation", "value": pending_count},
        {"status": "Requires Revision", "value": revision_count}
    ]

    # 4. Inactive students (progress < 15% and enrolled more than 7 days ago)
    inactive_students_count = 0
    for e in enrollments:
        prog = e.get("progress_percent", 0)
        p_dt = _parse_dt(e.get("enrolled_at"))
        if p_dt:
            days = (now - p_dt).days
            if prog < 15 and days > 7:
                inactive_students_count += 1
        else:
            if prog < 15:
                inactive_students_count += 1

    # ── EXACT REAL-TIME ENROLLMENT TREND ──
    parsed_enrollment_dts = []
    for e in enrollments:
        p_dt = _parse_dt(e.get("enrolled_at"))
        if p_dt:
            parsed_enrollment_dts.append(p_dt)

    if date_range == "7":
        enrollment_trend = []
        for i in range(6, -1, -1):
            day_target = (now - timedelta(days=i)).date()
            day_str = day_target.strftime("%Y-%m-%d")
            c = sum(1 for dt in parsed_enrollment_dts if dt.date() == day_target)
            enrollment_trend.append({"date": day_str, "enrollments": c})
    elif date_range == "30":
        enrollment_trend = []
        for i in range(29, -1, -1):
            day_target = (now - timedelta(days=i)).date()
            day_str = day_target.strftime("%Y-%m-%d")
            c = sum(1 for dt in parsed_enrollment_dts if dt.date() == day_target)
            enrollment_trend.append({"date": day_str, "enrollments": c})
    else:
        # All-time monthly trend
        # Ensure at least last 6 consecutive calendar months up to current month
        start_year = now.year
        start_month = now.month - 5
        while start_month <= 0:
            start_month += 12
            start_year -= 1

        if parsed_enrollment_dts:
            earliest = min(parsed_enrollment_dts)
            if (earliest.year < start_year) or (earliest.year == start_year and earliest.month < start_month):
                start_year = earliest.year
                start_month = earliest.month

        months_list = []
        cy, cm = start_year, start_month
        while (cy < now.year) or (cy == now.year and cm <= now.month):
            months_list.append(f"{cy:04d}-{cm:02d}")
            cm += 1
            if cm > 12:
                cm = 1
                cy += 1

        month_counts = {}
        for dt in parsed_enrollment_dts:
            m_str = dt.strftime("%Y-%m")
            month_counts[m_str] = month_counts.get(m_str, 0) + 1

        enrollment_trend = [{"date": m, "enrollments": month_counts.get(m, 0)} for m in months_list]

    # ── PROGRESS DISTRIBUTION ──
    buckets = {"0-20%": 0, "21-40%": 0, "41-60%": 0, "61-80%": 0, "81-100%": 0}
    for e in enrollments:
        p = e.get("progress_percent", 0)
        if p <= 20: buckets["0-20%"] += 1
        elif p <= 40: buckets["21-40%"] += 1
        elif p <= 60: buckets["41-60%"] += 1
        elif p <= 80: buckets["61-80%"] += 1
        else: buckets["81-100%"] += 1

    progress_distribution = [{"range": k, "students": v} for k, v in buckets.items()]

    # ── MODULE COMPLETION ──
    module_completion = []
    if modules_list:
        mod_lessons = {}
        for l in lessons_list:
            mid = l.get("module_id")
            if mid:
                mod_lessons.setdefault(mid, []).append(l["id"])

        user_completed_lessons = {}
        for p in progress_docs_list:
            if p.get("completed", False):
                user_completed_lessons.setdefault(p.get("user_id"), set()).add(p.get("lesson_id"))

        for m in modules_list:
            mid = m["id"]
            req_lessons = mod_lessons.get(mid, [])
            if req_lessons:
                comp_count = sum(1 for uid in enrolled_uids if all(lid in user_completed_lessons.get(uid, set()) for lid in req_lessons))
            else:
                comp_count = 0
            module_completion.append({
                "module_title": m.get("title", "Chapter"),
                "completions": comp_count
            })

    # ── TOP PERFORMING AND AT-RISK STUDENTS ──
    sorted_enrollments = sorted(enrollments, key=lambda x: x.get("progress_percent", 0), reverse=True)
    top_candidates = [e for e in sorted_enrollments if e.get("progress_percent", 0) >= 50][:10]
    risk_candidates = [e for e in reversed(sorted_enrollments) if e.get("progress_percent", 0) < 25][:10]
    needed_user_ids = list({e.get("user_id") for e in top_candidates + risk_candidates if e.get("user_id")})

    analytics_user_map = {}
    if needed_user_ids:
        for i in range(0, len(needed_user_ids), 100):
            chunk = needed_user_ids[i:i+100]
            refs = [db.collection("users").document(uid_str) for uid_str in chunk]
            for udoc in db.get_all(refs):
                if udoc.exists:
                    analytics_user_map[udoc.id] = udoc.to_dict()

    top_students = []
    for e in top_candidates:
        uid_val = e.get("user_id", "")
        u_data = analytics_user_map.get(uid_val)
        if u_data:
            c_title = course_map.get(e.get("course_id", ""), "EduBridge Course")
            u_quizzes = [qa for qa in quiz_attempts_list if qa.get("user_id") == uid_val]
            avg_q = round(sum(qa.get("score", 0) for qa in u_quizzes) / len(u_quizzes), 1) if u_quizzes else 0.0
            u_subs = [s for s in assignment_subs_list if s.get("user_id") == uid_val and s.get("status") == "graded"]
            assign_grade = round(sum(s.get("grade", 0) for s in u_subs) / len(u_subs), 1) if u_subs else 0.0
            top_students.append({
                "student_name": u_data.get("name", "Student"),
                "course_title": c_title,
                "progress": e.get("progress_percent", 0),
                "avg_quiz": avg_q,
                "assignment_grade": assign_grade
            })

    at_risk_students = []
    for e in risk_candidates:
        uid_val = e.get("user_id", "")
        u_data = analytics_user_map.get(uid_val)
        if u_data:
            cid = e.get("course_id", "")
            c_title = course_map.get(cid, "EduBridge Course")

            last_dt = None
            u_prog_dates = [
                _parse_dt(p.get("last_accessed_at") or p.get("completed_at"))
                for p in progress_docs_list
                if p.get("user_id") == uid_val and (p.get("last_accessed_at") or p.get("completed_at"))
            ]
            u_prog_dates = [d for d in u_prog_dates if d]
            if u_prog_dates:
                last_dt = max(u_prog_dates)
            else:
                last_dt = _parse_dt(e.get("enrolled_at"))

            if last_dt:
                diff_d = (now - last_dt).days
                if diff_d <= 0:
                    last_active_str = "Active today"
                elif diff_d == 1:
                    last_active_str = "1 day ago"
                else:
                    last_active_str = f"{diff_d} days ago"
            else:
                last_active_str = "Never"

            course_assignments = [aid for aid, ad in assignments_by_id.items() if ad.get("course_id") == cid]
            u_submitted_aids = {s.get("assignment_id") for s in assignment_subs_list if s.get("user_id") == uid_val}
            missing_count = len([aid for aid in course_assignments if aid not in u_submitted_aids])

            at_risk_students.append({
                "student_name": u_data.get("name", "Student"),
                "course_title": c_title,
                "progress": e.get("progress_percent", 0),
                "last_active": last_active_str,
                "missing_assignments": missing_count
            })

    data = {
        "summary": {
            "total_students": total_students,
            "average_progress": avg_progress,
            "completion_rate": completion_rate,
            "quiz_pass_rate": quiz_pass_rate,
            "assignment_rate": assignment_rate,
            "inactive_students": inactive_students_count
        },
        "enrollment_trend": enrollment_trend,
        "progress_distribution": progress_distribution,
        "quiz_performance": quiz_performance,
        "assignment_status": assignment_status,
        "module_completion": module_completion,
        "top_students": top_students[:10],
        "at_risk_students": at_risk_students[:10]
    }

    return success_response(data=data)


# ── INSTRUCTOR ANNOUNCEMENT SCHEMAS ──
class AnnouncementCreateUpdate(BaseModel):
    title: str
    content: str
    course_id: str
    target: Optional[str] = "all"  # all, module
    module_id: Optional[str] = None
    priority: Optional[str] = "normal"  # normal, important, urgent
    status: Optional[str] = "draft"  # draft / published
    schedule_date: Optional[str] = None


# ── INSTRUCTOR ANNOUNCEMENT HELPER ──
def create_course_announcement_notifications(
    course_id: str,
    course_title: str,
    priority: str,
    content: str,
    db: Client,
    announcement_id: Optional[str] = None,
    ann_title: Optional[str] = None,
    module_id: Optional[str] = None
):
    module_title = None
    if module_id:
        mod_doc = db.collection("modules").document(module_id).get()
        if mod_doc.exists:
            module_title = mod_doc.to_dict().get("title")

    enroll_docs = db.collection("enrollments").where("course_id", "==", course_id).stream()
    now = datetime.now(timezone.utc)
    label = (priority or "normal").upper()
    mod_tag = f" [{module_title}]" if module_title else ""
    headline = ann_title if ann_title else f"Announcement: {course_title}"

    for e in enroll_docs:
        ed = e.to_dict()
        uid = ed.get("user_id")
        if uid:
            db.collection("notifications").add({
                "user_id": uid,
                "title": f"[{label}]{mod_tag} {headline}",
                "message": f"{content[:120]}...",
                "is_read": False,
                "read": False,
                "type": "announcement",
                "course_id": course_id,
                "announcement_id": announcement_id,
                "module_id": module_id,
                "link": f"/student/announcements?course_id={course_id}",
                "created_at": now
            })


# ── INSTRUCTOR ANNOUNCEMENT ENDPOINTS ──

# 1. GET /instructor/announcements
@router.get("/announcements")
def get_instructor_announcements(
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    role = current_user.get("role", "student")

    # Get instructor's courses (admin/super_admin see all, instructor sees only their own)
    if role in ["admin", "super_admin"]:
        courses = list(db.collection("courses").stream())
    else:
        courses = list(db.collection("courses").where("instructor_id", "==", uid).stream())
        
    course_ids = [c.id for c in courses]
    if not course_ids:
        return success_response(data=[])

    course_map = {c.id: c.to_dict().get("title", "Course") for c in courses}

    # Fetch announcements chunked to prevent IN limitations
    announcements = []
    for i in range(0, len(course_ids), 10):
        chunk = course_ids[i:i+10]
        docs = db.collection("announcements").where("course_id", "in", chunk).stream()
        for d in docs:
            ad = d.to_dict()
            ad["id"] = d.id
            ad["course_title"] = course_map.get(ad.get("course_id"), "EduBridge Course")
            
            author_doc = db.collection("users").document(ad.get("author_id", "")).get()
            ad["author_name"] = author_doc.to_dict().get("name", "Instructor") if author_doc.exists else "Instructor"
            announcements.append(ad)

    announcements.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return success_response(data=announcements)

# 2. POST /instructor/announcements
@router.post("/announcements")
def create_instructor_announcement(
    payload: AnnouncementCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    check_course_permission(payload.course_id, current_user, db)
    
    course_doc = db.collection("courses").document(payload.course_id).get()
    course_title = course_doc.to_dict().get("title", "EduBridge Course") if course_doc.exists else "EduBridge Course"

    now = datetime.now(timezone.utc)
    data = payload.model_dump()
    data.update({
        "author_id": current_user["id"],
        "created_at": now,
        "updated_at": now
    })
    if payload.status == "published":
        data["published_at"] = now

    _, ref = db.collection("announcements").add(data)
    data["id"] = ref.id

    # Create notifications if published immediately
    if payload.status == "published":
        create_course_announcement_notifications(
            payload.course_id,
            course_title,
            payload.priority,
            payload.content,
            db,
            announcement_id=ref.id,
            ann_title=payload.title,
            module_id=payload.module_id if payload.target == "module" else None
        )

    return success_response(data=data, message="Announcement created successfully!")

# 3. PATCH /instructor/announcements/{announcement_id}
@router.patch("/announcements/{announcement_id}")
def update_instructor_announcement(
    announcement_id: str,
    payload: AnnouncementCreateUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("announcements").document(announcement_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Announcement not found")
    ann_data = doc.to_dict()
    check_course_permission(ann_data.get("course_id"), current_user, db)

    # If status is changing to published, trigger notifications
    now = datetime.now(timezone.utc)
    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = now

    trigger_notifications = False
    if payload.status == "published" and ann_data.get("status") != "published":
        data["published_at"] = now
        trigger_notifications = True

    ref.update(data)
    
    if trigger_notifications:
        course_doc = db.collection("courses").document(ann_data.get("course_id")).get()
        course_title = course_doc.to_dict().get("title", "EduBridge Course") if course_doc.exists else "EduBridge Course"
        create_course_announcement_notifications(
            ann_data.get("course_id"),
            course_title,
            payload.priority,
            payload.content,
            db,
            announcement_id=announcement_id,
            ann_title=payload.title,
            module_id=payload.module_id if payload.target == "module" else None
        )

    updated = ref.get().to_dict()
    updated["id"] = announcement_id
    return success_response(data=updated, message="Announcement updated successfully!")

# 4. DELETE /instructor/announcements/{announcement_id}
@router.delete("/announcements/{announcement_id}")
def delete_instructor_announcement(
    announcement_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("announcements").document(announcement_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Announcement not found")
    ann_data = doc.to_dict()
    check_course_permission(ann_data.get("course_id"), current_user, db)

    ref.delete()
    return success_response(message="Announcement deleted successfully!")

# 5. PATCH /instructor/announcements/{announcement_id}/publish
@router.patch("/announcements/{announcement_id}/publish")
def publish_instructor_announcement_endpoint(
    announcement_id: str,
    body: dict,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("announcements").document(announcement_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Announcement not found")
    ann_data = doc.to_dict()
    check_course_permission(ann_data.get("course_id"), current_user, db)

    status = body.get("status", "draft")
    now = datetime.now(timezone.utc)
    
    update_data = {
        "status": status,
        "updated_at": now
    }
    
    trigger_notifications = False
    if status == "published" and ann_data.get("status") != "published":
        update_data["published_at"] = now
        trigger_notifications = True

    ref.update(update_data)
    
    if trigger_notifications:
        course_doc = db.collection("courses").document(ann_data.get("course_id")).get()
        course_title = course_doc.to_dict().get("title", "EduBridge Course") if course_doc.exists else "EduBridge Course"
        create_course_announcement_notifications(
            ann_data.get("course_id"),
            course_title,
            ann_data.get("priority", "normal"),
            ann_data.get("content", ""),
            db,
            announcement_id=announcement_id,
            ann_title=ann_data.get("title"),
            module_id=ann_data.get("module_id") if ann_data.get("target") == "module" else None
        )

    return success_response(message=f"Announcement successfully {status}!")


# ── INSTRUCTOR DISCUSSION SCHEMAS ──
class InstructorReplyCreate(BaseModel):
    content: str
    student_id: Optional[str] = None


# ── INSTRUCTOR DISCUSSION MODERATION ENDPOINTS ──

# 1. GET /instructor/discussions
@router.get("/discussions")
def get_instructor_discussions(
    course_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    role = current_user.get("role", "student")

    # Get instructor's courses (admin/super_admin see all, instructor sees only their own)
    if role in ["admin", "super_admin"]:
        courses = list(db.collection("courses").stream())
    else:
        courses = list(db.collection("courses").where("instructor_id", "==", uid).stream())

    course_ids = [c.id for c in courses]
    if not course_ids:
        return success_response(data=[])

    course_map = {c.id: c.to_dict().get("title", "Course") for c in courses}

    # If specific course requested, only use that
    if course_id:
        if course_id in course_ids:
            course_ids = [course_id]
        else:
            return success_response(data=[])

    # Fetch discussions chunked to prevent Firestore IN limit
    raw_discussions = []
    for i in range(0, len(course_ids), 30):
        chunk = course_ids[i:i+30]
        docs = db.collection("discussions").where("course_id", "in", chunk).stream()
        for d in docs:
            dd = d.to_dict()
            dd["id"] = d.id

            # Apply module filter
            if module_id and dd.get("module_id") != module_id:
                continue

            dd["course_title"] = course_map.get(dd.get("course_id"), "Course")
            raw_discussions.append(dd)

    if not raw_discussions:
        return success_response(data=[])

    # Batch fetch module titles
    needed_mod_ids = list({dd["module_id"] for dd in raw_discussions if dd.get("is_module_feedback") and dd.get("module_id")})
    module_map = {}
    if needed_mod_ids:
        for i in range(0, len(needed_mod_ids), 100):
            chunk = needed_mod_ids[i:i+100]
            refs = [db.collection("modules").document(mid) for mid in chunk]
            for mdoc in db.get_all(refs):
                if mdoc.exists:
                    module_map[mdoc.id] = mdoc.to_dict().get("title", "Unknown Module")

    # Batch fetch authors
    needed_author_ids = list({dd.get("author_id") for dd in raw_discussions if dd.get("author_id")})
    author_map = {}
    if needed_author_ids:
        for i in range(0, len(needed_author_ids), 100):
            chunk = needed_author_ids[i:i+100]
            refs = [db.collection("users").document(aid) for aid in chunk]
            for udoc in db.get_all(refs):
                if udoc.exists:
                    udata = udoc.to_dict()
                    author_map[udoc.id] = {
                        "name": udata.get("name", "Student"),
                        "photo_url": udata.get("photo_url", "")
                    }

    # Batch count replies
    thread_ids = [dd["id"] for dd in raw_discussions]
    reply_counts = {tid: 0 for tid in thread_ids}
    for i in range(0, len(thread_ids), 30):
        chunk = thread_ids[i:i+30]
        for r in db.collection("discussion_replies").where("thread_id", "in", chunk).stream():
            tid = r.to_dict().get("thread_id")
            if tid in reply_counts:
                reply_counts[tid] += 1

    discussions = []
    for dd in raw_discussions:
        if dd.get("is_module_feedback") and dd.get("module_id"):
            dd["module_title"] = module_map.get(dd["module_id"], "Unknown Module")

        author = author_map.get(dd.get("author_id", ""), {})
        dd["author_name"] = author.get("name", "Student")
        dd["author_photo"] = author.get("photo_url", "")
        dd["reply_count"] = reply_counts.get(dd["id"], 0)
        dd["report_count"] = dd.get("report_count", 0)
        discussions.append(dd)

    discussions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return success_response(data=discussions)

# 2. GET /instructor/discussions/{discussion_id}
@router.get("/discussions/{discussion_id}")
def get_instructor_discussion_detail(
    discussion_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(discussion_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
    
    dd = doc.to_dict()
    check_course_permission(dd.get("course_id"), current_user, db)
    dd["id"] = discussion_id

    # Hydrate author
    author_doc = db.collection("users").document(dd.get("author_id", "")).get()
    dd["author_name"] = author_doc.to_dict().get("name", "Student") if author_doc.exists else "Student"
    dd["author_photo"] = author_doc.to_dict().get("photo_url", "") if author_doc.exists else ""

    # Hydrate course title
    course_doc = db.collection("courses").document(dd.get("course_id")).get()
    dd["course_title"] = course_doc.to_dict().get("title", "Course") if course_doc.exists else "Course"

    # Hydrate module title if module feedback
    if dd.get("is_module_feedback") and dd.get("module_id"):
        mod_doc = db.collection("modules").document(dd["module_id"]).get()
        dd["module_title"] = mod_doc.to_dict().get("title", "Unknown Module") if mod_doc.exists else "Unknown Module"

    # Hydrate replies (sort in memory - no composite index needed)
    replies_raw = list(db.collection("discussion_replies").where("thread_id", "==", discussion_id).stream())
    replies_raw.sort(key=lambda r: r.to_dict().get("created_at") or "")
    replies = []
    for r in replies_raw:
        rd = r.to_dict()
        rd["id"] = r.id
        
        reply_author = db.collection("users").document(rd.get("author_id", "")).get()
        rd["author_name"] = reply_author.to_dict().get("name", "User") if reply_author.exists else "User"
        rd["author_photo"] = reply_author.to_dict().get("photo_url", "") if reply_author.exists else ""
        rd["author_role"] = reply_author.to_dict().get("role", "student") if reply_author.exists else "student"
        
        replies.append(rd)
        
    dd["replies"] = replies
    dd["reply_count"] = len(replies)
    return success_response(data=dd)

# 3. POST /instructor/discussions/{discussion_id}/reply
@router.post("/discussions/{discussion_id}/reply")
def reply_to_discussion_as_instructor(
    discussion_id: str,
    payload: InstructorReplyCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    thread_ref = db.collection("discussions").document(discussion_id)
    thread_doc = thread_ref.get()
    if not thread_doc.exists:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
    
    thread_data = thread_doc.to_dict()
    check_course_permission(thread_data.get("course_id"), current_user, db)

    target_student_id = payload.student_id
    if not target_student_id:
        if thread_data.get("author_id") and thread_data.get("author_id") != "system":
            target_student_id = thread_data.get("author_id")
        else:
            recent_replies = list(db.collection("discussion_replies").where("thread_id", "==", discussion_id).stream())
            for rep in reversed(sorted(recent_replies, key=lambda x: x.to_dict().get("created_at") or datetime.min.replace(tzinfo=timezone.utc))):
                rd = rep.to_dict()
                if not rd.get("is_instructor") and rd.get("author_id"):
                    target_student_id = rd.get("student_id") or rd.get("author_id")
                    break

    now = datetime.now(timezone.utc)
    data = {
        "thread_id": discussion_id,
        "author_id": current_user["id"],
        "student_id": target_student_id or "",
        "content": payload.content,
        "created_at": now,
        "is_instructor": True
    }
    
    _, ref = db.collection("discussion_replies").add(data)
    data["id"] = ref.id

    # Auto-mark the discussion as answered!
    thread_ref.update({"is_answered": True, "updated_at": now})

    if target_student_id:
        db.collection("notifications").add({
            "user_id": target_student_id,
            "type": "discussion_reply",
            "thread_id": discussion_id,
            "message": f"Instructor replied to your question: '{payload.content[:60]}...'",
            "is_read": False,
            "created_at": now
        })

    return success_response(data=data, message="Reply added successfully!")

# 4. PATCH /instructor/discussions/{discussion_id}/pin
@router.patch("/discussions/{discussion_id}/pin")
def pin_discussion_thread(
    discussion_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(discussion_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
    
    thread_data = doc.to_dict()
    check_course_permission(thread_data.get("course_id"), current_user, db)

    pinned = thread_data.get("is_pinned", False)
    ref.update({"is_pinned": not pinned})
    return success_response(message=f"Discussion successfully {'pinned' if not pinned else 'unpinned'}!")

# 5. PATCH /instructor/discussions/{discussion_id}/hide
@router.patch("/discussions/{discussion_id}/hide")
def hide_discussion_thread(
    discussion_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(discussion_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
    
    thread_data = doc.to_dict()
    check_course_permission(thread_data.get("course_id"), current_user, db)

    hidden = thread_data.get("is_hidden", False)
    ref.update({"is_hidden": not hidden})
    return success_response(message=f"Discussion successfully {'hidden' if not hidden else 'unhidden'}!")

# 6. DELETE /instructor/discussions/{discussion_id}
@router.delete("/discussions/{discussion_id}")
def delete_discussion_thread(
    discussion_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(discussion_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
    
    thread_data = doc.to_dict()
    check_course_permission(thread_data.get("course_id"), current_user, db)

    # Cascading delete all replies
    replies = db.collection("discussion_replies").where("thread_id", "==", discussion_id).stream()
    for r in replies:
        db.collection("discussion_replies").document(r.id).delete()

    ref.delete()
    return success_response(message="Discussion successfully deleted!")

# 7. PATCH /instructor/discussions/{discussion_id}/answered
@router.patch("/discussions/{discussion_id}/answered")
def toggle_discussion_answered(
    discussion_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(discussion_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Discussion thread not found")
    
    thread_data = doc.to_dict()
    check_course_permission(thread_data.get("course_id"), current_user, db)

    answered = thread_data.get("is_answered", False)
    ref.update({"is_answered": not answered})
    return success_response(message=f"Discussion successfully marked as {'answered' if not answered else 'unanswered'}!")


# ── INSTRUCTOR STUDENTS ENROLLMENT LIST ENDPOINT ──
class StudentReminderRequest(BaseModel):
    course_id: str
    message: Optional[str] = None

class StudentNoteSaveRequest(BaseModel):
    course_id: str
    notes: str

@router.get("/students")
@cache_response(ttl=600, prefix="instructor", is_user_scoped=True)
def get_instructor_students_list(
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    role = current_user.get("role", "student")

    # Get instructor's courses (admin/super_admin see all, instructor sees only their own)
    if role in ["admin", "super_admin"]:
        courses = list(db.collection("courses").stream())
    else:
        courses = list(db.collection("courses").where("instructor_id", "==", uid).stream())
        
    course_ids = [c.id for c in courses]
    if not course_ids:
        return success_response(data=[])

    course_map = {c.id: c.to_dict().get("title", "Course") for c in courses}
    course_instructor_map = {c.id: c.to_dict().get("instructor_id") for c in courses}
    current_email = (current_user.get("email") or "").strip().lower()

    # Fetch all enrollments for these courses
    enroll_docs = []
    for i in range(0, len(course_ids), 30):
        chunk = course_ids[i:i+30]
        docs = db.collection("enrollments").where("course_id", "in", chunk).stream()
        enroll_docs.extend(list(docs))

    if not enroll_docs:
        return success_response(data=[])

    # Extract student IDs
    student_ids = list({e.to_dict().get("user_id") for e in enroll_docs if e.to_dict().get("user_id")})
    if not student_ids:
        return success_response(data=[])

    # Batch fetch user docs
    user_map = {}
    for i in range(0, len(student_ids), 100):
        chunk = student_ids[i:i+100]
        refs = [db.collection("users").document(sid) for sid in chunk]
        for udoc in db.get_all(refs):
            if udoc.exists:
                user_map[udoc.id] = udoc.to_dict()

    # Pre-fetch all quizzes for these courses
    course_quizzes = {}
    all_quiz_ids = []
    for i in range(0, len(course_ids), 30):
        chunk = course_ids[i:i+30]
        for q in db.collection("quizzes").where("course_id", "in", chunk).stream():
            all_quiz_ids.append(q.id)
            cid = q.to_dict().get("course_id")
            course_quizzes.setdefault(cid, []).append(q.id)

    # Fetch quiz attempts for these quizzes
    student_quiz_scores = {}
    if all_quiz_ids:
        quiz_to_course = {}
        for cid, qids in course_quizzes.items():
            for qid in qids:
                quiz_to_course[qid] = cid

        for i in range(0, len(all_quiz_ids), 30):
            chunk = all_quiz_ids[i:i+30]
            for qa in db.collection("quiz_attempts").where("quiz_id", "in", chunk).stream():
                qad = qa.to_dict()
                sid = qad.get("user_id")
                qid = qad.get("quiz_id")
                cid = quiz_to_course.get(qid)
                if sid and cid:
                    score = qad.get("score", 0)
                    student_quiz_scores.setdefault((sid, cid), []).append(score)

    # Pre-fetch all assignments for these courses
    course_assignments = {}
    all_assignment_ids = []
    for i in range(0, len(course_ids), 30):
        chunk = course_ids[i:i+30]
        for a in db.collection("assignments").where("course_id", "in", chunk).stream():
            all_assignment_ids.append(a.id)
            cid = a.to_dict().get("course_id")
            course_assignments.setdefault(cid, []).append(a.id)

    # Fetch assignment submissions for these assignments
    student_subs = {}
    if all_assignment_ids:
        assign_to_course = {}
        for cid, aids in course_assignments.items():
            for aid in aids:
                assign_to_course[aid] = cid

        for i in range(0, len(all_assignment_ids), 30):
            chunk = all_assignment_ids[i:i+30]
            for s in db.collection("assignment_submissions").where("assignment_id", "in", chunk).stream():
                sd = s.to_dict()
                sid = sd.get("user_id")
                aid = sd.get("assignment_id")
                cid = assign_to_course.get(aid)
                if sid and cid:
                    student_subs.setdefault((sid, cid), []).append(sd.get("status", "submitted"))

    # Pre-fetch certificates
    certs_set = set()
    for i in range(0, len(course_ids), 30):
        chunk = course_ids[i:i+30]
        for c in db.collection("certificates").where("course_id", "in", chunk).stream():
            cd = c.to_dict()
            if cd.get("user_id") and cd.get("course_id"):
                certs_set.add((cd.get("user_id"), cd.get("course_id")))

    students = []
    for e in enroll_docs:
        ed = e.to_dict()
        student_id = ed.get("user_id")
        course_id = ed.get("course_id")
        if not student_id or not course_id:
            continue

        # Exclude the instructor themselves or the author of the course
        if student_id == uid or student_id == course_instructor_map.get(course_id):
            continue

        ud = user_map.get(student_id)
        if not ud:
            continue

        student_role = ud.get("role", "student")
        student_email = (ud.get("email") or "").strip().lower()

        # Exclude instructors and admins from student lists
        if student_role in ["instructor", "admin", "super_admin"]:
            continue
        if student_email == current_email:
            continue

        scores = student_quiz_scores.get((student_id, course_id), [])
        quiz_avg = sum(scores) / len(scores) if scores else 0

        subs = student_subs.get((student_id, course_id), [])
        if not subs:
            assign_status = "No Submissions"
        else:
            pending_count = sum(1 for st in subs if st == "submitted")
            assign_status = "Pending Grading" if pending_count > 0 else "Graded"

        cert_status = "Issued" if (student_id, course_id) in certs_set else "None"
        progress = ed.get("progress_percent", 0)

        students.append({
            "id": student_id,
            "name": ud.get("name", "Student"),
            "email": ud.get("email", ""),
            "photo_url": ud.get("photo_url", ""),
            "course_id": course_id,
            "course_title": course_map.get(course_id, "Course"),
            "progress": progress,
            "enrolled_at": ed.get("enrolled_at", ""),
            "last_active": ed.get("last_active", ed.get("enrolled_at", "")),
            "quiz_average": round(quiz_avg, 1),
            "assignment_status": assign_status,
            "certificate_status": cert_status
        })

    return success_response(data=students)


# ── GET STUDENT DETAILED PROGRESS ENDPOINT ──
@router.get("/students/{student_id}/progress")
@cache_response(ttl=300, prefix="instructor")
def get_instructor_student_progress(
    student_id: str,
    course_id: str, # passed as query parameter
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    check_course_permission(course_id, current_user, db)

    # 1. Fetch Student User
    user_doc = db.collection("users").document(student_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="Student not found")
    ud = user_doc.to_dict()

    # 2. Fetch Enrollment details
    enroll_docs = list(
        db.collection("enrollments")
        .where("user_id", "==", student_id)
        .where("course_id", "==", course_id)
        .limit(1)
        .stream()
    )
    if not enroll_docs:
        raise HTTPException(status_code=404, detail="Student enrollment not found in this course")
    ed = enroll_docs[0].to_dict()

    # 3. Fetch Completed Lessons
    progress_docs = list(
        db.collection("progress")
        .where("user_id", "==", student_id)
        .where("course_id", "==", course_id)
        .stream()
    )
    completed_lessons = [pd.to_dict().get("lesson_id") for pd in progress_docs if pd.to_dict().get("lesson_id")]

    # Modules completed count
    modules_docs = db.collection("modules").where("course_id", "==", course_id).stream()
    modules_list = []
    for m in modules_docs:
        md = m.to_dict()
        md["id"] = m.id
        # get lessons of this module
        lessons_docs = db.collection("lessons").where("module_id", "==", m.id).stream()
        lessons = [ld.id for ld in lessons_docs]
        
        is_module_completed = False
        if lessons:
            is_module_completed = all(l_id in completed_lessons for l_id in lessons)
            
        modules_list.append({
            "id": m.id,
            "title": md.get("title", "Module"),
            "is_completed": is_module_completed,
            "lesson_count": len(lessons)
        })

    # 4. Fetch Quiz Attempts
    quizzes_in_course = list(db.collection("quizzes").where("course_id", "==", course_id).stream())
    quiz_ids = [q.id for q in quizzes_in_course]
    quiz_attempts_docs = []
    for qid in quiz_ids:
        qa = db.collection("quiz_attempts").where("user_id", "==", student_id).where("quiz_id", "==", qid).stream()
        quiz_attempts_docs.extend(list(qa))
    quiz_attempts = []
    for qa in quiz_attempts_docs:
        qad = qa.to_dict()
        quiz_doc = db.collection("quizzes").document(qad.get("quiz_id", "")).get()
        quiz_title = quiz_doc.to_dict().get("title", "Quiz") if quiz_doc.exists else "Quiz"
        
        quiz_attempts.append({
            "id": qa.id,
            "quiz_title": quiz_title,
            "score": qad.get("score", 0),
            "max_score": qad.get("max_score", 100),
            "passed": qad.get("passed", False),
            "attempted_at": qad.get("created_at", qad.get("attempted_at", ""))
        })

    # 5. Fetch Assignment Submissions
    subs_docs = (
        db.collection("assignment_submissions")
        .where("user_id", "==", student_id)
        .stream()
    )
    assignments = []
    for s in subs_docs:
        sd = s.to_dict()
        assign_doc = db.collection("assignments").document(sd.get("assignment_id", "")).get()
        if assign_doc.exists:
            ad = assign_doc.to_dict()
            if ad.get("course_id") == course_id:
                assignments.append({
                    "id": s.id,
                    "assignment_title": ad.get("title", "Assignment"),
                    "submitted_at": sd.get("submitted_at", ""),
                    "status": sd.get("status", "submitted"),
                    "grade": sd.get("grade", 0),
                    "feedback": sd.get("feedback", ""),
                    "max_grade": ad.get("total_marks", 100)
                })

    # 6. Fetch Discussion posts / replies
    disc_posts = list(
        db.collection("discussions")
        .where("author_id", "==", student_id)
        .where("course_id", "==", course_id)
        .stream()
    )
    disc_replies = list(
        db.collection("discussion_replies")
        .where("author_id", "==", student_id)
        .stream()
    )
    
    # Filter replies to match active discussions in this course
    course_discussion_ids = {d.id for d in disc_posts}
    course_reply_count = 0
    for dr in disc_replies:
        drd = dr.to_dict()
        if drd.get("thread_id") in course_discussion_ids:
            course_reply_count += 1

    # 7. Fetch Certificates
    certs_docs = (
        db.collection("certificates")
        .where("user_id", "==", student_id)
        .where("course_id", "==", course_id)
        .stream()
    )
    certificates = []
    for c in certs_docs:
        cd = c.to_dict()
        certificates.append({
            "id": c.id,
            "issued_at": cd.get("issued_at", ""),
            "certificate_url": cd.get("certificate_url", "")
        })

    # 8. Fetch Private Instructor Notes
    note_id = f"{current_user['id']}_{student_id}_{course_id}"
    note_doc = db.collection("instructor_notes").document(note_id).get()
    notes = note_doc.to_dict().get("notes", "") if note_doc.exists else ""

    payload = {
        "student": {
            "id": student_id,
            "name": ud.get("name", "Student"),
            "email": ud.get("email", ""),
            "photo_url": ud.get("photo_url", "")
        },
        "progress_percent": ed.get("progress_percent", 0),
        "enrolled_at": ed.get("enrolled_at", ""),
        "last_active": ed.get("last_active", ed.get("enrolled_at", "")),
        "modules": modules_list,
        "quiz_attempts": quiz_attempts,
        "assignments": assignments,
        "discussions_count": len(disc_posts) + course_reply_count,
        "certificates": certificates,
        "instructor_notes": notes
    }

    return success_response(data=payload)


# ── POST STUDENT REMINDER ENDPOINT ──
@router.post("/students/{student_id}/reminder")
def send_student_reminder(
    student_id: str,
    payload: StudentReminderRequest,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    check_course_permission(payload.course_id, current_user, db)
    
    course_doc = db.collection("courses").document(payload.course_id).get()
    course_title = course_doc.to_dict().get("title", "Course") if course_doc.exists else "Course"

    now = datetime.now(timezone.utc)
    notif_data = {
        "user_id": student_id,
        "title": f"Reminder for {course_title}",
        "message": payload.message or f"Hi! Your instructor noticed you haven't completed your syllabus progress in {course_title}. Log back in to continue learning!",
        "type": "announcement",
        "read": False,
        "created_at": now
    }
    
    db.collection("notifications").add(notif_data)
    return success_response(message="Friendly student progress reminder successfully sent!")


# ── POST SAVE STUDENT NOTES ENDPOINT ──
@router.post("/students/{student_id}/notes")
def save_student_private_notes(
    student_id: str,
    payload: StudentNoteSaveRequest,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    check_course_permission(payload.course_id, current_user, db)
    
    note_id = f"{current_user['id']}_{student_id}_{payload.course_id}"
    now = datetime.now(timezone.utc)
    
    db.collection("instructor_notes").document(note_id).set({
        "instructor_id": current_user["id"],
        "student_id": student_id,
        "course_id": payload.course_id,
        "notes": payload.notes,
        "updated_at": now
    }, merge=True)
    
    return success_response(message="Private student notes successfully saved!")








