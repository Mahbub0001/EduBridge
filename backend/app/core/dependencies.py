from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from .security import security, verify_firebase_token
from .firebase import get_db
from google.cloud.firestore_v1.client import Client

def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    return verify_firebase_token(credentials)

def get_current_user(token: dict = Depends(get_current_user_token), db: Client = Depends(get_db)):
    user_id = token.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user token")
    
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found in database")
    
    user_data = user_doc.to_dict()
    user_data["id"] = user_id
    return user_data

def require_role(allowed_roles: list[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role", "student")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker

def require_authenticated(current_user: dict = Depends(require_role(["student", "instructor", "admin", "super_admin"]))):
    return current_user

def require_instructor(current_user: dict = Depends(require_role(["instructor", "admin", "super_admin"]))):
    return current_user

def require_admin(current_user: dict = Depends(require_role(["admin", "super_admin"]))):
    return current_user

def require_super_admin(current_user: dict = Depends(require_role(["super_admin"]))):
    return current_user
