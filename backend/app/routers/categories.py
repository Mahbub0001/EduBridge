from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from typing import Optional
from ..core.dependencies import require_admin
from ..core.firebase import get_db
from ..utils.response import success_response
from pydantic import BaseModel

router = APIRouter()


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""


@router.get("/")
def get_categories(db: Client = Depends(get_db)):
    docs = db.collection("categories").order_by("name").stream()
    categories = []
    for d in docs:
        cd = d.to_dict()
        cd["id"] = d.id
        categories.append(cd)
    return success_response(data=categories)


@router.post("/")
def create_category(
    category: CategoryCreate,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    data = category.model_dump()
    data["created_at"] = now
    _, ref = db.collection("categories").add(data)
    data["id"] = ref.id
    return success_response(data=data, message="Category created")


@router.put("/{category_id}")
def update_category(
    category_id: str,
    category: CategoryCreate,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    ref = db.collection("categories").document(category_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Category not found")
    data = category.model_dump()
    ref.update(data)
    updated = ref.get().to_dict()
    updated["id"] = category_id
    return success_response(data=updated, message="Category updated")


@router.delete("/{category_id}")
def delete_category(
    category_id: str,
    current_user: dict = Depends(require_admin),
    db: Client = Depends(get_db)
):
    ref = db.collection("categories").document(category_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Category not found")
    ref.delete()
    return success_response(message="Category deleted")
