# Graph Report - MOOC_blended  (2026-09-16)

## Corpus Check
- 165 files · ~104,467 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 947 nodes · 2668 edges · 83 communities (76 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1d2ed279`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_unwrap|unwrap]]
- [[_COMMUNITY_StudentLayout.tsx|StudentLayout.tsx]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_courses.py|courses.py]]
- [[_COMMUNITY_cn|cn]]
- [[_COMMUNITY_Card.tsx|Card.tsx]]
- [[_COMMUNITY_Topbar.tsx|Topbar.tsx]]
- [[_COMMUNITY_assignmentService.ts|assignmentService.ts]]
- [[_COMMUNITY_App.tsx|App.tsx]]
- [[_COMMUNITY_useTranslation|useTranslation]]
- [[_COMMUNITY_AssignmentCard.tsx|AssignmentCard.tsx]]
- [[_COMMUNITY_adminService.ts|adminService.ts]]
- [[_COMMUNITY_success_response|success_response]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_adminService.ts|adminService.ts]]
- [[_COMMUNITY_compilerOptions|compilerOptions]]
- [[_COMMUNITY_BaseModel|BaseModel]]
- [[_COMMUNITY_Card.tsx|Card.tsx]]
- [[_COMMUNITY_Sidebar.tsx|Sidebar.tsx]]
- [[_COMMUNITY_main.py|main.py]]
- [[_COMMUNITY_Badge.tsx|Badge.tsx]]
- [[_COMMUNITY_store.ts|store.ts]]
- [[_COMMUNITY_seed_firestore.py|seed_firestore.py]]
- [[_COMMUNITY_Dashboard.tsx|Dashboard.tsx]]
- [[_COMMUNITY_dependencies.py|dependencies.py]]
- [[_COMMUNITY_CreateCourse.tsx|CreateCourse.tsx]]
- [[_COMMUNITY_Discussions.tsx|Discussions.tsx]]
- [[_COMMUNITY_Calendar.tsx|Calendar.tsx]]
- [[_COMMUNITY_Categories.tsx|Categories.tsx]]
- [[_COMMUNITY_firebase.py|firebase.py]]
- [[_COMMUNITY_CreateCourse.tsx|CreateCourse.tsx]]
- [[_COMMUNITY_verify_firebase_token|verify_firebase_token]]
- [[_COMMUNITY_CommunityZone.tsx|CommunityZone.tsx]]
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
- [[_COMMUNITY_course.py|course.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY_assessment.py|assessment.py]]
- [[_COMMUNITY_auth.py|auth.py]]
- [[_COMMUNITY_ConfirmDialog.tsx|ConfirmDialog.tsx]]
- [[_COMMUNITY_announcements.py|announcements.py]]
- [[_COMMUNITY_ResourceCard.tsx|ResourceCard.tsx]]
- [[_COMMUNITY_Categories.tsx|Categories.tsx]]
- [[_COMMUNITY_DataTable.tsx|DataTable.tsx]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Any|Any]]

## God Nodes (most connected - your core abstractions)
1. `success_response()` - 168 edges
2. `unwrap()` - 117 edges
3. `cn()` - 62 edges
4. `invalidate_cache()` - 52 edges
5. `check_course_permission()` - 44 edges
6. `Card()` - 43 edges
7. `Button()` - 42 edges
8. `Badge()` - 30 edges
9. `useAuthStore` - 27 edges
10. `useTranslation()` - 23 edges

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

## Communities (83 total, 7 thin omitted)

### Community 0 - "unwrap"
Cohesion: 0.32
Nodes (6): Resources(), TYPE_COLORS, TYPE_FILTERS, TYPE_ICONS, getCourseResources(), getResources()

### Community 1 - "StudentLayout.tsx"
Cohesion: 0.18
Nodes (14): defaultNavItems, NavItem, Sidebar(), SidebarProps, useLogout(), AdminLayout(), navItems, InstructorLayout() (+6 more)

### Community 2 - "dependencies"
Cohesion: 0.12
Nodes (60): AnnouncementCreateUpdate, AssignmentCreateUpdate, check_course_permission(), create_course_announcement_notifications(), create_course_module(), create_instructor_announcement(), create_instructor_course_assignment(), create_instructor_course_quiz() (+52 more)

### Community 3 - "courses.py"
Cohesion: 0.18
Nodes (22): invalidate_cache(), CategoryCreate, create_category(), delete_category(), get_categories(), Client, update_category(), add_wishlist() (+14 more)

### Community 4 - "cn"
Cohesion: 0.11
Nodes (33): Badge(), variants, analyticsMemoryCache, cachedCourses, cachedStudentsList, InstructorAnalytics(), InstructorCourses(), CATEGORIES (+25 more)

### Community 5 - "Card.tsx"
Cohesion: 0.19
Nodes (23): CourseBuilder(), Step, STEPS, unwrap(), checkCoursePublish(), createInstructorLesson(), createInstructorModule(), createInstructorResource() (+15 more)

### Community 6 - "Topbar.tsx"
Cohesion: 0.27
Nodes (12): create_discussion(), create_module_comment(), create_reply(), delete_discussion(), DiscussionCreate, get_all_discussions(), get_course_discussions(), get_module_discussion() (+4 more)

### Community 7 - "assignmentService.ts"
Cohesion: 0.28
Nodes (14): InstructorAssignments(), RubricCriterion, InstructorSubmissions(), createAssignment(), deleteAssignment(), getAssignment(), getAssignmentSubmissions(), getCourseAssignments() (+6 more)

### Community 8 - "App.tsx"
Cohesion: 0.13
Nodes (24): BreadcrumbItem, CourseCompletionModal(), CourseCompletionModalProps, CourseLearning(), FlatItem, getAssignmentSubmission(), getCourseAssignmentsList(), getCourseQuizzesList() (+16 more)

### Community 9 - "useTranslation"
Cohesion: 0.22
Nodes (13): Topbar(), TopbarLink, ThemeProvider(), useTheme(), PublicLayout(), PublicLayoutProps, Discussions(), PLACEHOLDER_THREADS (+5 more)

### Community 10 - "AssignmentCard.tsx"
Cohesion: 0.12
Nodes (27): admin_update_course_status(), archive_course(), create_course(), create_lesson(), create_module(), delete_course(), delete_lesson(), delete_module() (+19 more)

### Community 11 - "adminService.ts"
Cohesion: 0.19
Nodes (13): AdminSettings(), AdminUsers(), createAnnouncement(), createDiscussion(), createReply(), deleteAnnouncement(), getAllUsers(), getAnnouncements() (+5 more)

### Community 12 - "success_response"
Cohesion: 0.13
Nodes (15): footerLinks, StudentFooter(), StudentFooterProps, Accordion(), AccordionItem, AccordionProps, Bone(), LoadingSkeleton() (+7 more)

### Community 13 - "compilerOptions"
Cohesion: 0.05
Nodes (37): dependencies, autoprefixer, axios, clsx, date-fns, firebase, lucide-react, postcss (+29 more)

### Community 14 - "adminService.ts"
Cohesion: 0.12
Nodes (31): ModuleFeedback(), ModuleFeedbackProps, COLOR_PALETTES, getColorIndex(), getInitials(), SIZE_CLASSES, UserAvatar(), UserAvatarProps (+23 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 16 - "BaseModel"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 17 - "Card.tsx"
Cohesion: 0.25
Nodes (7): Card(), CardProps, AdminAnalytics(), Dashboard(), CertificateVerify, VerifyCertificate(), getAdminAnalytics()

### Community 18 - "Sidebar.tsx"
Cohesion: 0.27
Nodes (13): AssignmentCreate, create_assignment(), delete_assignment(), get_assignment(), get_assignment_submissions(), get_course_assignments(), get_my_submission(), grade_submission() (+5 more)

### Community 19 - "main.py"
Cohesion: 0.11
Nodes (27): GradeSubmissionInstructor, InstructorReplyCreate, RubricCriterion, RubricScore, StudentNoteSaveRequest, StudentReminderRequest, create_question(), create_quiz() (+19 more)

### Community 20 - "Badge.tsx"
Cohesion: 0.37
Nodes (13): _check(), EduBridge MOOC Platform — Firestore Seed Script.  Populates Firestore with rea, Return True if the document already exists (skip on re-run)., Run all seed functions in dependency order., seed_all(), seed_announcements(), seed_assignments(), seed_categories() (+5 more)

### Community 21 - "store.ts"
Cohesion: 0.24
Nodes (10): InstructorSettings(), getMe(), updateProfile(), uploadAvatar(), AuthState, AuthUser, Language, PreferencesState (+2 more)

### Community 22 - "seed_firestore.py"
Cohesion: 0.17
Nodes (18): App(), AuthBranding(), AuthBrandingProps, ProtectedRoute(), Login(), Role, Register(), Role (+10 more)

### Community 23 - "Dashboard.tsx"
Cohesion: 0.14
Nodes (22): PageHeader(), AdminCourses(), Assignments(), CATEGORY_COLORS, CircularProgress(), Dashboard(), timeAgo(), CATEGORY_COLORS (+14 more)

### Community 24 - "dependencies.py"
Cohesion: 0.29
Nodes (7): generic_exception_handler(), http_exception_handler(), Request, validation_exception_handler(), Exception, RequestValidationError, StarletteHTTPException

### Community 25 - "CreateCourse.tsx"
Cohesion: 0.21
Nodes (6): Button(), ButtonProps, EmptyState(), EmptyStateProps, features, stats

### Community 26 - "Discussions.tsx"
Cohesion: 0.08
Nodes (19): _build_cache_key(), cache_request_middleware(), CacheManager, CustomJSONEncoder, _execute_with_cache_async(), _execute_with_cache_sync(), _format_cached_response(), MemoryCache (+11 more)

### Community 27 - "Calendar.tsx"
Cohesion: 0.32
Nodes (12): InstructorAnnouncements(), StudentAnnouncements(), createInstructorAnnouncement(), deleteInstructorAnnouncement(), getInstructorAnnouncements(), getStudentAnnouncements(), markAllAnnouncementsAsRead(), markAnnouncementAsRead() (+4 more)

### Community 28 - "Categories.tsx"
Cohesion: 0.33
Nodes (10): CommentCreatePayload, create_community_post(), create_post_comment(), delete_community_post(), get_community_posts(), get_post_comments(), PostCreatePayload, Client (+2 more)

### Community 29 - "firebase.py"
Cohesion: 0.18
Nodes (16): get_all_users(), get_user_me(), Client, Request, UploadFile, RoleUpdate, StatusUpdate, update_me() (+8 more)

### Community 30 - "CreateCourse.tsx"
Cohesion: 0.25
Nodes (15): InstructorQuizzes(), Tab, TABS, createQuestion(), createQuiz(), deleteQuestion(), deleteQuiz(), getCourseQuizzes() (+7 more)

### Community 31 - "verify_firebase_token"
Cohesion: 0.08
Nodes (27): health_check(), read_root(), get_admin_analytics(), get_analytics_root(), get_course_analytics(), get_instructor_analytics(), get_instructor_dashboard_summary(), Client (+19 more)

### Community 32 - "CommunityZone.tsx"
Cohesion: 0.31
Nodes (7): CalendarCard(), CalendarCardProps, typeVariants, CertificateCard(), CertificateCardProps, formatDate(), CalendarEvent

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
Cohesion: 0.15
Nodes (14): NotificationDropdown(), NotificationDropdownProps, TopbarProps, AssignmentCard(), AssignmentCardProps, statusStyles, MOCK_ASSIGNMENTS, MOCK_COURSES (+6 more)

### Community 38 - "utils.ts"
Cohesion: 0.67
Nodes (3): Request, UploadFile, upload_material()

### Community 43 - "exportEventsToICS"
Cohesion: 0.26
Nodes (11): Calendar(), CalendarEventItem, FilterType, ViewMode, createCalendarEvent(), deleteCalendarEvent(), getCalendar(), toggleCalendarEvent() (+3 more)

### Community 55 - "TC011_Search_and_manage_a_user_account.py"
Cohesion: 0.24
Nodes (12): cache_response(), generate_certificate(), GenerateCertificatePayload, get_my_certificates(), issue_course_certificate(), Client, Helper to issue or retrieve a course completion certificate., verify_certificate() (+4 more)

### Community 56 - "TC012_Submit_a_course_assignment_response.py"
Cohesion: 0.29
Nodes (5): ConfirmDialog(), ConfirmDialogProps, Modal(), ModalProps, sizes

### Community 62 - "course.py"
Cohesion: 0.50
Nodes (4): get_current_user_token(), decode_jwt_payload(), Verify the Firebase ID token and return the decoded token.     Implements a ret, verify_firebase_token()

### Community 64 - "__init__.py"
Cohesion: 0.23
Nodes (11): CertificateData, CertificateModalProps, Certificates(), CourseDetail(), getStudentCourseAnnouncements(), Certificate, generateCertificate(), getMyCertificates() (+3 more)

### Community 65 - "assessment.py"
Cohesion: 0.48
Nodes (6): Assignment, AssignmentBase, AssignmentCreate, Quiz, QuizBase, QuizCreate

### Community 66 - "auth.py"
Cohesion: 0.28
Nodes (7): CourseCard(), CourseCardProps, CourseThumbnail(), CourseThumbnailProps, getCourseTheme(), ThemeConfig, Course

### Community 72 - "announcements.py"
Cohesion: 0.33
Nodes (10): AnnouncementCreate, create_announcement(), delete_announcement(), get_announcements(), get_student_all_announcements(), get_student_course_announcements(), get_student_unread_count(), mark_all_announcements_read() (+2 more)

### Community 73 - "ResourceCard.tsx"
Cohesion: 0.50
Nodes (4): ResourceCard(), ResourceCardProps, typeConfig, Resource

### Community 74 - "Categories.tsx"
Cohesion: 0.23
Nodes (10): AdminCategories(), CacheEntry, clientCache, EXEMPT_MUTATION_PATTERNS, rawGet, Category, createCategory(), deleteCategory() (+2 more)

### Community 75 - "DataTable.tsx"
Cohesion: 0.50
Nodes (3): Column, DataTable(), DataTableProps

## Knowledge Gaps
- **169 isolated node(s):** `Config`, `Config`, `Config`, `Config`, `Config` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `success_response()` connect `dependencies` to `courses.py`, `Topbar.tsx`, `utils.ts`, `announcements.py`, `AssignmentCard.tsx`, `Sidebar.tsx`, `main.py`, `TC011_Search_and_manage_a_user_account.py`, `Categories.tsx`, `firebase.py`, `verify_firebase_token`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `unwrap()` connect `Card.tsx` to `__init__.py`, `StudentLayout.tsx`, `unwrap`, `cn`, `assignmentService.ts`, `App.tsx`, `Categories.tsx`, `adminService.ts`, `exportEventsToICS`, `adminService.ts`, `Card.tsx`, `store.ts`, `seed_firestore.py`, `Dashboard.tsx`, `Calendar.tsx`, `CreateCourse.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `cn()` connect `success_response` to `CommunityZone.tsx`, `StudentLayout.tsx`, `auth.py`, `cn`, `mockData.ts`, `useTranslation`, `ResourceCard.tsx`, `DataTable.tsx`, `exportEventsToICS`, `adminService.ts`, `Card.tsx`, `seed_firestore.py`, `TC012_Submit_a_course_assignment_response.py`, `CreateCourse.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `Zero-dependency persistent local cache that survives server reboots/reloads.`, `Multi-tier cache combining in-memory RAM (L1) and persistent SQLite (L2), plus R`, `Ultra-lightweight ASGI middleware for setting contextvar without BaseHTTPMiddlew` to the rest of the system?**
  _180 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11967213114754098 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.11097560975609756 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12873563218390804 - nodes in this community are weakly interconnected._