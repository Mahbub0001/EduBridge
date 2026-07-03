# Module Feedback & Discussions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a module-level feedback/comment section to every course module, extending the existing discussions system.

**Architecture:** Extend existing `discussions` Firestore collection with `module_id` field; auto-create one discussion thread per module; reuse `discussion_replies` for comments; add new `instructor_discussions.py` backend router to fix the frontend-backend gap; add `ModuleFeedback` React component to CourseLearning page.

**Tech Stack:** FastAPI (Python), Firebase Firestore, React + TypeScript + Tailwind CSS

## Global Constraints

- All Python code follows existing patterns: Pydantic models inline, `success_response` helper, `get_current_user` dependency for auth
- All TypeScript/React code follows existing patterns: lucide-react icons, Tailwind classes, Card/Button/Badge UI components
- Firestore collections: `discussions`, `discussion_replies`, `notifications`, `modules`, `courses`
- Frontend API calls use `api` service from `../../services/api` with `unwrap` helper
- New components go in `frontend/src/components/module/`
- New backend routers go in `backend/app/routers/`

---
### Task 1: Backend — Add module discussion endpoints to `discussions.py`

**Files:**
- Modify: `backend/app/routers/discussions.py`

**Interfaces:**
- Consumes: Existing `get_current_user`, `get_db`, `success_response`
- Produces: `GET /discussions/modules/{module_id}` returns `{thread: discussion_doc, replies: [...]}`, `POST /discussions/modules/{module_id}/comments` returns `{reply}`

- [ ] **Step 1: Add module_id to existing course listing filter**

Modify `GET /courses/{course_id}` — add a `.where("is_module_feedback", "!=", True)` filter so module feedback threads don't appear in the course discussion listing.

```python
@router.get("/courses/{course_id}")
def get_course_discussions(
    course_id: str,
    db: Client = Depends(get_db)
):
    docs = db.collection("discussions").where("course_id", "==", course_id).where("is_module_feedback", "!=", True).order_by("created_at", direction="DESCENDING").stream()
    # ... rest unchanged
```

- [ ] **Step 2: Add GET /modules/{module_id} endpoint with auto-create logic**

```python
class ModuleCommentCreate(BaseModel):
    content: str

@router.get("/modules/{module_id}")
def get_module_discussion(
    module_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    # Verify module exists
    module_ref = db.collection("modules").document(module_id)
    module_doc = module_ref.get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    module_data = module_doc.to_dict()
    course_id = module_data.get("course_id")

    # Check enrollment or instructor access
    user_id = current_user["id"]
    user_role = current_user.get("role", "student")
    enrollments = list(db.collection("enrollments").where("user_id", "==", user_id).where("course_id", "==", course_id).stream())
    if user_role not in ["instructor", "admin", "super_admin"] and len(enrollments) == 0:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Find or auto-create module discussion
    existing = list(db.collection("discussions").where("module_id", "==", module_id).limit(1).stream())
    if existing:
        thread_doc = existing[0]
        thread_data = thread_doc.to_dict()
        thread_data["id"] = thread_doc.id
    else:
        now = datetime.now(timezone.utc)
        thread_data = {
            "course_id": course_id,
            "module_id": module_id,
            "title": f"Module: {module_data.get('title', 'Untitled')} \u2014 Feedback & Questions",
            "content": "Ask questions or share feedback about this module.",
            "author_id": "system",
            "is_module_feedback": True,
            "is_pinned": False,
            "is_hidden": False,
            "created_at": now,
            "updated_at": now
        }
        _, ref = db.collection("discussions").add(thread_data)
        thread_data["id"] = ref.id

    # Fetch replies
    replies = list(db.collection("discussion_replies").where("thread_id", "==", thread_data["id"]).order_by("created_at").stream())
    reply_list = []
    for r in replies:
        rd = r.to_dict()
        rd["id"] = r.id
        author_doc = db.collection("users").document(rd.get("author_id", "")).get()
        rd["author_name"] = author_doc.to_dict().get("name", "Unknown") if author_doc.exists else "Unknown"
        rd["author_photo"] = author_doc.to_dict().get("photo_url", "") if author_doc.exists else ""
        rd["author_role"] = author_doc.to_dict().get("role", "") if author_doc.exists else ""
        reply_list.append(rd)

    return success_response(data={"thread": thread_data, "replies": reply_list})
```

- [ ] **Step 3: Add POST /modules/{module_id}/comments endpoint**

