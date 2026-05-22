from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from ..core.dependencies import get_current_user, require_instructor
from ..core.firebase import get_db
from ..utils.response import success_response
from ..schemas.assessment import QuizSubmit

router = APIRouter()


@router.get("/courses/{course_id}/quizzes")
def get_course_quizzes(course_id: str, db: Client = Depends(get_db)):
    docs = db.collection("quizzes").where("course_id", "==", course_id).stream()
    quizzes = []
    for doc in docs:
        q = doc.to_dict()
        q["id"] = doc.id
        quizzes.append(q)
    return success_response(data=quizzes)


@router.get("/courses/{course_id}/quizzes/{quiz_id}")
def get_quiz(quiz_id: str, db: Client = Depends(get_db)):
    doc = db.collection("quizzes").document(quiz_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Quiz not found")
    data = doc.to_dict()
    data["id"] = doc.id
    return success_response(data=data)


@router.get("/quizzes/{quiz_id}/questions")
def get_quiz_questions(quiz_id: str, current_user: dict = Depends(get_current_user), db: Client = Depends(get_db)):
    docs = (
        db.collection("questions")
        .where("quiz_id", "==", quiz_id)
        .order_by("order")
        .stream()
    )
    questions = []
    for doc in docs:
        q = doc.to_dict()
        q["id"] = doc.id
        if current_user.get("role") not in ["instructor", "admin", "super_admin"]:
            q.pop("correct_answer", None)
        questions.append(q)
    return success_response(data=questions)


@router.get("/quizzes/{quiz_id}/attempts")
def get_my_attempts(
    quiz_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    docs = (
        db.collection("quiz_attempts")
        .where("quiz_id", "==", quiz_id)
        .where("user_id", "==", uid)
        .order_by("submitted_at", direction="DESCENDING")
        .stream()
    )
    attempts = []
    for d in docs:
        ad = d.to_dict()
        ad["id"] = d.id
        attempts.append(ad)
    return success_response(data=attempts)


@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(
    quiz_id: str,
    submission: QuizSubmit,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    quiz_ref = db.collection("quizzes").document(quiz_id)
    quiz_doc = quiz_ref.get()
    if not quiz_doc.exists:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz_data = quiz_doc.to_dict()
    uid = current_user["id"]

    # Check max attempts (default 3)
    existing = list(
        db.collection("quiz_attempts")
        .where("quiz_id", "==", quiz_id)
        .where("user_id", "==", uid)
        .stream()
    )
    max_attempts = quiz_data.get("max_attempts", 3)
    if len(existing) >= max_attempts:
        raise HTTPException(status_code=400, detail="Maximum attempts reached")

    # Grade the quiz
    questions = list(
        db.collection("questions")
        .where("quiz_id", "==", quiz_id)
        .stream()
    )
    correct_count = 0
    total = len(questions)
    for q in questions:
        qd = q.to_dict()
        qid = q.id
        user_answer = submission.answers.get(qid)
        if user_answer is not None and str(user_answer) == str(qd.get("correct_answer")):
            correct_count += 1

    score = round((correct_count / max(total, 1)) * 100, 1)
    passing = quiz_data.get("passing_score", 60)
    passed = score >= passing

    now = datetime.now(timezone.utc)
    attempt_data = {
        "quiz_id": quiz_id,
        "user_id": uid,
        "answers": submission.answers,
        "submitted_at": now,
        "score": score,
        "passed": passed,
        "correct_count": correct_count,
        "total_questions": total,
    }

    _, doc_ref = db.collection("quiz_attempts").add(attempt_data)
    attempt_data["id"] = doc_ref.id

    return success_response(data=attempt_data, message="Quiz submitted successfully")


class QuizCreate(BaseModel):
    title: str
    course_id: str
    instructions: Optional[str] = ""
    passing_score: Optional[int] = 60
    max_attempts: Optional[int] = 3


class QuestionCreate(BaseModel):
    question_text: str
    options: list[str]
    correct_answer: str
    order: Optional[int] = 1


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    options: Optional[list[str]] = None
    correct_answer: Optional[str] = None
    order: Optional[int] = None


@router.post("/courses/{course_id}/quizzes")
def create_quiz(
    course_id: str,
    quiz: QuizCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    data = quiz.model_dump()
    data["created_at"] = now
    data["updated_at"] = now
    _, ref = db.collection("quizzes").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Quiz created")


@router.put("/quizzes/{quiz_id}")
def update_quiz(
    quiz_id: str,
    quiz: QuizCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("quizzes").document(quiz_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Quiz not found")
    data = quiz.model_dump()
    data["updated_at"] = datetime.now(timezone.utc)
    ref.update(data)
    updated = ref.get().to_dict()
    updated["id"] = quiz_id
    return success_response(data=updated, message="Quiz updated")


@router.delete("/quizzes/{quiz_id}")
def delete_quiz(
    quiz_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("quizzes").document(quiz_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = db.collection("questions").where("quiz_id", "==", quiz_id).stream()
    for q in questions:
        db.collection("questions").document(q.id).delete()
    ref.delete()
    return success_response(message="Quiz deleted")


@router.post("/quizzes/{quiz_id}/questions")
def create_question(
    quiz_id: str,
    question: QuestionCreate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    quiz_ref = db.collection("quizzes").document(quiz_id)
    if not quiz_ref.get().exists:
        raise HTTPException(status_code=404, detail="Quiz not found")
    now = datetime.now(timezone.utc)
    data = question.model_dump()
    data["quiz_id"] = quiz_id
    data["created_at"] = now
    _, ref = db.collection("questions").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Question added")


@router.put("/questions/{question_id}")
def update_question(
    question_id: str,
    question: QuestionUpdate,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("questions").document(question_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Question not found")
    data = question.model_dump(exclude_unset=True)
    ref.update(data)
    updated = ref.get().to_dict()
    updated["id"] = question_id
    return success_response(data=updated, message="Question updated")


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("questions").document(question_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Question not found")
    ref.delete()
    return success_response(message="Question deleted")
