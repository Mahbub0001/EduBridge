# Graph Report - .  (2026-07-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 811 nodes · 2247 edges · 72 communities (71 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1fb94df7`
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
- [[_COMMUNITY_discussions.py|discussions.py]]
- [[_COMMUNITY_dependencies.py|dependencies.py]]
- [[_COMMUNITY_users.py|users.py]]
- [[_COMMUNITY_MyCourses.tsx|MyCourses.tsx]]
- [[_COMMUNITY_enrollments.py|enrollments.py]]
- [[_COMMUNITY_store.ts|store.ts]]
- [[_COMMUNITY_firebase.py|firebase.py]]
- [[_COMMUNITY_analytics.py|analytics.py]]
- [[_COMMUNITY_Categories.tsx|Categories.tsx]]
- [[_COMMUNITY_get_current_user|get_current_user]]
- [[_COMMUNITY_announcements.py|announcements.py]]
- [[_COMMUNITY_categories.py|categories.py]]
- [[_COMMUNITY_resources.py|resources.py]]
- [[_COMMUNITY_enrollment.py|enrollment.py]]
- [[_COMMUNITY_Analytics.tsx|Analytics.tsx]]
- [[_COMMUNITY_CreateCourse.tsx|CreateCourse.tsx]]
- [[_COMMUNITY_response.py|response.py]]
- [[_COMMUNITY_certificates.py|certificates.py]]
- [[_COMMUNITY_enrollment.py|enrollment.py]]
- [[_COMMUNITY_progress.py|progress.py]]
- [[_COMMUNITY_upload_material|upload_material]]
- [[_COMMUNITY_tsconfig.json|tsconfig.json]]