```python
@router.post("/modules/{module_id}/comments")
def create_module_comment(
    module_id: str,
    comment: ModuleCommentCreate,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    # Verify module and get course_id
    module_doc = db.collection("modules").document(module_id).get()
    if not module_doc.exists:
        raise HTTPException(status_code=404, detail="Module not found")
    course_id = module_doc.to_dict().get("course_id")

    # Check enrollment
    user_id = current_user["id"]
    user_role = current_user.get("role", "student")
    enrollments = list(db.collection("enrollments").where("user_id", "==", user_id).where("course_id", "==", course_id).stream())
    if user_role not in ["instructor", "admin", "super_admin"] and len(enrollments) == 0:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Get or auto-create module discussion thread
    existing = list(db.collection("discussions").where("module_id", "==", module_id).limit(1).stream())
    if existing:
        thread_id = existing[0].id
    else:
        now = datetime.now(timezone.utc)
        _, ref = db.collection("discussions").add({
            "course_id": course_id,
            "module_id": module_id,
            "title": f"Module: {module_doc.to_dict().get('title', 'Untitled')} \u2014 Feedback & Questions",
            "content": "Ask questions or share feedback about this module.",
            "author_id": "system",
            "is_module_feedback": True,
            "is_pinned": False,
            "is_hidden": False,
            "created_at": now,
            "updated_at": now
        })
        thread_id = ref.id

    now = datetime.now(timezone.utc)
    is_instructor = user_role in ["instructor", "admin", "super_admin"]
    data = {
        "thread_id": thread_id,
        "author_id": user_id,
        "content": comment.content,
        "is_instructor": is_instructor,
        "created_at": now
    }
    _, ref = db.collection("discussion_replies").add(data)
    data["id"] = ref.id
    data["author_name"] = current_user.get("name", "Unknown")

    # Notify course instructor if student posted
    if not is_instructor:
        course_doc = db.collection("courses").document(course_id).get()
        if course_doc.exists:
            instructor_id = course_doc.to_dict().get("instructor_id")
            if instructor_id:
                db.collection("notifications").add({
                    "user_id": instructor_id,
                    "type": "module_comment",
                    "thread_id": thread_id,
                    "module_id": module_id,
                    "course_id": course_id,
                    "message": f"New question in {module_doc.to_dict().get('title', 'a module')} by {current_user.get('name', 'A student')}",
                    "is_read": False,
                    "created_at": now
                })

    return success_response(data=data, message="Comment added")
```

- [ ] **Step 4: Verify by running the backend**

```bash
cd backend
uvicorn app.main:app --reload
```

Then in another terminal:
```bash
curl -s http://localhost:8000/docs
```
Expected: Swagger UI loads with the new endpoints under "Discussions" tag.

---
### Task 2: Backend — Create `instructor_discussions.py` router

