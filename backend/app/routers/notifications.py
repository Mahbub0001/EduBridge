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
        .stream()
    )
    results = []
    for d in docs:
        nd = d.to_dict()
        nd["id"] = d.id
        is_read_flag = nd.get("read", nd.get("is_read", False))
        nd["read"] = is_read_flag
        nd["is_read"] = is_read_flag
        results.append(nd)

    results.sort(key=lambda n: str(n.get("created_at") or ""), reverse=True)

    return success_response(data=results[:30])


@router.patch("/read-all")
def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    docs = db.collection("notifications").where("user_id", "==", uid).stream()
    batch = db.batch()
    updated = False
    for d in docs:
        data = d.to_dict()
        if not data.get("read") or not data.get("is_read"):
            batch.update(d.reference, {"is_read": True, "read": True})
            updated = True
    if updated:
        batch.commit()
    return success_response(message="All notifications marked as read")


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    ref = db.collection("notifications").document(notification_id)
    doc = ref.get()
    if doc.exists:
        ref.update({"is_read": True, "read": True})
    return success_response(message="Notification marked as read")
