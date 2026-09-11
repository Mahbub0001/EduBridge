# Graph Report - project-3  (2026-08-22)

## Corpus Check
- 158 files · ~84,477 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 865 nodes · 2415 edges · 75 communities (74 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.63)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a96d6520`
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
- [[_COMMUNITY_announcements.py|announcements.py]]
- [[_COMMUNITY_categories.py|categories.py]]
- [[_COMMUNITY_resources.py|resources.py]]
- [[_COMMUNITY_enrollment.py|enrollment.py]]
- [[_COMMUNITY_mockData.ts|mockData.ts]]
- [[_COMMUNITY_utils.ts|utils.ts]]
- [[_COMMUNITY_response.py|response.py]]
- [[_COMMUNITY_api.ts|api.ts]]
- [[_COMMUNITY_enrollment.py|enrollment.py]]
- [[_COMMUNITY_progress.py|progress.py]]
- [[_COMMUNITY_Calendar.tsx|Calendar.tsx]]
- [[_COMMUNITY_tsconfig.json|tsconfig.json]]
- [[_COMMUNITY_ConfirmDialog.tsx|ConfirmDialog.tsx]]
- [[_COMMUNITY_progress.py|progress.py]]
- [[_COMMUNITY_StudentFooter.tsx|StudentFooter.tsx]]
- [[_COMMUNITY_exportEventsToICS|exportEventsToICS]]

## God Nodes (most connected - your core abstractions)
1. `success_response()` - 155 edges
2. `unwrap()` - 105 edges
3. `cn()` - 60 edges
4. `check_course_permission()` - 44 edges
5. `Card()` - 41 edges
6. `Button()` - 38 edges
7. `invalidate_cache()` - 30 edges
8. `Badge()` - 27 edges
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

## Communities (75 total, 1 thin omitted)

### Community 0 - "unwrap"
Cohesion: 0.24
Nodes (16): CourseBuilder(), Step, STEPS, checkCoursePublish(), createInstructorLesson(), createInstructorModule(), createInstructorResource(), deleteInstructorLesson() (+8 more)

### Community 1 - "instructor.py"
Cohesion: 0.05
Nodes (109): AssignmentCreate, create_assignment(), delete_assignment(), get_assignment(), get_assignment_submissions(), get_course_assignments(), get_my_submission(), grade_submission() (+101 more)

### Community 2 - "dependencies"
Cohesion: 0.05
Nodes (37): dependencies, autoprefixer, axios, clsx, date-fns, firebase, lucide-react, postcss (+29 more)

### Community 3 - "courses.py"
Cohesion: 0.11
Nodes (31): admin_update_course_status(), archive_course(), create_course(), create_lesson(), create_module(), delete_course(), delete_lesson(), delete_module() (+23 more)

### Community 4 - "cn"
Cohesion: 0.13
Nodes (23): App(), ProtectedRoute(), Topbar(), TopbarLink, ThemeProvider(), useTheme(), PublicLayout(), PublicLayoutProps (+15 more)

### Community 5 - "Card.tsx"
Cohesion: 0.13
Nodes (16): NotificationDropdown(), AssignmentCard(), statusStyles, Button(), ButtonProps, CalendarCard(), typeVariants, Card() (+8 more)

### Community 6 - "Topbar.tsx"
Cohesion: 0.21
Nodes (11): PageHeader(), ModuleFeedbackProps, Badge(), variants, Assignments(), Certificates(), Discussions(), PLACEHOLDER_THREADS (+3 more)

### Community 7 - "Dashboard.tsx"
Cohesion: 0.16
Nodes (20): InstructorAnalytics(), InstructorCourses(), Dashboard(), Skeleton(), InstructorStudents(), archiveCourse(), publishCourse(), updateCourse() (+12 more)

### Community 8 - "App.tsx"
Cohesion: 0.14
Nodes (22): BreadcrumbItem, CourseLearning(), FlatItem, getCourseQuizzesList(), getVimeoEmbedUrl(), getYouTubeEmbedUrl(), resolveUrl(), CourseQuizzes() (+14 more)

### Community 9 - "assignments.py"
Cohesion: 0.17
Nodes (15): AuthBranding(), AuthBrandingProps, Login(), Role, Register(), Role, establishSession(), getMe() (+7 more)

### Community 10 - "AssignmentCard.tsx"
Cohesion: 0.25
Nodes (8): ResourceCardProps, typeConfig, Resources(), TYPE_COLORS, TYPE_FILTERS, TYPE_ICONS, getResources(), Resource

### Community 11 - "Dashboard.tsx"
Cohesion: 0.22
Nodes (10): get_db(), get_firestore_db(), init_firebase(), get_me(), login_session(), Client, get_notifications(), mark_notification_read() (+2 more)

### Community 12 - "success_response"
Cohesion: 0.11
Nodes (18): Accordion(), AccordionItem, AccordionProps, CourseCard(), Column, DataTable(), DataTableProps, EmptyState() (+10 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "adminService.ts"
Cohesion: 0.11
Nodes (23): AdminSettings(), AdminUsers(), createAnnouncement(), createDiscussion(), createReply(), deleteAnnouncement(), getAllUsers(), getAnnouncements() (+15 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 16 - "BaseModel"
Cohesion: 0.15
Nodes (11): _build_cache_key(), cache_request_middleware(), CacheManager, CustomJSONEncoder, _execute_with_cache_async(), _execute_with_cache_sync(), _format_cached_response(), MemoryCache (+3 more)

### Community 17 - "assignmentService.ts"
Cohesion: 0.25
Nodes (15): InstructorAssignments(), RubricCriterion, InstructorSubmissions(), createAssignment(), deleteAssignment(), getAssignment(), getAssignmentSubmissions(), getCourseAssignments() (+7 more)

### Community 18 - "Sidebar.tsx"
Cohesion: 0.23
Nodes (16): InstructorQuizzes(), Tab, TABS, createQuestion(), createQuiz(), deleteQuestion(), deleteQuiz(), getCourseQuizzes() (+8 more)

### Community 19 - "main.py"
Cohesion: 0.19
Nodes (11): defaultNavItems, NavItem, Sidebar(), SidebarProps, useLogout(), AdminLayout(), navItems, InstructorLayout() (+3 more)

### Community 20 - "Badge.tsx"
Cohesion: 0.24
Nodes (11): AdminCourses(), CATEGORY_COLORS, MyCourses(), tabFromPath(), TabKey, TABS, addToWishlist(), adminUpdateCourseStatus() (+3 more)

### Community 21 - "index.ts"
Cohesion: 0.27
Nodes (12): create_discussion(), create_module_comment(), create_reply(), delete_discussion(), DiscussionCreate, get_all_discussions(), get_course_discussions(), get_module_discussion() (+4 more)

### Community 22 - "seed_firestore.py"
Cohesion: 0.37
Nodes (13): _check(), EduBridge MOOC Platform — Firestore Seed Script.  Populates Firestore with rea, Return True if the document already exists (skip on re-run)., Run all seed functions in dependency order., seed_all(), seed_announcements(), seed_assignments(), seed_categories() (+5 more)

### Community 23 - "discussions.py"
Cohesion: 0.33
Nodes (6): CATEGORIES, CourseFormData, CreateCourse(), INITIAL, STEPS, createCourse()

### Community 24 - "dependencies.py"
Cohesion: 0.24
Nodes (6): get_current_user_token(), HTTPAuthorizationCredentials, decode_jwt_payload(), HTTPAuthorizationCredentials, Verify the Firebase ID token and return the decoded token.     Implements a ret, verify_firebase_token()

### Community 25 - "users.py"
Cohesion: 0.36
Nodes (8): require_admin(), get_all_users(), Client, RoleUpdate, StatusUpdate, update_me(), update_user_role(), update_user_status()

### Community 26 - "MyCourses.tsx"
Cohesion: 0.33
Nodes (12): ModuleFeedback(), InstructorDiscussions(), timeAgo(), deleteDiscussionThread(), getInstructorDiscussionDetail(), getInstructorDiscussions(), getModuleDiscussion(), hideDiscussionThread() (+4 more)

### Community 27 - "enrollments.py"
Cohesion: 0.28
Nodes (15): invalidate_cache(), add_wishlist(), CalendarEventCreate, CalendarEventUpdate, create_calendar_event(), delete_calendar_event(), enroll_course(), my_calendar() (+7 more)

### Community 28 - "store.ts"
Cohesion: 0.28
Nodes (13): InstructorAnnouncements(), CourseDetail(), createInstructorAnnouncement(), deleteInstructorAnnouncement(), getInstructorAnnouncements(), getStudentCourseAnnouncements(), publishInstructorAnnouncement(), updateInstructorAnnouncement() (+5 more)

### Community 29 - "firebase.py"
Cohesion: 0.13
Nodes (13): Config, Settings, generic_exception_handler(), health_check(), http_exception_handler(), Request, read_root(), validation_exception_handler() (+5 more)

### Community 30 - "analytics.py"
Cohesion: 0.36
Nodes (7): get_admin_analytics(), get_analytics_root(), get_course_analytics(), get_instructor_analytics(), get_instructor_dashboard_summary(), Client, Comprehensive dashboard summary for instructors.

### Community 31 - "Categories.tsx"
Cohesion: 0.54
Nodes (6): AdminCategories(), Category, createCategory(), deleteCategory(), getCategories(), updateCategory()

### Community 33 - "announcements.py"
Cohesion: 0.48
Nodes (6): AnnouncementCreate, create_announcement(), delete_announcement(), get_announcements(), get_student_course_announcements(), Client

### Community 34 - "categories.py"
Cohesion: 0.52
Nodes (6): CategoryCreate, create_category(), delete_category(), get_categories(), Client, update_category()

### Community 35 - "resources.py"
Cohesion: 0.39
Nodes (7): require_instructor(), create_resource(), delete_resource(), get_course_resources(), get_resources(), Client, ResourceCreate

### Community 36 - "enrollment.py"
Cohesion: 0.38
Nodes (6): build_enrolled_course(), enrollment_doc_id(), find_user_enrollment(), map_enrollment_status(), Client, Find a user's enrollment without a composite Firestore index.

### Community 37 - "mockData.ts"
Cohesion: 0.12
Nodes (20): NotificationDropdownProps, TopbarProps, AssignmentCardProps, CalendarCardProps, CourseCardProps, CATEGORY_COLORS, CircularProgress(), Dashboard() (+12 more)

### Community 38 - "utils.ts"
Cohesion: 0.53
Nodes (3): AdminAnalytics(), Dashboard(), getAdminAnalytics()

### Community 39 - "response.py"
Cohesion: 0.36
Nodes (7): get_current_user(), Client, generate_certificate(), GenerateCertificatePayload, get_my_certificates(), Client, verify_certificate()

### Community 40 - "api.ts"
Cohesion: 0.50
Nodes (4): CourseThumbnail(), CourseThumbnailProps, getCourseTheme(), ThemeConfig

### Community 41 - "enrollment.py"
Cohesion: 0.60
Nodes (4): Config, Enrollment, EnrollmentBase, EnrollmentCreate

### Community 42 - "progress.py"
Cohesion: 0.60
Nodes (4): Config, Progress, ProgressBase, ProgressCreate

### Community 43 - "Calendar.tsx"
Cohesion: 0.31
Nodes (9): Calendar(), CalendarEventItem, FilterType, ViewMode, createCalendarEvent(), deleteCalendarEvent(), getCalendar(), getMyCourses() (+1 more)

### Community 67 - "ConfirmDialog.tsx"
Cohesion: 0.29
Nodes (5): ConfirmDialog(), ConfirmDialogProps, Modal(), ModalProps, sizes

### Community 72 - "progress.py"
Cohesion: 0.47
Nodes (5): cache_response(), get_course_progress(), LessonCompletePayload, mark_lesson_complete(), Client

### Community 74 - "StudentFooter.tsx"
Cohesion: 0.50
Nodes (3): footerLinks, StudentFooter(), StudentFooterProps

### Community 77 - "exportEventsToICS"
Cohesion: 0.83
Nodes (3): escapeICSText(), exportEventsToICS(), formatICSDate()

## Knowledge Gaps
- **158 isolated node(s):** `Config`, `Config`, `Config`, `Config`, `Config` (+153 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `success_response()` connect `instructor.py` to `announcements.py`, `categories.py`, `courses.py`, `resources.py`, `response.py`, `progress.py`, `Dashboard.tsx`, `index.ts`, `users.py`, `enrollments.py`, `firebase.py`, `analytics.py`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `unwrap()` connect `adminService.ts` to `unwrap`, `cn`, `Card.tsx`, `utils.ts`, `Topbar.tsx`, `App.tsx`, `assignments.py`, `Dashboard.tsx`, `Calendar.tsx`, `mockData.ts`, `AssignmentCard.tsx`, `assignmentService.ts`, `Sidebar.tsx`, `Badge.tsx`, `discussions.py`, `MyCourses.tsx`, `store.ts`, `Categories.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `cn()` connect `success_response` to `ConfirmDialog.tsx`, `cn`, `Card.tsx`, `mockData.ts`, `Topbar.tsx`, `api.ts`, `utils.ts`, `StudentFooter.tsx`, `AssignmentCard.tsx`, `assignments.py`, `Calendar.tsx`, `main.py`, `discussions.py`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `Config`, `Verify the Firebase ID token and return the decoded token.     Implements a ret`, `Comprehensive dashboard summary for instructors.` to the rest of the system?**
  _165 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `instructor.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05339435545385202 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `courses.py` be split into smaller, more focused modules?**
  _Cohesion score 0.11428571428571428 - nodes in this community are weakly interconnected._