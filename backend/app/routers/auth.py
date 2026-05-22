from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from ..core.dependencies import get_current_user_token, get_current_user
from ..core.firebase import get_db
from ..utils.response import success_response, error_response
from ..schemas.user import User

router = APIRouter()

@router.post("/session")
def login_session(
    token: dict = Depends(get_current_user_token),
    db: Client = Depends(get_db)
):
    uid = token.get("uid")
    email = token.get("email")
    name = token.get("name", email.split("@")[0] if email else "User")
    photo_url = token.get("picture", None)
    
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    
    now = datetime.now(timezone.utc)
    
    if not user_doc.exists:
        new_user_data = {
            "firebase_uid": uid,
            "email": email,
            "name": name,
            "photo_url": photo_url,
            "role": "student",
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }
        user_ref.set(new_user_data)
        user_data = new_user_data
        user_data["id"] = uid
    else:
        user_data = user_doc.to_dict()
        user_data["id"] = uid
        if user_data.get("status") == "blocked":
            raise HTTPException(
                status_code=403,
                detail="Your account has been blocked. Please contact support."
            )
        
    return success_response(data=user_data, message="Session established")

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return success_response(data=current_user)
