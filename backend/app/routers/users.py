from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from typing import List, Optional
from pydantic import BaseModel
from ..core.dependencies import get_current_user, require_admin
from ..core.firebase import get_db
from ..utils.response import success_response
from ..schemas.user import UserUpdate

router = APIRouter()

@router.put("/me")
def update_me(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    update_data = {k: v for k, v in user_update.model_dump(exclude_unset=True).items() if k != "role"}
    
    if not update_data:
        return success_response(data=current_user)
        
    user_ref = db.collection("users").document(uid)
    user_ref.update(update_data)
    
    updated_doc = user_ref.get()
    user_data = updated_doc.to_dict()
    user_data["id"] = uid
    return success_response(data=user_data, message="Profile updated")

class RoleUpdate(BaseModel):
    role: str


class StatusUpdate(BaseModel):
    status: str


@router.get("/")
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    query = db.collection("users")
    if role:
        query = query.where("role", "==", role)
    docs = query.limit(limit).offset(skip).stream()
    users = []
    for doc in docs:
        user_data = doc.to_dict()
        user_data["id"] = doc.id
        if search:
            if search.lower() not in (user_data.get("name", "") + user_data.get("email", "")).lower():
                continue
        if status:
            if user_data.get("status", "active") != status:
                continue
        users.append(user_data)
    return success_response(data=users)


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: str,
    body: RoleUpdate,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    if body.role not in ["student", "instructor", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user_ref = db.collection("users").document(user_id)
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    user_ref.update({"role": body.role})
    return success_response(message=f"User role updated to {body.role}")


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: str,
    body: StatusUpdate,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    if body.status not in ["active", "blocked"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    user_ref = db.collection("users").document(user_id)
    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
    user_ref.update({"status": body.status})
    return success_response(message=f"User status updated to {body.status}")
