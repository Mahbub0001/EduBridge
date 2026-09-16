# Graph Report - MOOC_blended  (2026-09-16)

## Corpus Check
- 168 files · ~119,112 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 984 nodes · 2858 edges · 77 communities (69 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `012bd95d`
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
- [[_COMMUNITY_CourseCard.tsx|CourseCard.tsx]]
- [[_COMMUNITY_announcements.py|announcements.py]]
- [[_COMMUNITY_categories.py|categories.py]]
- [[_COMMUNITY_resources.py|resources.py]]
- [[_COMMUNITY_enrollment.py|enrollment.py]]
- [[_COMMUNITY_mockData.ts|mockData.ts]]
- [[_COMMUNITY_utils.ts|utils.ts]]
- [[_COMMUNITY_TC011_Search_and_manage_a_user_account.py|TC011_Search_and_manage_a_user_account.py]]
- [[_COMMUNITY_TC013_Complete_a_course_builder_draft_and_publish_it.py|TC013_Complete_a_course_builder_draft_and_publish_it.py]]
- [[_COMMUNITY_TC014_Resume_learning_from_a_selected_lesson.py|TC014_Resume_learning_from_a_selected_lesson.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY_course.py|course.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY_assessment.py|assessment.py]]
- [[_COMMUNITY_ConfirmDialog.tsx|ConfirmDialog.tsx]]
- [[_COMMUNITY_announcements.py|announcements.py]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Any|Any]]

## God Nodes (most connected - your core abstractions)
1. `success_response()` - 184 edges
2. `unwrap()` - 123 edges
3. `invalidate_cache()` - 66 edges
4. `cn()` - 62 edges
5. `Button()` - 46 edges
6. `Card()` - 45 edges
7. `check_course_permission()` - 44 edges
8. `Badge()` - 33 edges
9. `useAuthStore` - 29 edges
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

## Communities (77 total, 8 thin omitted)

### Community 0 - "unwrap"
Cohesion: 0.12
Nodes (28): AdminEnrollmentUpdate, AdminManualEnrollment, AdminPasswordReset, AdminUserCreate, create_admin_enrollment(), create_admin_user(), delete_admin_course(), delete_admin_enrollment() (+20 more)

### Community 1 - "StudentLayout.tsx"
Cohesion: 0.06
Nodes (59): App(), AuthBranding(), AuthBrandingProps, ProtectedRoute(), NotificationDropdownProps, defaultNavItems, NavItem, Sidebar() (+51 more)

### Community 2 - "dependencies"
Cohesion: 0.11
Nodes (64): AnnouncementCreateUpdate, AssignmentCreateUpdate, check_course_permission(), create_course_announcement_notifications(), create_course_module(), create_instructor_announcement(), create_instructor_course_assignment(), create_instructor_course_quiz() (+56 more)

### Community 3 - "courses.py"
Cohesion: 0.25
Nodes (14): add_wishlist(), CalendarEventCreate, CalendarEventUpdate, create_calendar_event(), delete_calendar_event(), enroll_course(), my_calendar(), my_courses() (+6 more)

### Community 4 - "cn"
Cohesion: 0.29
Nodes (7): CATEGORIES, CourseFormData, CreateCourse(), DEFAULT_COURSE_LOGOS, INITIAL, STEPS, createCourse()

### Community 5 - "Card.tsx"
Cohesion: 0.05
Nodes (88): AdminCategories(), InstructorAssignments(), RubricCriterion, CourseBuilder(), Step, STEPS, InstructorQuizzes(), Tab (+80 more)

### Community 6 - "Topbar.tsx"
Cohesion: 0.27
Nodes (12): create_discussion(), create_module_comment(), create_reply(), delete_discussion(), DiscussionCreate, get_all_discussions(), get_course_discussions(), get_module_discussion() (+4 more)

### Community 7 - "assignmentService.ts"
Cohesion: 0.18
Nodes (10): CertificateVerify, VerifyCertificate(), api, CacheEntry, clientCache, EXEMPT_MUTATION_PATTERNS, rawGet, CourseProgress (+2 more)

### Community 8 - "App.tsx"
Cohesion: 0.17
Nodes (21): CourseCompletionModal(), CourseCompletionModalProps, CourseLearning(), FlatItem, getAssignmentSubmission(), getCourseAssignmentsList(), getCourseQuizzesList(), getVimeoEmbedUrl() (+13 more)

