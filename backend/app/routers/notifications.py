from fastapi import APIRouter, Depends
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from ..core.dependencies import get_current_user
from ..core.firebase import get_db
from ..utils.response import success_response

router = APIRouter()


@router.get("/")
def get_notifications(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    docs = (
        db.collection("notifications")
        .where("user_id", "==", uid)
        .order_by("created_at", direction="DESCENDING")
        .limit(20)
        .stream()
    )
    results = []
    for d in docs:
        nd = d.to_dict()
        nd["id"] = d.id
        results.append(nd)

    if not results:
        return success_response(data=[])

    return success_response(data=results)


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    ref = db.collection("notifications").document(notification_id)
    doc = ref.get()
    if doc.exists:
        ref.update({"is_read": True})
    return success_response(message="Notification marked as read")
