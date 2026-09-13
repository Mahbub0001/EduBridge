# Graph Report - MOOC_blended  (2026-09-14)

## Corpus Check
- 159 files · ~93,601 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 899 nodes · 2448 edges · 79 communities (70 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ff5eebf0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_unwrap|unwrap]]
- [[_COMMUNITY_instructor.py|instructor.py]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_courses.py|courses.py]]
- [[_COMMUNITY_cn|cn]]
- [[_COMMUNITY_Card.tsx|Card.tsx]]
- [[_COMMUNITY_Topbar.tsx|Topbar.tsx]]
- [[_COMMUNITY_Dashboard.tsx|Dashboard.tsx]]
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_assignments.py|assignments.py]]
- [[_COMMUNITY_AssignmentCard.tsx|AssignmentCard.tsx]]
- [[_COMMUNITY_Dashboard.tsx|Dashboard.tsx]]
- [[_COMMUNITY_success_response|success_response]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_adminService.ts|adminService.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_BaseModel|BaseModel]]
- [[_COMMUNITY_assignmentService.ts|assignmentService.ts]]
- [[_COMMUNITY_Sidebar.tsx|Sidebar.tsx]]
- [[_COMMUNITY_main.py|main.py]]
- [[_COMMUNITY_Badge.tsx|Badge.tsx]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_seed_firestore.py|seed_firestore.py]]
- [[_COMMUNITY_MyCourses.tsx|MyCourses.tsx]]
- [[_COMMUNITY_dependencies.py|dependencies.py]]
- [[_COMMUNITY_CreateCourse.tsx|CreateCourse.tsx]]
- [[_COMMUNITY_Discussions.tsx|Discussions.tsx]]
- [[_COMMUNITY_Calendar.tsx|Calendar.tsx]]
- [[_COMMUNITY_Categories.tsx|Categories.tsx]]
- [[_COMMUNITY_firebase.py|firebase.py]]
- [[_COMMUNITY_CreateCourse.tsx|CreateCourse.tsx]]
- [[_COMMUNITY_verify_firebase_token|verify_firebase_token]]
- [[_COMMUNITY_get_current_user|get_current_user]]
- [[_COMMUNITY_announcements.py|announcements.py]]
- [[_COMMUNITY_categories.py|categories.py]]
- [[_COMMUNITY_resources.py|resources.py]]
- [[_COMMUNITY_enrollment.py|enrollment.py]]
- [[_COMMUNITY_mockData.ts|mockData.ts]]
- [[_COMMUNITY_utils.ts|utils.ts]]
- [[_COMMUNITY_exportEventsToICS|exportEventsToICS]]
- [[_COMMUNITY_TC011_Search_and_manage_a_user_account.py|TC011_Search_and_manage_a_user_account.py]]
- [[_COMMUNITY_TC012_Submit_a_course_assignment_response.py|TC012_Submit_a_course_assignment_response.py]]
- [[_COMMUNITY_TC013_Complete_a_course_builder_draft_and_publish_it.py|TC013_Complete_a_course_builder_draft_and_publish_it.py]]
- [[_COMMUNITY_TC014_Resume_learning_from_a_selected_lesson.py|TC014_Resume_learning_from_a_selected_lesson.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY_ConfirmDialog.tsx|ConfirmDialog.tsx]]
- [[_COMMUNITY_announcements.py|announcements.py]]
- [[_COMMUNITY_Dashboard.tsx|Dashboard.tsx]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Any|Any]]