### Community 9 - "useTranslation"
Cohesion: 0.20
Nodes (12): ModuleFeedbackProps, Badge(), variants, COLOR_PALETTES, getColorIndex(), getInitials(), SIZE_CLASSES, UserAvatar() (+4 more)

### Community 10 - "AssignmentCard.tsx"
Cohesion: 0.15
Nodes (27): invalidate_cache(), admin_update_course_status(), archive_course(), create_course(), create_lesson(), create_module(), delete_course(), delete_lesson() (+19 more)

### Community 11 - "adminService.ts"
Cohesion: 0.16
Nodes (24): AdminEnrollments(), AdminSettings(), SettingsTab, AdminUsers(), createAdminEnrollment(), createAdminUser(), createAnnouncement(), deleteAdminEnrollment() (+16 more)

### Community 12 - "success_response"
Cohesion: 0.09
Nodes (22): footerLinks, StudentFooter(), StudentFooterProps, Accordion(), AccordionItem, AccordionProps, ConfirmDialog(), Column (+14 more)

### Community 13 - "compilerOptions"
Cohesion: 0.05
Nodes (37): dependencies, autoprefixer, axios, clsx, date-fns, firebase, lucide-react, postcss (+29 more)

### Community 14 - "adminService.ts"
Cohesion: 0.16
Nodes (22): analyticsMemoryCache, cachedCourses, cachedStudentsList, InstructorAnalytics(), InstructorCourses(), Dashboard(), Skeleton(), InstructorStudents() (+14 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 16 - "BaseModel"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 17 - "Card.tsx"
Cohesion: 0.18
Nodes (13): PageHeader(), Button(), ButtonProps, Card(), CardProps, ConfirmDialogProps, EmptyState(), EmptyStateProps (+5 more)

### Community 18 - "Sidebar.tsx"
Cohesion: 0.27
Nodes (13): AssignmentCreate, create_assignment(), delete_assignment(), get_assignment(), get_assignment_submissions(), get_course_assignments(), get_my_submission(), grade_submission() (+5 more)

### Community 19 - "main.py"
Cohesion: 0.23
Nodes (16): create_question(), create_quiz(), delete_question(), delete_quiz(), get_course_quizzes(), get_my_attempts(), get_quiz(), get_quiz_questions() (+8 more)

### Community 20 - "Badge.tsx"
Cohesion: 0.37
Nodes (13): _check(), EduBridge MOOC Platform — Firestore Seed Script.  Populates Firestore with rea, Return True if the document already exists (skip on re-run)., Run all seed functions in dependency order., seed_all(), seed_announcements(), seed_assignments(), seed_categories() (+5 more)

### Community 21 - "store.ts"
Cohesion: 0.30
Nodes (13): ModuleFeedback(), InstructorDiscussions(), timeAgo(), deleteDiscussionThread(), getInstructorDiscussionDetail(), getInstructorDiscussions(), getModuleDiscussion(), hideDiscussionThread() (+5 more)

### Community 22 - "seed_firestore.py"
Cohesion: 0.36
Nodes (11): CommunityZone(), TOPICS, CommunityComment, CommunityPost, createCommunityPost(), createPostComment(), deleteCommunityPost(), getCommunityPosts() (+3 more)

### Community 23 - "Dashboard.tsx"
Cohesion: 0.40
Nodes (5): Resources(), TYPE_COLORS, TYPE_FILTERS, TYPE_ICONS, getResources()

### Community 24 - "dependencies.py"
Cohesion: 0.11
Nodes (16): Ultra-lightweight ASGI middleware for setting contextvar without BaseHTTPMiddlew, RequestContextMiddleware, generic_exception_handler(), health_check(), http_exception_handler(), Request, read_root(), validation_exception_handler() (+8 more)

### Community 25 - "CreateCourse.tsx"
Cohesion: 0.50
Nodes (4): AdminAnalytics(), AdminDashboard(), getAdminDashboardStats(), getAdminDetailedAnalytics()

### Community 26 - "Discussions.tsx"
Cohesion: 0.09
Nodes (17): _build_cache_key(), cache_request_middleware(), CacheManager, CustomJSONEncoder, _execute_with_cache_async(), _execute_with_cache_sync(), _format_cached_response(), MemoryCache (+9 more)

### Community 27 - "Calendar.tsx"
Cohesion: 0.32
Nodes (12): InstructorAnnouncements(), StudentAnnouncements(), createInstructorAnnouncement(), deleteInstructorAnnouncement(), getInstructorAnnouncements(), getStudentAnnouncements(), markAllAnnouncementsAsRead(), markAnnouncementAsRead() (+4 more)

### Community 28 - "Categories.tsx"
Cohesion: 0.33
Nodes (10): CommentCreatePayload, create_community_post(), create_post_comment(), delete_community_post(), get_community_posts(), get_post_comments(), PostCreatePayload, Client (+2 more)

### Community 29 - "firebase.py"
Cohesion: 0.18
Nodes (16): get_all_users(), get_user_me(), Client, Request, UploadFile, RoleUpdate, StatusUpdate, update_me() (+8 more)

### Community 31 - "verify_firebase_token"
Cohesion: 0.08
Nodes (33): cache_response(), get_admin_analytics(), get_analytics_root(), get_course_analytics(), get_instructor_analytics(), get_instructor_dashboard_summary(), Client, Comprehensive dashboard summary for instructors. (+25 more)

### Community 32 - "CourseCard.tsx"
Cohesion: 0.28
Nodes (7): CourseCard(), CourseCardProps, CourseThumbnail(), CourseThumbnailProps, getCourseTheme(), ThemeConfig, Course

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
Cohesion: 0.11
Nodes (22): NotificationDropdown(), AssignmentCard(), AssignmentCardProps, statusStyles, CalendarCard(), CalendarCardProps, typeVariants, CertificateCard() (+14 more)

### Community 38 - "utils.ts"
Cohesion: 0.67
Nodes (3): Request, UploadFile, upload_material()

### Community 55 - "TC011_Search_and_manage_a_user_account.py"
Cohesion: 0.43
Nodes (7): CategoryCreate, create_category(), delete_category(), get_categories(), Client, update_category(), require_admin()

### Community 62 - "course.py"
Cohesion: 0.50
Nodes (4): get_current_user_token(), decode_jwt_payload(), Verify the Firebase ID token and return the decoded token.     Implements a ret, verify_firebase_token()

### Community 64 - "__init__.py"
Cohesion: 0.21
Nodes (11): CertificateData, CertificateModalProps, Certificates(), CourseDetail(), getStudentCourseAnnouncements(), Certificate, generateCertificate(), getMyCertificates() (+3 more)

### Community 65 - "assessment.py"
Cohesion: 0.48
Nodes (6): Assignment, AssignmentBase, AssignmentCreate, Quiz, QuizBase, QuizCreate

### Community 72 - "announcements.py"
Cohesion: 0.33
Nodes (10): AnnouncementCreate, create_announcement(), delete_announcement(), get_announcements(), get_student_all_announcements(), get_student_course_announcements(), get_student_unread_count(), mark_all_announcements_read() (+2 more)

## Knowledge Gaps
- **170 isolated node(s):** `Config`, `Config`, `Config`, `Config`, `Config` (+165 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `success_response()` connect `dependencies` to `unwrap`, `courses.py`, `Topbar.tsx`, `utils.ts`, `announcements.py`, `AssignmentCard.tsx`, `Sidebar.tsx`, `main.py`, `TC011_Search_and_manage_a_user_account.py`, `dependencies.py`, `Categories.tsx`, `firebase.py`, `verify_firebase_token`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `unwrap()` connect `Card.tsx` to `__init__.py`, `StudentLayout.tsx`, `cn`, `assignmentService.ts`, `App.tsx`, `useTranslation`, `adminService.ts`, `adminService.ts`, `store.ts`, `seed_firestore.py`, `Dashboard.tsx`, `CreateCourse.tsx`, `Calendar.tsx`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `cn()` connect `success_response` to `CourseCard.tsx`, `StudentLayout.tsx`, `cn`, `mockData.ts`, `Card.tsx`, `useTranslation`, `Card.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `Zero-dependency persistent local cache that survives server reboots/reloads.`, `Multi-tier cache combining in-memory RAM (L1) and persistent SQLite (L2), plus R`, `Ultra-lightweight ASGI middleware for setting contextvar without BaseHTTPMiddlew` to the rest of the system?**
  _181 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `unwrap` be split into smaller, more focused modules?**
  _Cohesion score 0.11612903225806452 - nodes in this community are weakly interconnected._
- **Should `StudentLayout.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.056669339748730285 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.10913461538461539 - nodes in this community are weakly interconnected._