from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
from ..core.dependencies import get_current_user
from ..core.firebase import get_db
from ..core.cache import cache_response, invalidate_cache
from ..utils.response import success_response

router = APIRouter()


class PostCreatePayload(BaseModel):
    content: str
    tag: Optional[str] = "General"
    image_url: Optional[str] = None


class CommentCreatePayload(BaseModel):
    content: str


@router.get("/posts")
@cache_response(ttl=15, prefix="community_posts", is_user_scoped=True)
def get_community_posts(
    tag: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    query = db.collection("community_posts")
    if tag and tag != "All":
        query = query.where("tag", "==", tag)

    docs = list(query.stream())
    posts = []

    # Batch author user lookups
    user_ids = list(set([d.to_dict().get("author_id") for d in docs if d.to_dict().get("author_id")]))
    user_refs = [db.collection("users").document(u) for u in user_ids if u]
    user_map = {}
    if user_refs:
        user_docs = db.get_all(user_refs)
        for udoc in user_docs:
            if udoc.exists:
                ud = udoc.to_dict()
                user_map[udoc.id] = {
                    "name": ud.get("name") or ud.get("full_name") or "EduBridge User",
                    "role": ud.get("role", "student"),
                    "avatar": ud.get("avatar_url") or ud.get("picture") or "",
                }

    for d in docs:
        pd = d.to_dict()
        pid = d.id
        author_id = pd.get("author_id", "")
        author_info = user_map.get(author_id, {
            "name": pd.get("author_name", "EduBridge User"),
            "role": pd.get("author_role", "student"),
            "avatar": "",
        })

        likes_list = pd.get("liked_by", [])
        is_liked = uid in likes_list

        posts.append({
            "id": pid,
            "author_id": author_id,
            "author_name": author_info["name"],
            "author_role": author_info["role"],
            "author_avatar": author_info["avatar"],
            "content": pd.get("content", ""),
            "tag": pd.get("tag", "General"),
            "image_url": pd.get("image_url"),
            "created_at": pd.get("created_at"),
            "like_count": len(likes_list),
            "is_liked": is_liked,
            "comment_count": pd.get("comment_count", 0),
            "share_count": pd.get("share_count", 0),
        })

    posts.sort(key=lambda p: str(p.get("created_at") or ""), reverse=True)
    return success_response(data=posts)


@router.post("/posts")
def create_community_post(
    payload: PostCreatePayload,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    if not payload.content.trim() if hasattr(payload.content, "trim") else not payload.content.strip():
        raise HTTPException(status_code=400, detail="Post content cannot be empty")

    uid = current_user["id"]
    author_name = current_user.get("name") or current_user.get("full_name") or "EduBridge User"
    author_role = current_user.get("role") or "student"

    now = datetime.now(timezone.utc)
    post_data = {
        "author_id": uid,
        "author_name": author_name,
        "author_role": author_role,
        "content": payload.content.strip(),
        "tag": payload.tag or "General",
        "image_url": payload.image_url,
        "created_at": now.isoformat(),
        "liked_by": [],
        "comment_count": 0,
        "share_count": 0,
    }

    _, ref = db.collection("community_posts").add(post_data)
    post_data["id"] = ref.id
    post_data["like_count"] = 0
    post_data["is_liked"] = False

    invalidate_cache(["edubridge:community_posts*"])
    return success_response(data=post_data, message="Post created successfully")


@router.post("/posts/{post_id}/like")
def toggle_like_post(
    post_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    uid = current_user["id"]
    doc_ref = db.collection("community_posts").document(post_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")

    pd = doc.to_dict()
    liked_by = pd.get("liked_by", [])

    if uid in liked_by:
        liked_by.remove(uid)
        is_liked = False
    else:
        liked_by.append(uid)
        is_liked = True

    doc_ref.update({"liked_by": liked_by})
    invalidate_cache(["edubridge:community_posts*"])

    return success_response(data={
        "post_id": post_id,
        "is_liked": is_liked,
        "like_count": len(liked_by),
    })


@router.get("/posts/{post_id}/comments")
def get_post_comments(
    post_id: str,
    db: Client = Depends(get_db),
):
    comments_docs = list(
        db.collection("community_posts")
        .document(post_id)
        .collection("comments")
        .stream()
    )

    comments = []
    user_ids = list(set([c.to_dict().get("author_id") for c in comments_docs if c.to_dict().get("author_id")]))
    user_refs = [db.collection("users").document(u) for u in user_ids if u]
    user_map = {}
    if user_refs:
        user_docs = db.get_all(user_refs)
        for udoc in user_docs:
            if udoc.exists:
                ud = udoc.to_dict()
                user_map[udoc.id] = {
                    "name": ud.get("name") or ud.get("full_name") or "EduBridge User",
                    "role": ud.get("role", "student"),
                    "avatar": ud.get("avatar_url") or ud.get("picture") or "",
                }

    for c in comments_docs:
        cd = c.to_dict()
        cid = c.id
        author_id = cd.get("author_id", "")
        author_info = user_map.get(author_id, {
            "name": cd.get("author_name", "EduBridge User"),
            "role": cd.get("author_role", "student"),
            "avatar": "",
        })
        comments.append({
            "id": cid,
            "post_id": post_id,
            "author_id": author_id,
            "author_name": author_info["name"],
            "author_role": author_info["role"],
            "author_avatar": author_info["avatar"],
            "content": cd.get("content", ""),
            "created_at": cd.get("created_at"),
        })

    comments.sort(key=lambda c: str(c.get("created_at") or ""))
    return success_response(data=comments)


@router.post("/posts/{post_id}/comments")
def create_post_comment(
    post_id: str,
    payload: CommentCreatePayload,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    post_ref = db.collection("community_posts").document(post_id)
    post_doc = post_ref.get()
    if not post_doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")

    uid = current_user["id"]
    author_name = current_user.get("name") or current_user.get("full_name") or "EduBridge User"
    author_role = current_user.get("role") or "student"

    now = datetime.now(timezone.utc)
    comment_data = {
        "author_id": uid,
        "author_name": author_name,
        "author_role": author_role,
        "content": payload.content.strip(),
        "created_at": now.isoformat(),
    }

    _, ref = post_ref.collection("comments").add(comment_data)
    comment_data["id"] = ref.id
    comment_data["post_id"] = post_id

    # Increment comment count on post
    curr_count = post_doc.to_dict().get("comment_count", 0)
    post_ref.update({"comment_count": curr_count + 1})

    invalidate_cache(["edubridge:community_posts*"])
    return success_response(data=comment_data, message="Comment added")


@router.post("/posts/{post_id}/share")
def share_community_post(
    post_id: str,
    db: Client = Depends(get_db),
):
    post_ref = db.collection("community_posts").document(post_id)
    post_doc = post_ref.get()
    if not post_doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")

    curr_shares = post_doc.to_dict().get("share_count", 0)
    post_ref.update({"share_count": curr_shares + 1})

    return success_response(data={"share_count": curr_shares + 1}, message="Post shared")


@router.delete("/posts/{post_id}")
def delete_community_post(
    post_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    post_ref = db.collection("community_posts").document(post_id)
    post_doc = post_ref.get()
    if not post_doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")

    pd = post_doc.to_dict()
    if pd.get("author_id") != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    post_ref.delete()
    invalidate_cache(["edubridge:community_posts*"])
    return success_response(message="Post deleted successfully")
