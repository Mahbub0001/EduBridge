from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from .core.config import settings
from .core.firebase import init_firebase
import logging

# Initialize Firebase on application startup
init_firebase()

from .routers import auth, users, courses, enrollments, progress, quizzes, assignments, certificates, notifications, discussions, announcements, analytics, resources, categories, instructor

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for EduBridge MOOC Platform",
    version="1.0.0"
)

# Mount static files for uploads
import os
from fastapi.staticfiles import StaticFiles
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(courses.router, prefix="/api/courses", tags=["Courses"])
app.include_router(enrollments.router, prefix="/api", tags=["Enrollments"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(quizzes.router, prefix="/api", tags=["Quizzes"])
app.include_router(assignments.router, prefix="/api", tags=["Assignments"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["Certificates"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(discussions.router, prefix="/api/discussions", tags=["Discussions"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["Announcements"])
app.include_router(resources.router, prefix="/api", tags=["Resources"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(instructor.router, prefix="/api/instructor", tags=["Instructor Curriculum"])

# Global Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": str(exc.detail)}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "message": "Validation Error", "details": exc.errors()}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal Server Error"}
    )

@app.get("/")
def read_root():
    from .utils.response import success_response
    return success_response(message="Welcome to EduBridge MOOC Platform API")

@app.get("/health")
def health_check():
    from .utils.response import success_response
    return success_response(message="ok")
