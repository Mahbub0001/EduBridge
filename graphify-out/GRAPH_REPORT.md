# Graph Report - MOOC_blended  (2026-09-14)

## Corpus Check
- 159 files · ~92,228 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 895 nodes · 2415 edges · 83 communities (72 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ed4c4cf`
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
- [[_COMMUNITY_Certificates.tsx|Certificates.tsx]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY_AssignmentCard.tsx|AssignmentCard.tsx]]
- [[_COMMUNITY_ConfirmDialog.tsx|ConfirmDialog.tsx]]
- [[_COMMUNITY_announcements.py|announcements.py]]
- [[_COMMUNITY_Dashboard.tsx|Dashboard.tsx]]
- [[_COMMUNITY_DataTable.tsx|DataTable.tsx]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Any|Any]]

## God Nodes (most connected - your core abstractions)
1. `success_response()` - 154 edges
2. `unwrap()` - 109 edges
3. `cn()` - 60 edges
4. `check_course_permission()` - 44 edges
5. `Card()` - 42 edges
6. `Button()` - 39 edges
7. `invalidate_cache()` - 33 edges
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

## Communities (83 total, 11 thin omitted)

### Community 0 - "unwrap"
Cohesion: 0.19
Nodes (19): analyticsMemoryCache, cachedCourses, InstructorAnalytics(), InstructorAssignments(), RubricCriterion, InstructorSubmissions(), createAssignment(), deleteAssignment() (+11 more)

### Community 1 - "instructor.py"
Cohesion: 0.19
Nodes (14): firebase, AuthBranding(), AuthBrandingProps, Login(), Role, Register(), Role, establishSession() (+6 more)

### Community 2 - "dependencies"
Cohesion: 0.12
Nodes (60): AnnouncementCreateUpdate, AssignmentCreateUpdate, check_course_permission(), create_course_announcement_notifications(), create_course_module(), create_instructor_announcement(), create_instructor_course_assignment(), create_instructor_course_quiz() (+52 more)

### Community 3 - "courses.py"
Cohesion: 0.18
Nodes (22): cache_response(), invalidate_cache(), CategoryCreate, create_category(), delete_category(), get_categories(), Client, update_category() (+14 more)

### Community 4 - "cn"
Cohesion: 0.28
Nodes (7): CourseCard(), CourseCardProps, CourseThumbnail(), CourseThumbnailProps, getCourseTheme(), ThemeConfig, Course

### Community 5 - "Card.tsx"
Cohesion: 0.18
Nodes (24): CourseBuilder(), Step, STEPS, unwrap(), checkCoursePublish(), createInstructorLesson(), createInstructorModule(), createInstructorResource() (+16 more)

### Community 6 - "Topbar.tsx"
Cohesion: 0.19
Nodes (12): Card(), CardProps, AdminAnalytics(), Dashboard(), Assignments(), CATEGORY_COLORS, Dashboard(), timeAgo() (+4 more)

### Community 7 - "Dashboard.tsx"
Cohesion: 0.19
Nodes (18): InstructorCourses(), Dashboard(), Skeleton(), InstructorStudents(), archiveCourse(), publishCourse(), updateCourse(), AtRiskStudent (+10 more)

### Community 8 - "App.tsx"
Cohesion: 0.16
Nodes (20): BreadcrumbItem, CourseLearning(), FlatItem, getAssignmentSubmission(), getCourseAssignmentsList(), getCourseQuizzesList(), getVimeoEmbedUrl(), getYouTubeEmbedUrl() (+12 more)

### Community 9 - "assignments.py"
Cohesion: 0.18
Nodes (15): Topbar(), TopbarLink, ThemeProvider(), useTheme(), PublicLayout(), PublicLayoutProps, NAV, Settings() (+7 more)

### Community 10 - "AssignmentCard.tsx"
Cohesion: 0.08
Nodes (37): admin_update_course_status(), archive_course(), create_course(), create_lesson(), create_module(), delete_course(), delete_lesson(), delete_module() (+29 more)

### Community 11 - "Dashboard.tsx"
Cohesion: 0.33
Nodes (6): CATEGORIES, CourseFormData, CreateCourse(), INITIAL, STEPS, createCourse()

### Community 12 - "success_response"
Cohesion: 0.10
Nodes (23): footerLinks, StudentFooter(), StudentFooterProps, Accordion(), AccordionItem, AccordionProps, ConfirmDialog(), ConfirmDialogProps (+15 more)

### Community 13 - "compilerOptions"
Cohesion: 0.05
Nodes (36): dependencies, autoprefixer, axios, clsx, date-fns, lucide-react, postcss, react (+28 more)

### Community 14 - "adminService.ts"
Cohesion: 0.25
Nodes (15): ModuleFeedback(), ModuleFeedbackProps, Badge(), variants, InstructorDiscussions(), timeAgo(), deleteDiscussionThread(), getInstructorDiscussionDetail() (+7 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 16 - "BaseModel"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 17 - "assignmentService.ts"
Cohesion: 0.20
Nodes (9): ResourceCard(), ResourceCardProps, typeConfig, MOCK_ASSIGNMENTS, MOCK_COURSES, MOCK_EVENTS, MOCK_NOTIFICATIONS, MOCK_RESOURCES (+1 more)

### Community 18 - "Sidebar.tsx"
Cohesion: 0.27
Nodes (13): AssignmentCreate, create_assignment(), delete_assignment(), get_assignment(), get_assignment_submissions(), get_course_assignments(), get_my_submission(), grade_submission() (+5 more)

### Community 19 - "main.py"
Cohesion: 0.11
Nodes (27): GradeSubmissionInstructor, InstructorReplyCreate, RubricCriterion, RubricScore, StudentNoteSaveRequest, StudentReminderRequest, create_question(), create_quiz() (+19 more)

### Community 20 - "Badge.tsx"
Cohesion: 0.37
Nodes (13): _check(), EduBridge MOOC Platform — Firestore Seed Script.  Populates Firestore with rea, Return True if the document already exists (skip on re-run)., Run all seed functions in dependency order., seed_all(), seed_announcements(), seed_assignments(), seed_categories() (+5 more)

### Community 21 - "index.ts"
Cohesion: 0.21
Nodes (11): create_discussion(), create_module_comment(), create_reply(), delete_discussion(), DiscussionCreate, get_all_discussions(), get_course_discussions(), get_module_discussion() (+3 more)

### Community 22 - "seed_firestore.py"
Cohesion: 0.09
Nodes (28): AdminCategories(), AdminSettings(), AdminUsers(), createAnnouncement(), createDiscussion(), createReply(), deleteAnnouncement(), getAllUsers() (+20 more)

### Community 23 - "MyCourses.tsx"
Cohesion: 0.22
Nodes (13): PageHeader(), AdminCourses(), CATEGORY_COLORS, MyCourses(), tabFromPath(), TabKey, TABS, addToWishlist() (+5 more)

### Community 24 - "dependencies.py"
Cohesion: 0.10
Nodes (21): cache_request_middleware(), Request, generic_exception_handler(), health_check(), http_exception_handler(), Request, read_root(), validation_exception_handler() (+13 more)

### Community 25 - "CreateCourse.tsx"
Cohesion: 0.19
Nodes (6): Button(), ButtonProps, EmptyState(), EmptyStateProps, features, stats

### Community 26 - "Discussions.tsx"
Cohesion: 0.10
Nodes (15): _build_cache_key(), CacheManager, CustomJSONEncoder, _execute_with_cache_async(), _execute_with_cache_sync(), _format_cached_response(), MemoryCache, _process_and_cache_result() (+7 more)

### Community 27 - "Calendar.tsx"
Cohesion: 0.32
Nodes (12): InstructorAnnouncements(), StudentAnnouncements(), createInstructorAnnouncement(), deleteInstructorAnnouncement(), getInstructorAnnouncements(), getStudentAnnouncements(), markAllAnnouncementsAsRead(), markAnnouncementAsRead() (+4 more)

### Community 28 - "Categories.tsx"
Cohesion: 0.17
Nodes (13): defaultNavItems, Sidebar(), SidebarProps, CircularProgress(), Discussions(), PLACEHOLDER_THREADS, Resources(), TYPE_COLORS (+5 more)

### Community 29 - "firebase.py"
Cohesion: 0.21
Nodes (12): NavItem, useLogout(), AdminLayout(), navItems, InstructorLayout(), navItems, StudentLayout(), getStudentUnreadAnnouncementCount() (+4 more)

### Community 30 - "CreateCourse.tsx"
Cohesion: 0.25
Nodes (15): InstructorQuizzes(), Tab, TABS, createQuestion(), createQuiz(), deleteQuestion(), deleteQuiz(), getCourseQuizzes() (+7 more)

### Community 31 - "verify_firebase_token"
Cohesion: 0.50
Nodes (4): get_current_user_token(), decode_jwt_payload(), Verify the Firebase ID token and return the decoded token.     Implements a ret, verify_firebase_token()

### Community 32 - "get_current_user"
Cohesion: 0.48
Nodes (6): Assignment, AssignmentBase, AssignmentCreate, Quiz, QuizBase, QuizCreate

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
Cohesion: 0.20
Nodes (11): NotificationDropdown(), NotificationDropdownProps, TopbarProps, CalendarCard(), CalendarCardProps, typeVariants, CertificateCard(), CertificateCardProps (+3 more)

### Community 38 - "utils.ts"
Cohesion: 0.67
Nodes (3): Request, upload_material(), UploadFile

### Community 43 - "exportEventsToICS"
Cohesion: 0.26
Nodes (11): Calendar(), CalendarEventItem, FilterType, ViewMode, createCalendarEvent(), deleteCalendarEvent(), getCalendar(), toggleCalendarEvent() (+3 more)

### Community 55 - "TC011_Search_and_manage_a_user_account.py"
Cohesion: 0.08
Nodes (24): get_admin_analytics(), get_analytics_root(), get_course_analytics(), get_instructor_analytics(), get_instructor_dashboard_summary(), Client, Comprehensive dashboard summary for instructors., require_admin() (+16 more)

### Community 56 - "TC012_Submit_a_course_assignment_response.py"
Cohesion: 0.31
Nodes (6): App(), ProtectedRoute(), InstructorHelpCenter(), CertificateVerify, VerifyCertificate(), useAuthStore

### Community 62 - "Certificates.tsx"
Cohesion: 0.43
Nodes (5): Certificates(), Certificate, generateCertificate(), getMyCertificates(), verifyCertificate()

### Community 64 - "__init__.py"
Cohesion: 0.60
Nodes (5): CourseDetail(), getStudentCourseAnnouncements(), enrollCourse(), getCourse(), getMyEnrollment()

### Community 65 - "AssignmentCard.tsx"
Cohesion: 0.50
Nodes (4): AssignmentCard(), AssignmentCardProps, statusStyles, Assignment

### Community 72 - "announcements.py"
Cohesion: 0.33
Nodes (10): AnnouncementCreate, create_announcement(), delete_announcement(), get_announcements(), get_student_all_announcements(), get_student_course_announcements(), get_student_unread_count(), mark_all_announcements_read() (+2 more)

## Knowledge Gaps
- **160 isolated node(s):** `Config`, `Config`, `Config`, `Config`, `Config` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `success_response()` connect `dependencies` to `courses.py`, `utils.ts`, `announcements.py`, `AssignmentCard.tsx`, `Sidebar.tsx`, `main.py`, `index.ts`, `TC011_Search_and_manage_a_user_account.py`, `dependencies.py`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `unwrap()` connect `Card.tsx` to `__init__.py`, `unwrap`, `instructor.py`, `Topbar.tsx`, `Dashboard.tsx`, `App.tsx`, `assignments.py`, `exportEventsToICS`, `Dashboard.tsx`, `adminService.ts`, `CreateCourse.tsx`, `seed_firestore.py`, `MyCourses.tsx`, `TC012_Submit_a_course_assignment_response.py`, `Calendar.tsx`, `Categories.tsx`, `firebase.py`, `Certificates.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `firebase` connect `instructor.py` to `compilerOptions`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `Zero-dependency persistent local cache that survives server reboots/reloads.`, `Multi-tier cache combining in-memory RAM (L1) and persistent SQLite (L2), plus R`, `Config` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11967213114754098 - nodes in this community are weakly interconnected._
- **Should `AssignmentCard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08246225319396051 - nodes in this community are weakly interconnected._
- **Should `success_response` be split into smaller, more focused modules?**
  _Cohesion score 0.09879032258064516 - nodes in this community are weakly interconnected._