**Files:**
- Create: `backend/app/routers/instructor_discussions.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: `require_instructor`, `get_db`, `success_response`
- Produces: All endpoints that the frontend `discussionService.ts` already calls

- [ ] **Step 1: Create `instructor_discussions.py` with all endpoints**

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from google.cloud.firestore_v1.client import Client
from datetime import datetime, timezone
from typing import Optional
from ..core.dependencies import require_instructor
from ..core.firebase import get_db
from ..utils.response import success_response

router = APIRouter()

@router.get("/discussions")
def get_instructor_discussions(
    course_id: Optional[str] = Query(None),
    module_id: Optional[str] = Query(None),
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    query = db.collection("discussions").order_by("created_at", direction="DESCENDING")

    discussions = list(query.stream())
    results = []
    seen_module_ids = set()

    for d in discussions:
        dd = d.to_dict()
        dd["id"] = d.id

        # Apply filters
        if course_id and dd.get("course_id") != course_id:
            continue
        if module_id and dd.get("module_id") != module_id:
            continue

        # Hydrate course title
        course_doc = db.collection("courses").document(dd.get("course_id", "")).get()
        dd["course_title"] = course_doc.to_dict().get("title", "Unknown Course") if course_doc.exists else "Unknown Course"

        # Hydrate module title for module discussions
        if dd.get("is_module_feedback") and dd.get("module_id"):
            module_doc = db.collection("modules").document(dd["module_id"]).get()
            dd["module_title"] = module_doc.to_dict().get("title", "Unknown Module") if module_doc.exists else "Unknown Module"

        # Count replies
        replies = list(db.collection("discussion_replies").where("thread_id", "==", d.id).stream())
        dd["reply_count"] = len(replies)

        # Author info
        author_doc = db.collection("users").document(dd.get("author_id", "")).get()
        dd["author_name"] = author_doc.to_dict().get("name", "Unknown") if author_doc.exists else "Unknown"
        dd["author_photo"] = author_doc.to_dict().get("photo_url", "") if author_doc.exists else ""

        results.append(dd)

        if dd.get("module_id"):
            seen_module_ids.add(dd["module_id"])

    return success_response(data=results)


@router.get("/discussions/{thread_id}")
def get_instructor_discussion_detail(
    thread_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    thread_ref = db.collection("discussions").document(thread_id)
    thread_doc = thread_ref.get()
    if not thread_doc.exists:
        raise HTTPException(status_code=404, detail="Discussion not found")

    dd = thread_doc.to_dict()
    dd["id"] = thread_doc.id

    # Hydrate course
    course_doc = db.collection("courses").document(dd.get("course_id", "")).get()
    dd["course_title"] = course_doc.to_dict().get("title", "Unknown Course") if course_doc.exists else "Unknown Course"

    # Author
    author_doc = db.collection("users").document(dd.get("author_id", "")).get()
    dd["author_name"] = author_doc.to_dict().get("name", "Unknown") if author_doc.exists else "Unknown"
    dd["author_photo"] = author_doc.to_dict().get("photo_url", "") if author_doc.exists else ""

    # Replies
    replies = list(db.collection("discussion_replies").where("thread_id", "==", thread_id).order_by("created_at").stream())
    reply_list = []
    for r in replies:
        rd = r.to_dict()
        rd["id"] = r.id
        reply_author = db.collection("users").document(rd.get("author_id", "")).get()
        rd["author_name"] = reply_author.to_dict().get("name", "Unknown") if reply_author.exists else "Unknown"
        rd["author_photo"] = reply_author.to_dict().get("photo_url", "") if reply_author.exists else ""
        rd["author_role"] = reply_author.to_dict().get("role", "") if reply_author.exists else ""
        rd["is_instructor"] = rd.get("author_role") in ["instructor", "admin", "super_admin"]
        reply_list.append(rd)

    dd["replies"] = reply_list
    dd["reply_count"] = len(reply_list)
    return success_response(data=dd)


@router.post("/discussions/{thread_id}/reply")
def instructor_reply_to_discussion(
    thread_id: str,
    body: dict,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    thread_ref = db.collection("discussions").document(thread_id)
    thread_doc = thread_ref.get()
    if not thread_doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")

    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content is required")

    now = datetime.now(timezone.utc)
    data = {
        "thread_id": thread_id,
        "author_id": current_user["id"],
        "content": content,
        "is_instructor": True,
        "created_at": now
    }
    _, ref = db.collection("discussion_replies").add(data)
    data["id"] = ref.id

    # Notify students who have commented in this thread
    thread_data = thread_doc.to_dict()
    course_id = thread_data.get("course_id")
    commenters = set()
    existing_replies = db.collection("discussion_replies").where("thread_id", "==", thread_id).stream()
    for r in existing_replies:
        rd = r.to_dict()
        author_id = rd.get("author_id")
        if author_id and author_id != current_user["id"]:
            commenters.add(author_id)

    module_title = "a module"
    if thread_data.get("module_id"):
        mod_doc = db.collection("modules").document(thread_data["module_id"]).get()
        if mod_doc.exists:
            module_title = mod_doc.to_dict().get("title", "a module")

    for commenter_id in commenters:
        db.collection("notifications").add({
            "user_id": commenter_id,
            "type": "module_reply",
            "thread_id": thread_id,
            "module_id": thread_data.get("module_id", ""),
            "course_id": course_id or "",
            "message": f"Instructor replied in {module_title}",
            "is_read": False,
            "created_at": now
        })

    return success_response(data=data, message="Reply posted")


@router.patch("/discussions/{thread_id}/pin")
def instructor_pin_discussion(
    thread_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(thread_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    current = doc.to_dict().get("is_pinned", False)
    ref.update({"is_pinned": not current})
    return success_response(message="Pin status toggled")


@router.patch("/discussions/{thread_id}/hide")
def instructor_hide_discussion(
    thread_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(thread_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    current = doc.to_dict().get("is_hidden", False)
    ref.update({"is_hidden": not current})
    return success_response(message="Visibility toggled")


@router.patch("/discussions/{thread_id}/answered")
def instructor_toggle_answered(
    thread_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(thread_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    current = doc.to_dict().get("is_answered", False)
    ref.update({"is_answered": not current})
    return success_response(message="Answered status toggled")


@router.delete("/discussions/{thread_id}")
def instructor_delete_discussion(
    thread_id: str,
    current_user: dict = Depends(require_instructor),
    db: Client = Depends(get_db)
):
    ref = db.collection("discussions").document(thread_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Thread not found")
    replies = db.collection("discussion_replies").where("thread_id", "==", thread_id).stream()
    for r in replies:
        db.collection("discussion_replies").document(r.id).delete()
    ref.delete()
    return success_response(message="Discussion deleted")
```