## God Nodes (most connected - your core abstractions)
1. `success_response()` - 151 edges
2. `unwrap()` - 102 edges
3. `cn()` - 56 edges
4. `check_course_permission()` - 44 edges
5. `Card()` - 41 edges
6. `Button()` - 37 edges
7. `Badge()` - 26 edges
8. `getMyInstructorCourses()` - 20 edges
9. `useAuthStore` - 19 edges
10. `useTranslation()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `seed_all()` --calls--> `init_firebase()`  [INFERRED]
  backend/app/scripts/seed_firestore.py → backend/app/core/firebase.py
- `read_root()` --calls--> `success_response()`  [EXTRACTED]
  backend/app/main.py → backend/app/utils/response.py
- `health_check()` --calls--> `success_response()`  [EXTRACTED]
  backend/app/main.py → backend/app/utils/response.py
- `get_analytics_root()` --calls--> `success_response()`  [EXTRACTED]
  backend/app/routers/analytics.py → backend/app/utils/response.py
- `get_me()` --calls--> `success_response()`  [EXTRACTED]
  backend/app/routers/auth.py → backend/app/utils/response.py

## Import Cycles
- None detected.

## Communities (72 total, 1 thin omitted)

### Community 0 - "unwrap"
Cohesion: 0.06
Nodes (86): BreadcrumbItem, ModuleFeedback(), ModuleFeedbackProps, InstructorAnnouncements(), CourseBuilder(), Step, STEPS, InstructorDiscussions() (+78 more)

### Community 1 - "instructor.py"
Cohesion: 0.10
Nodes (54): AnnouncementCreateUpdate, AssignmentCreateUpdate, check_course_permission(), create_course_announcement_notifications(), create_course_module(), create_instructor_announcement(), create_instructor_course_assignment(), create_instructor_course_quiz() (+46 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (37): dependencies, autoprefixer, axios, clsx, date-fns, firebase, lucide-react, postcss (+29 more)

### Community 3 - "courses.py"
Cohesion: 0.12
Nodes (30): admin_update_course_status(), archive_course(), create_course(), create_lesson(), create_module(), delete_course(), delete_lesson(), delete_module() (+22 more)

### Community 4 - "cn"
Cohesion: 0.10
Nodes (22): footerLinks, StudentFooter(), StudentFooterProps, Accordion(), AccordionItem, AccordionProps, ConfirmDialog(), ConfirmDialogProps (+14 more)

### Community 5 - "Card.tsx"
Cohesion: 0.12
Nodes (13): Button(), ButtonProps, Card(), CardProps, EmptyState(), EmptyStateProps, InstructorAnalytics(), InstructorHelpCenter() (+5 more)

### Community 6 - "Topbar.tsx"
Cohesion: 0.20
Nodes (16): Topbar(), TopbarLink, ThemeProvider(), useTheme(), PublicLayout(), PublicLayoutProps, Register(), Calendar() (+8 more)

### Community 7 - "Dashboard.tsx"
Cohesion: 0.19
Nodes (18): InstructorCourses(), Dashboard(), Skeleton(), InstructorStudents(), archiveCourse(), publishCourse(), updateCourse(), AtRiskStudent (+10 more)

### Community 8 - "App.tsx"
Cohesion: 0.20
Nodes (14): App(), AuthBranding(), AuthBrandingProps, Login(), Role, Role, establishSession(), mockLogin() (+6 more)

### Community 9 - "assignments.py"
Cohesion: 0.18
Nodes (19): AssignmentCreate, create_assignment(), delete_assignment(), get_assignment(), get_assignment_submissions(), get_course_assignments(), get_my_submission(), grade_submission() (+11 more)

### Community 10 - "AssignmentCard.tsx"
Cohesion: 0.12
Nodes (17): NotificationDropdown(), NotificationDropdownProps, TopbarProps, AssignmentCard(), AssignmentCardProps, statusStyles, CalendarCard(), CertificateCard() (+9 more)

### Community 11 - "Dashboard.tsx"
Cohesion: 0.18
Nodes (14): PageHeader(), Assignments(), Certificates(), CATEGORY_COLORS, CircularProgress(), Dashboard(), timeAgo(), PLACEHOLDER_THREADS (+6 more)

### Community 12 - "success_response"
Cohesion: 0.26
Nodes (18): Any, create_question(), create_quiz(), delete_question(), delete_quiz(), get_course_quizzes(), get_my_attempts(), get_quiz() (+10 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "adminService.ts"
Cohesion: 0.19
Nodes (13): AdminSettings(), AdminUsers(), createAnnouncement(), createDiscussion(), createReply(), deleteAnnouncement(), getAllUsers(), getAnnouncements() (+5 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 16 - "BaseModel"
Cohesion: 0.12
Nodes (15): grade_instructor_submission(), GradeSubmissionInstructor, InstructorReplyCreate, reply_to_discussion_as_instructor(), RubricCriterion, RubricScore, save_student_private_notes(), send_student_reminder() (+7 more)

### Community 17 - "assignmentService.ts"
Cohesion: 0.28
Nodes (14): InstructorAssignments(), RubricCriterion, InstructorSubmissions(), createAssignment(), deleteAssignment(), getAssignment(), getAssignmentSubmissions(), getCourseAssignments() (+6 more)

### Community 18 - "Sidebar.tsx"
Cohesion: 0.19
Nodes (11): defaultNavItems, NavItem, Sidebar(), SidebarProps, useLogout(), AdminLayout(), navItems, InstructorLayout() (+3 more)

### Community 19 - "main.py"
Cohesion: 0.15
Nodes (12): Config, Settings, generic_exception_handler(), health_check(), http_exception_handler(), Request, read_root(), validation_exception_handler() (+4 more)

### Community 20 - "Badge.tsx"
Cohesion: 0.21
Nodes (11): Badge(), variants, CalendarCardProps, typeVariants, CourseCard(), CourseCardProps, AdminCourses(), adminUpdateCourseStatus() (+3 more)

### Community 21 - "index.ts"
Cohesion: 0.20
Nodes (11): ResourceCard(), ResourceCardProps, typeConfig, Resources(), TYPE_COLORS, TYPE_FILTERS, TYPE_ICONS, getCourseResources() (+3 more)

### Community 22 - "seed_firestore.py"
Cohesion: 0.37
Nodes (13): _check(), EduBridge MOOC Platform — Firestore Seed Script.  Populates Firestore with rea, Return True if the document already exists (skip on re-run)., Run all seed functions in dependency order., seed_all(), seed_announcements(), seed_assignments(), seed_categories() (+5 more)

### Community 23 - "discussions.py"
Cohesion: 0.27
Nodes (12): create_discussion(), create_module_comment(), create_reply(), delete_discussion(), DiscussionCreate, get_all_discussions(), get_course_discussions(), get_module_discussion() (+4 more)

### Community 24 - "dependencies.py"
Cohesion: 0.21
Nodes (7): get_current_user_token(), HTTPAuthorizationCredentials, require_instructor(), decode_jwt_payload(), HTTPAuthorizationCredentials, Verify the Firebase ID token and return the decoded token.     Implements a ret, verify_firebase_token()

### Community 25 - "users.py"
Cohesion: 0.33
Nodes (9): require_admin(), get_all_users(), Client, RoleUpdate, StatusUpdate, update_me(), update_user_role(), update_user_status() (+1 more)

### Community 26 - "MyCourses.tsx"
Cohesion: 0.31
Nodes (9): CATEGORY_COLORS, MyCourses(), tabFromPath(), TabKey, TABS, addToWishlist(), enrollCourse(), getMyWishlist() (+1 more)

### Community 27 - "enrollments.py"
Cohesion: 0.39
Nodes (8): add_wishlist(), enroll_course(), my_calendar(), my_courses(), my_enrollment(), my_wishlist(), Client, remove_wishlist()

### Community 28 - "store.ts"
Cohesion: 0.22
Nodes (7): ProtectedRoute(), AuthState, AuthUser, Language, PreferencesState, Theme, User

### Community 29 - "firebase.py"
Cohesion: 0.39
Nodes (6): get_db(), get_firestore_db(), init_firebase(), get_notifications(), mark_notification_read(), Client

### Community 30 - "analytics.py"
Cohesion: 0.36
Nodes (7): get_admin_analytics(), get_analytics_root(), get_course_analytics(), get_instructor_analytics(), get_instructor_dashboard_summary(), Client, Comprehensive dashboard summary for instructors.

### Community 31 - "Categories.tsx"
Cohesion: 0.54
Nodes (6): AdminCategories(), Category, createCategory(), deleteCategory(), getCategories(), updateCategory()

### Community 32 - "get_current_user"
Cohesion: 0.38
Nodes (6): get_current_user(), Client, get_course_progress(), LessonCompletePayload, mark_lesson_complete(), Client

### Community 33 - "announcements.py"
Cohesion: 0.48
Nodes (6): AnnouncementCreate, create_announcement(), delete_announcement(), get_announcements(), get_student_course_announcements(), Client

### Community 34 - "categories.py"
Cohesion: 0.52
Nodes (6): CategoryCreate, create_category(), delete_category(), get_categories(), Client, update_category()

### Community 35 - "resources.py"
Cohesion: 0.48
Nodes (6): create_resource(), delete_resource(), get_course_resources(), get_resources(), Client, ResourceCreate

### Community 36 - "enrollment.py"
Cohesion: 0.38
Nodes (6): build_enrolled_course(), enrollment_doc_id(), find_user_enrollment(), map_enrollment_status(), Client, Find a user's enrollment without a composite Firestore index.

### Community 37 - "Analytics.tsx"
Cohesion: 0.52
Nodes (4): StatCard(), AdminAnalytics(), Dashboard(), getAdminAnalytics()

### Community 38 - "CreateCourse.tsx"
Cohesion: 0.33
Nodes (6): CATEGORIES, CourseFormData, CreateCourse(), INITIAL, STEPS, createCourse()

### Community 39 - "response.py"
Cohesion: 0.40
Nodes (4): get_me(), login_session(), Client, error_response()

### Community 40 - "certificates.py"
Cohesion: 0.53
Nodes (5): generate_certificate(), GenerateCertificatePayload, get_my_certificates(), Client, verify_certificate()

### Community 41 - "enrollment.py"
Cohesion: 0.60
Nodes (4): Config, Enrollment, EnrollmentBase, EnrollmentCreate

### Community 42 - "progress.py"
Cohesion: 0.60
Nodes (4): Config, Progress, ProgressBase, ProgressCreate

### Community 43 - "upload_material"
Cohesion: 0.67
Nodes (3): Request, upload_material(), UploadFile

## Knowledge Gaps
- **151 isolated node(s):** `Config`, `Config`, `Config`, `Config`, `Config` (+146 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `success_response()` connect `success_response` to `get_current_user`, `announcements.py`, `categories.py`, `courses.py`, `instructor.py`, `resources.py`, `response.py`, `certificates.py`, `assignments.py`, `upload_material`, `BaseModel`, `main.py`, `discussions.py`, `users.py`, `enrollments.py`, `firebase.py`, `analytics.py`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `unwrap()` connect `unwrap` to `Analytics.tsx`, `Card.tsx`, `Topbar.tsx`, `App.tsx`, `CreateCourse.tsx`, `Dashboard.tsx`, `Dashboard.tsx`, `adminService.ts`, `assignmentService.ts`, `Badge.tsx`, `index.ts`, `MyCourses.tsx`, `Categories.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `Config`, `Verify the Firebase ID token and return the decoded token.     Implements a ret`, `Comprehensive dashboard summary for instructors.` to the rest of the system?**
  _158 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `unwrap` be split into smaller, more focused modules?**
  _Cohesion score 0.05536942338211955 - nodes in this community are weakly interconnected._
- **Should `instructor.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1037037037037037 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `courses.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._