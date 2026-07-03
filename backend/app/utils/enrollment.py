from google.cloud.firestore_v1.client import Client


def enrollment_doc_id(user_id: str, course_id: str) -> str:
    return f"{user_id}_{course_id}"


def find_user_enrollment(db: Client, user_id: str, course_id: str):
    """Find a user's enrollment without a composite Firestore index."""
    doc_ref = db.collection("enrollments").document(enrollment_doc_id(user_id, course_id))
    doc = doc_ref.get()
    if doc.exists:
        return doc

    for snapshot in db.collection("enrollments").where("user_id", "==", user_id).stream():
        if snapshot.to_dict().get("course_id") == course_id:
            return snapshot
    return None


def map_enrollment_status(raw_status: str) -> str:
    return "completed" if raw_status == "completed" else "in-progress"


def build_enrolled_course(course_doc, enrollment_data: dict) -> dict:
    course = course_doc.to_dict()
    raw_status = enrollment_data.get("status", "active")
    mapped = {
        **course,
        "id": course_doc.id,
        "course_status": course.get("status"),
        "progress": enrollment_data.get("progress_percent", 0),
        "status": map_enrollment_status(raw_status),
        "enrolled_at": enrollment_data.get("enrolled_at"),
    }
    if raw_status == "completed":
        mapped["final_grade"] = enrollment_data.get("final_grade")
        mapped["completed_on"] = enrollment_data.get("completed_at")
    return mapped
