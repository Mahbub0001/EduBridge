# Module-Level Feedback & Discussions

## Overview

Add a feedback/comment section to every course module where students can post questions and feedback, and instructors can reply. The feature extends the existing course-level discussions system by scoping discussions to modules.

## Data Model

### Extended `discussions` collection

Existing schema extended with:

| Field | Type | Description |
|-------|------|-------------|
| `module_id` | `string?` | Firestore doc ID of the module (null for course-level threads) |
| `is_module_feedback` | `boolean` | `true` for auto-created module threads, `false` for user-created course threads |

Each module gets **exactly one** discussion doc, auto-created on first access:

```json
{
  "course_id": "<course_id>",
  "module_id": "<module_id>",
  "title": "Module {title} — Feedback & Questions",
  "content": "Ask questions or share feedback about this module.",
  "author_id": "system",
  "is_module_feedback": true,
  "is_pinned": false,
  "is_hidden": false,
  "created_at": "<timestamp>",
  "updated_at": "<timestamp>"
}
```

### `discussion_replies` collection (unchanged)

Reused as-is for all comments:
- `thread_id` — references the module's discussion doc ID
- `author_id` — user who posted
- `content` — text content
- `created_at` — timestamp
- `is_instructor` — `true` if author is instructor/admin/super_admin

### `notifications` collection

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | `string` | Recipient user ID |
| `type` | `string` | `"module_reply"` or `"module_comment"` |
| `thread_id` | `string` | Discussion thread ID |
| `module_id` | `string` | Module ID |
| `course_id` | `string` | Course ID |
| `message` | `string` | Human-readable summary |
| `is_read` | `boolean` | Read status |
| `created_at` | `timestamp` | When notification was created |

## Backend API

### New `instructor_discussions.py` router (`/api/instructor/discussions`)

Connects the existing Instructor Discussions frontend to real backend endpoints:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/instructor/discussions` | instructor+ | List all discussions across courses, with `course_id` and `module_id` query filters. Hydrates `course_title` and `module_title`. Returns course-level + module-level threads. |
| `GET` | `/instructor/discussions/{id}` | instructor+ | Thread detail with all replies, author info |
| `POST` | `/instructor/discussions/{id}/reply` | instructor+ | Post reply as instructor |
| `PATCH` | `/instructor/discussions/{id}/pin` | instructor+ | Toggle pin status (already exists in generic router — move or mirror) |
| `PATCH` | `/instructor/discussions/{id}/hide` | instructor+ | Toggle hide status |
| `PATCH` | `/instructor/discussions/{id}/answered` | instructor+ | Mark thread as answered |
| `DELETE` | `/instructor/discussions/{id}` | instructor+ | Delete thread + all replies |

### Extended `discussions.py` router

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/discussions/courses/{course_id}` | any auth | Updated: filters OUT `is_module_feedback` threads (keeps course-level discussions clean) |
| `GET` | `/discussions/modules/{module_id}` | any auth | Auto-create module discussion if absent, return it with replies |
| `POST` | `/discussions/modules/{module_id}/comments` | any auth | Post a comment on a module. Creates reply under module's discussion thread. Creates notifications for course instructors. |

### Notification triggers

- **Student posts comment** → Notify course instructor (from `course.instructor_id`) with type `"module_comment"`
- **Instructor replies** → Notify all students who have posted a reply in that discussion thread with type `"module_reply"`
- Reply creation stores `is_instructor: true` on the reply doc when author role is instructor/admin/super_admin (frontend expects this field)

## Student Frontend

### `ModuleFeedback` component

Added to the bottom of each module's content area in `CourseLearning.tsx`, positioned between lesson content and the previous/next navigation buttons.

**Layout:**
- Section heading: "Feedback & Questions" with icon
- Comment list: chronological scrollable list (newest at bottom)
  - Each comment shows: avatar, author name, timestamp, content
  - Instructor comments marked with "Instructor" badge (gray background)
- Comment input: text area + submit button at bottom
- Empty state: "No feedback yet. Be the first to ask a question!"
- Loading state: skeleton placeholders

**Data flow:**
- On module load: `GET /discussions/modules/{module_id}` → auto-creates thread, returns it with replies
- On comment submit: `POST /discussions/modules/{module_id}/comments` → optimistically adds comment to list
- Polling or manual refresh for new comments

## Instructor Frontend

### Enhanced `InstructorDiscussions.tsx`

The existing page (which has a fully built UI but calls non-existent endpoints) is connected to the new `instructor_discussions.py` backend.

**Changes:**
- Module filter dropdown appears when a course is selected
- Module-level threads show as "Module: {title} — Feedback & Questions" with module badge
- Course-level threads remain as-is
- All existing features (pin, hide, answered, delete) work via new endpoint
- Reply drawer is already built and functional

## Firestore Indexes

No new composite indexes needed. Existing queries use `course_id` + `created_at` which are already indexed.

## Permission Model

| Action | Allowed Roles |
|--------|---------------|
| View module discussion | Enrolled students, course instructors/admins |
| Post comment | Enrolled students, course instructors/admins |
| Reply as instructor | Instructor, admin, super_admin |
| Pin/hide/delete/answered | Instructor, admin, super_admin |

## Scope & Edge Cases

- **Module deletion**: When a module is deleted (via instructor router), cascade delete its discussion thread and replies
- **Course deletion**: When a course is deleted, cascade delete all module discussions
- **Empty module (no lessons)**: Module feedback still works — students can ask questions before content exists
- **New module added**: Module feedback discussion is auto-created on first access (lazy creation), not on module creation
- **Unenrolled students**: Cannot access module discussions (protected by existing enrollment checks)