## God Nodes (most connected - your core abstractions)
1. `success_response()` - 156 edges
2. `unwrap()` - 109 edges
3. `cn()` - 60 edges
4. `invalidate_cache()` - 44 edges
5. `check_course_permission()` - 44 edges
6. `Card()` - 42 edges
7. `Button()` - 39 edges
8. `Badge()` - 28 edges
9. `useTranslation()` - 23 edges
10. `getMyInstructorCourses()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `run_tests()` --calls--> `invalidate_cache()`  [INFERRED]
  backend/test_verify.py → backend/app/core/cache.py
- `seed_all()` --calls--> `init_firebase()`  [INFERRED]
  backend/app/scripts/seed_firestore.py → backend/app/core/firebase.py
- `read_root()` --calls--> `success_response()`  [EXTRACTED]
  backend/app/main.py → backend/app/utils/response.py
- `health_check()` --calls--> `success_response()`  [EXTRACTED]
  backend/app/main.py → backend/app/utils/response.py
- `get_analytics_root()` --calls--> `success_response()`  [EXTRACTED]
  backend/app/routers/analytics.py → backend/app/utils/response.py

## Import Cycles
- None detected.

## Communities (79 total, 9 thin omitted)

### Community 0 - "unwrap"
Cohesion: 0.28
Nodes (14): InstructorAssignments(), RubricCriterion, InstructorSubmissions(), createAssignment(), deleteAssignment(), getAssignment(), getAssignmentSubmissions(), getCourseAssignments() (+6 more)

### Community 1 - "instructor.py"
Cohesion: 0.15
Nodes (14): get_all_users(), RoleUpdate, StatusUpdate, update_me(), update_user_role(), update_user_status(), Config, Course (+6 more)

### Community 2 - "dependencies"
Cohesion: 0.09
Nodes (60): AnnouncementCreateUpdate, AssignmentCreateUpdate, check_course_permission(), create_course_announcement_notifications(), create_course_module(), create_instructor_announcement(), create_instructor_course_assignment(), create_instructor_course_quiz() (+52 more)

### Community 3 - "courses.py"
Cohesion: 0.28
Nodes (15): invalidate_cache(), add_wishlist(), CalendarEventCreate, CalendarEventUpdate, create_calendar_event(), delete_calendar_event(), enroll_course(), my_calendar() (+7 more)

### Community 4 - "cn"
Cohesion: 0.28
Nodes (7): CourseCard(), CourseCardProps, CourseThumbnail(), CourseThumbnailProps, getCourseTheme(), ThemeConfig, Course

### Community 5 - "Card.tsx"
Cohesion: 0.15
Nodes (26): CourseBuilder(), Step, STEPS, unwrap(), Certificate, generateCertificate(), verifyCertificate(), checkCoursePublish() (+18 more)

### Community 6 - "Topbar.tsx"
Cohesion: 0.27
Nodes (12): create_discussion(), create_module_comment(), create_reply(), delete_discussion(), DiscussionCreate, get_all_discussions(), get_course_discussions(), get_module_discussion() (+4 more)

### Community 7 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (22): analyticsMemoryCache, cachedCourses, InstructorAnalytics(), InstructorCourses(), Dashboard(), Skeleton(), InstructorStudents(), archiveCourse() (+14 more)

### Community 8 - "App.tsx"
Cohesion: 0.18
Nodes (20): CourseLearning(), FlatItem, getAssignmentSubmission(), getCourseAssignmentsList(), getCourseQuizzesList(), getVimeoEmbedUrl(), getYouTubeEmbedUrl(), resolveUrl() (+12 more)

### Community 9 - "assignments.py"
Cohesion: 0.40
Nodes (8): _build_cache_key(), cache_request_middleware(), CustomJSONEncoder, _execute_with_cache_async(), _execute_with_cache_sync(), _format_cached_response(), _process_and_cache_result(), Request

### Community 10 - "AssignmentCard.tsx"
Cohesion: 0.13
Nodes (31): admin_update_course_status(), archive_course(), create_course(), create_lesson(), create_module(), delete_course(), delete_lesson(), delete_module() (+23 more)

### Community 11 - "Dashboard.tsx"
Cohesion: 0.19
Nodes (10): ModuleFeedback(), ModuleFeedbackProps, Badge(), variants, CATEGORIES, CourseFormData, CreateCourse(), INITIAL (+2 more)

### Community 12 - "success_response"
Cohesion: 0.08
Nodes (30): NotificationDropdown(), footerLinks, StudentFooter(), StudentFooterProps, Accordion(), AccordionItem, AccordionProps, CalendarCard() (+22 more)

### Community 13 - "compilerOptions"
Cohesion: 0.05
Nodes (36): dependencies, autoprefixer, axios, clsx, date-fns, lucide-react, postcss, react (+28 more)

### Community 14 - "adminService.ts"
Cohesion: 0.37
Nodes (11): InstructorDiscussions(), timeAgo(), deleteDiscussionThread(), getInstructorDiscussionDetail(), getInstructorDiscussions(), getModuleDiscussion(), hideDiscussionThread(), pinDiscussionThread() (+3 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 16 - "BaseModel"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 17 - "assignmentService.ts"
Cohesion: 0.11
Nodes (20): NotificationDropdownProps, TopbarLink, TopbarProps, ResourceCard(), ResourceCardProps, typeConfig, Resources(), TYPE_COLORS (+12 more)

### Community 18 - "Sidebar.tsx"
Cohesion: 0.17
Nodes (19): AssignmentCreate, create_assignment(), delete_assignment(), get_assignment(), get_assignment_submissions(), get_course_assignments(), get_my_submission(), grade_submission() (+11 more)

### Community 19 - "main.py"
Cohesion: 0.11
Nodes (26): GradeSubmissionInstructor, InstructorReplyCreate, RubricCriterion, RubricScore, StudentNoteSaveRequest, create_question(), create_quiz(), delete_question() (+18 more)

### Community 20 - "Badge.tsx"
Cohesion: 0.37
Nodes (13): _check(), EduBridge MOOC Platform — Firestore Seed Script.  Populates Firestore with rea, Return True if the document already exists (skip on re-run)., Run all seed functions in dependency order., seed_all(), seed_announcements(), seed_assignments(), seed_categories() (+5 more)

### Community 21 - "index.ts"
Cohesion: 0.36
Nodes (7): get_admin_analytics(), get_analytics_root(), get_course_analytics(), get_instructor_analytics(), get_instructor_dashboard_summary(), Client, Comprehensive dashboard summary for instructors.

### Community 22 - "seed_firestore.py"
Cohesion: 0.06
Nodes (51): firebase, App(), AuthBranding(), AuthBrandingProps, ProtectedRoute(), Topbar(), ThemeProvider(), useTheme() (+43 more)

### Community 23 - "MyCourses.tsx"
Cohesion: 0.13
Nodes (27): PageHeader(), AdminCourses(), Assignments(), Certificates(), CATEGORY_COLORS, CircularProgress(), Dashboard(), timeAgo() (+19 more)

### Community 24 - "dependencies.py"
Cohesion: 0.10
Nodes (15): Ultra-lightweight ASGI middleware for setting contextvar without BaseHTTPMiddlew, RequestContextMiddleware, Config, Settings, generic_exception_handler(), health_check(), http_exception_handler(), Request (+7 more)

### Community 25 - "CreateCourse.tsx"
Cohesion: 0.13
Nodes (13): AssignmentCard(), AssignmentCardProps, statusStyles, Button(), ButtonProps, Card(), CardProps, EmptyState() (+5 more)

### Community 26 - "Discussions.tsx"
Cohesion: 0.12
Nodes (6): CacheManager, MemoryCache, Any, Multi-tier cache combining in-memory RAM (L1) and persistent SQLite (L2), plus R, Zero-dependency persistent local cache that survives server reboots/reloads., SQLiteCache

### Community 27 - "Calendar.tsx"
Cohesion: 0.30
Nodes (13): InstructorAnnouncements(), StudentAnnouncements(), createInstructorAnnouncement(), deleteInstructorAnnouncement(), getInstructorAnnouncements(), getStudentAnnouncements(), markAllAnnouncementsAsRead(), markAnnouncementAsRead() (+5 more)

### Community 28 - "Categories.tsx"
Cohesion: 0.43
Nodes (7): CategoryCreate, create_category(), delete_category(), get_categories(), Client, update_category(), require_admin()

### Community 29 - "firebase.py"
Cohesion: 0.18
Nodes (14): defaultNavItems, NavItem, Sidebar(), SidebarProps, useLogout(), AdminLayout(), navItems, InstructorLayout() (+6 more)

### Community 30 - "CreateCourse.tsx"
Cohesion: 0.25
Nodes (15): InstructorQuizzes(), Tab, TABS, createQuestion(), createQuiz(), deleteQuestion(), deleteQuiz(), getCourseQuizzes() (+7 more)

### Community 31 - "verify_firebase_token"
Cohesion: 0.16
Nodes (12): create_resource(), delete_resource(), get_course_resources(), get_resources(), Client, ResourceCreate, get_current_user(), get_current_user_token() (+4 more)

### Community 32 - "get_current_user"
Cohesion: 0.54
Nodes (6): AdminCategories(), Category, createCategory(), deleteCategory(), getCategories(), updateCategory()

### Community 33 - "announcements.py"
Cohesion: 0.47
Nodes (5): build_enrolled_course(), enrollment_doc_id(), find_user_enrollment(), map_enrollment_status(), Find a user's enrollment without a composite Firestore index.

### Community 34 - "categories.py"
Cohesion: 0.60
Nodes (4): Config, Enrollment, EnrollmentBase, EnrollmentCreate

### Community 35 - "resources.py"
Cohesion: 0.60
Nodes (4): Config, Progress, ProgressBase, ProgressCreate

### Community 37 - "mockData.ts"
Cohesion: 0.47
Nodes (5): cache_response(), get_course_progress(), LessonCompletePayload, mark_lesson_complete(), Client

### Community 38 - "utils.ts"
Cohesion: 0.67
Nodes (3): Request, upload_material(), UploadFile

### Community 43 - "exportEventsToICS"
Cohesion: 0.26
Nodes (11): Calendar(), CalendarEventItem, FilterType, ViewMode, createCalendarEvent(), deleteCalendarEvent(), getCalendar(), toggleCalendarEvent() (+3 more)

### Community 55 - "TC011_Search_and_manage_a_user_account.py"
Cohesion: 0.33
Nodes (7): get_notifications(), mark_all_notifications_read(), mark_notification_read(), Client, get_db(), get_firestore_db(), init_firebase()

### Community 56 - "TC012_Submit_a_course_assignment_response.py"
Cohesion: 0.22
Nodes (7): CertificateVerify, VerifyCertificate(), api, CacheEntry, clientCache, EXEMPT_MUTATION_PATTERNS, rawGet

### Community 64 - "__init__.py"
Cohesion: 0.33
Nodes (6): BreadcrumbItem, CourseDetail(), getStudentCourseAnnouncements(), enrollCourse(), getCourse(), getMyEnrollment()

### Community 72 - "announcements.py"
Cohesion: 0.33
Nodes (10): AnnouncementCreate, create_announcement(), delete_announcement(), get_announcements(), get_student_all_announcements(), get_student_course_announcements(), get_student_unread_count(), mark_all_announcements_read() (+2 more)

## Knowledge Gaps
- **160 isolated node(s):** `Config`, `Config`, `Config`, `Config`, `Config` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `success_response()` connect `AssignmentCard.tsx` to `instructor.py`, `dependencies`, `courses.py`, `mockData.ts`, `Topbar.tsx`, `utils.ts`, `announcements.py`, `Sidebar.tsx`, `main.py`, `index.ts`, `TC011_Search_and_manage_a_user_account.py`, `dependencies.py`, `Categories.tsx`, `verify_firebase_token`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `unwrap()` connect `Card.tsx` to `__init__.py`, `unwrap`, `get_current_user`, `Dashboard.tsx`, `App.tsx`, `exportEventsToICS`, `Dashboard.tsx`, `adminService.ts`, `assignmentService.ts`, `seed_firestore.py`, `MyCourses.tsx`, `TC012_Submit_a_course_assignment_response.py`, `Calendar.tsx`, `firebase.py`, `CreateCourse.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `firebase` connect `seed_firestore.py` to `compilerOptions`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `Zero-dependency persistent local cache that survives server reboots/reloads.`, `Multi-tier cache combining in-memory RAM (L1) and persistent SQLite (L2), plus R`, `Ultra-lightweight ASGI middleware for setting contextvar without BaseHTTPMiddlew` to the rest of the system?**
  _170 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09398907103825137 - nodes in this community are weakly interconnected._
- **Should `Dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `AssignmentCard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13445378151260504 - nodes in this community are weakly interconnected._