- [ ] **Step 2: Register the new router in `main.py`**

Add import and registration:

```python
from .routers import auth, users, courses, enrollments, progress, quizzes, assignments, certificates, notifications, discussions, announcements, analytics, resources, categories, instructor, instructor_discussions

app.include_router(instructor_discussions.router, prefix="/api/instructor", tags=["Instructor Discussions"])
```

Add the import line in the existing import block (line 13), after `instructor`:
```python
from .routers import auth, users, courses, enrollments, progress, quizzes, assignments, certificates, notifications, discussions, announcements, analytics, resources, categories, instructor, instructor_discussions
```

Add the include line (line 53, after the instructor router registration):
```python
app.include_router(instructor_discussions.router, prefix="/api/instructor", tags=["Instructor Discussions"])
```

- [ ] **Step 3: Verify backend loads without errors**

```bash
cd backend
python -c "from app.main import app; print('OK')"
```
Expected: No import errors.

---
### Task 3: Frontend — Create `ModuleFeedback` component

**Files:**
- Create: `frontend/src/components/module/ModuleFeedback.tsx`
- Modify: `frontend/src/services/discussionService.ts`

**Interfaces:**
- Consumes: `discussionService.ts` module discussion API functions
- Produces: `<ModuleFeedback courseId moduleId />` React component

- [ ] **Step 1: Add module discussion API calls to `discussionService.ts`**

```typescript
export async function getModuleDiscussion(moduleId: string): Promise<any> {
  const res = await api.get(`/discussions/modules/${moduleId}`);
  return unwrap<any>(res);
}

export async function postModuleComment(moduleId: string, content: string): Promise<any> {
  const res = await api.post(`/discussions/modules/${moduleId}/comments`, { content });
  return unwrap<any>(res);
}
```

- [ ] **Step 2: Create `ModuleFeedback.tsx` component**

```tsx
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User } from 'lucide-react';
import { getModuleDiscussion, postModuleComment } from '../../services/discussionService';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface ModuleFeedbackProps {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
}

export default function ModuleFeedback({ courseId, moduleId, moduleTitle }: ModuleFeedbackProps) {
  const [thread, setThread] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  const loadDiscussion = async () => {
    setLoading(true);
    try {
      const data = await getModuleDiscussion(moduleId);
      setThread(data.thread);
      setReplies(data.replies || []);
    } catch {
      // Silently fail — component is non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscussion();
  }, [moduleId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const result = await postModuleComment(moduleId, newComment);
      setReplies((prev) => [...prev, result]);
      setNewComment('');
    } catch {
      // Silent fail
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <Card className="space-y-4">
        <div className="h-5 w-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-20 bg-slate-50 rounded-xl animate-pulse" />
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <MessageSquare size={16} className="text-navy-900" />
        <h3 className="text-sm font-extrabold text-navy-900">Feedback & Questions</h3>
        <span className="text-[10px] font-bold text-slate-400 ml-auto">{replies.length} comment{replies.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {replies.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">No feedback yet. Be the first to ask a question!</p>
        ) : (
          replies.map((reply: any) => {
            const isInstructor = reply.is_instructor || reply.author_role === 'instructor' || reply.author_role === 'admin';
            return (
              <div key={reply.id} className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                isInstructor ? 'bg-slate-900/5 border-slate-900/10' : 'bg-white border-slate-100'
              }`}>
                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {reply.author_photo ? (
                      <img src={reply.author_photo} alt={reply.author_name} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={10} /></div>
                    )}
                    <span className="font-extrabold text-slate-800">{reply.author_name}</span>
                    {isInstructor && (
                      <Badge variant="default" className="!bg-slate-900 text-white text-[8px] scale-90">Instructor</Badge>
                    )}
                  </div>
                  <span className="text-slate-400 font-semibold">{new Date(reply.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600 leading-relaxed pl-1 whitespace-pre-wrap">{reply.content}</p>
              </div>
            );
          })
        )}
        <div ref={listEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-100">
        <div className="relative">
          <textarea
            rows={2}
            required
            placeholder="Ask a question or share feedback..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs outline-none focus:border-slate-900 resize-none font-semibold text-slate-700"
          />
          <button
            type="submit"
            disabled={posting || !newComment.trim()}
            className="absolute bottom-3 right-3 text-slate-500 hover:text-navy-900 disabled:opacity-30 transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </Card>
  );
}
```

---
### Task 4: Frontend — Integrate `ModuleFeedback` into `CourseLearning.tsx`

**Files:**
- Modify: `frontend/src/pages/student/CourseLearning.tsx`

**Interfaces:**
- Consumes: `<ModuleFeedback courseId moduleId moduleTitle />`
- Location: Below lesson content area, before the page bottom

- [ ] **Step 1: Import ModuleFeedback at top of file**

Add to existing imports (after line 18):
```typescript
import ModuleFeedback from '../../components/module/ModuleFeedback';
```

- [ ] **Step 2: Insert ModuleFeedback below lesson content, after navigation buttons**

Find this section in the JSX (around line 345):

```tsx
                </Card>
              </>
            );
          })()}
