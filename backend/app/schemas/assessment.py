from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Quizzes
class QuizBase(BaseModel):
    title: str
    course_id: str
    instructions: str
    passing_score: int

class QuizCreate(QuizBase):
    pass

class Quiz(QuizBase):
    id: str
    created_at: datetime
    updated_at: datetime

class QuizSubmit(BaseModel):
    answers: dict # question_id: answer

# Assignments
class AssignmentBase(BaseModel):
    title: str
    course_id: str
    instructions: str
    due_date: datetime
    total_marks: int

class AssignmentCreate(AssignmentBase):
    pass

class Assignment(AssignmentBase):
    id: str
    created_at: datetime
    updated_at: datetime

class AssignmentSubmit(BaseModel):
    submission_text: Optional[str] = None
    file_url: Optional[str] = None
