from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from google.cloud.firestore_v1.client import Client
from typing import List, Optional
from datetime import datetime, timezone
import os
import uuid
import shutil
from pydantic import BaseModel
from ..core.dependencies import get_current_user, require_admin
from ..core.firebase import get_db
from ..core.cache import invalidate_cache
from ..utils.response import success_response
from ..schemas.user import UserUpdate

router = APIRouter()

@router.get("/me")
def get_user_me(
    current_user: dict = Depends(get_current_user)
):
    return success_response(data=current_user)

@router.put("/me")
def update_me(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    uid = current_user["id"]
    update_data = {k: v for k, v in user_update.model_dump(exclude_unset=True).items() if k != "role"}
    
    # Auto assemble name if first_name / last_name provided
    if ("first_name" in update_data or "last_name" in update_data) and "name" not in update_data:
        fn = update_data.get("first_name", current_user.get("first_name", ""))
        ln = update_data.get("last_name", current_user.get("last_name", ""))
        full_name = f"{fn} {ln}".strip()
        if full_name:
            update_data["name"] = full_name
            
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    user_ref = db.collection("users").document(uid)
    user_ref.set(update_data, merge=True)
    
    # Invalidate cached endpoints so new profile details immediately propagate
    invalidate_cache("community")
    invalidate_cache("discussions")
    invalidate_cache("instructor")
    invalidate_cache("courses")
    invalidate_cache("analytics")
    invalidate_cache("enrollments")
    
    updated_doc = user_ref.get()
    user_data = updated_doc.to_dict() if updated_doc.exists else {}
    user_data["id"] = uid
    return success_response(data=user_data, message="Profile updated")

@router.post("/upload-avatar")
def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    try:
        # Validate mime type
        if file.content_type and not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files (JPG, PNG, WebP, GIF) are allowed")
            
        uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        
        file_ext = os.path.splitext(file.filename or "")[1] or ".png"
        unique_filename = f"avatar_{current_user['id']}_{uuid.uuid4().hex[:8]}{file_ext}"
        file_path = os.path.join(uploads_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        base_url = str(request.base_url).rstrip("/")
        file_url = f"{base_url}/uploads/{unique_filename}"
        
        # Save photo_url to user document
        uid = current_user["id"]
        user_ref = db.collection("users").document(uid)
        user_ref.set({
            "photo_url": file_url,
            "updated_at": datetime.now(timezone.utc)
        }, merge=True)
        
        # Invalidate caches
        invalidate_cache("community")
        invalidate_cache("discussions")
        invalidate_cache("instructor")
        invalidate_cache("courses")
        invalidate_cache("analytics")
        invalidate_cache("enrollments")
        
        updated_doc = user_ref.get()
        user_data = updated_doc.to_dict() if updated_doc.exists else {}
        user_data["id"] = uid
        
        return success_response(data={"url": file_url, "user": user_data}, message="Avatar uploaded successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")

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