```

Replace with:

```tsx
                </Card>

                {/* Module Feedback Section */}
                {activeItem && (
                  <ModuleFeedback
                    courseId={courseId || ''}
                    moduleId={activeItem.moduleId}
                    moduleTitle={activeItem.moduleTitle}
                  />
                )}
              </>
            );
          })()}
```

This places the feedback component after each lesson/quiz content area, inside the module context, so it's always visible when viewing a module's content.

---
### Task 5: Frontend — Connect Instructor Discussions page to real backend

**Files:**
- Modify: `frontend/src/pages/instructor/Discussions.tsx`

**Interfaces:**
- Consumes: existing `getInstructorDiscussions()`, `getInstructorDiscussionDetail()`, etc. from `discussionService.ts` (already imported)
- The page already calls these functions — now the backend exists to serve them

- [ ] **Step 1: Add module filter state and module loading**

Add import for `getCourseModules` at the top:
```typescript
import { getMyInstructorCourses, getCourseModules } from '../../services/courseService';
```

Add state variables after line 32 (`const [replyText, setReplyText] = useState('');`):

```typescript
const [modules, setModules] = useState<any[]>([]);
const [selectedModuleId, setSelectedModuleId] = useState('');
```

Add a `useEffect` to load modules when `selectedCourseId` changes:

```typescript
useEffect(() => {
  if (selectedCourseId) {
    getCourseModules(selectedCourseId)
      .then(setModules)
      .catch(() => setModules([]));
  } else {
    setModules([]);
    setSelectedModuleId('');
  }
}, [selectedCourseId]);
```

- [ ] **Step 2: Filter discussions by module_id**

Add `module_id` filter to the `filteredDiscussions` computation (around line 158):

After the existing `if (selectedCourseId && d.course_id !== selectedCourseId) return false;` line, add:

```typescript
if (selectedModuleId && d.module_id !== selectedModuleId) return false;
```

- [ ] **Step 3: Add module filter dropdown to the filter toolbar**

Inside the filter toolbar grid (around lines 210-228), add a third column after the "Filter by Course" and "Moderation Status" columns:

```tsx
<div className="space-y-1">
  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Filter by Module</label>
  <select
    value={selectedModuleId}
    onChange={(e) => setSelectedModuleId(e.target.value)}
    disabled={!selectedCourseId || modules.length === 0}
    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-slate-900 bg-slate-50/50 disabled:opacity-40"
  >
    <option value="">All modules & course discussions</option>
    {modules.map((m: any) => (
      <option key={m.id} value={m.id}>{m.title}</option>
    ))}
  </select>
</div>
```

Since the filter grid is `grid-cols-1 sm:grid-cols-3`, adding a 4th filter means changing to `grid-cols-1 sm:grid-cols-4`. Update the grid className.

Also add module title display in each discussion card (around line 294, after course title):

```tsx
{d.module_id && d.module_title && (
  <>
    <span className="text-[10px] font-extrabold text-slate-400">/</span>
    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
      <MessageSquare size={10} />
      {d.module_title}
    </span>
  </>
)}
```

And in the detail panel (around line 355, after course title):

```tsx
{selectedThread.module_id && selectedThread.module_title && (
  <>
    <span className="text-slate-400 font-black mx-1">/</span>
    <span className="text-[10px] text-slate-500 font-black uppercase flex items-center gap-1">
      <MessageSquare size={10} />
      {selectedThread.module_title}
    </span>
  </>
)}
```
