# Graph Report - MOOC_blended  (2026-09-13)

## Corpus Check
- 159 files · ~88,405 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 878 nodes · 2278 edges · 85 communities (64 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c2e31535`
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
- [[_COMMUNITY_Button.tsx|Button.tsx]]
- [[_COMMUNITY_Discussions.tsx|Discussions.tsx]]
- [[_COMMUNITY_Calendar.tsx|Calendar.tsx]]
- [[_COMMUNITY_Categories.tsx|Categories.tsx]]
- [[_COMMUNITY_firebase.py|firebase.py]]
- [[_COMMUNITY_CreateCourse.tsx|CreateCourse.tsx]]
- [[_COMMUNITY_get_current_user|get_current_user]]
- [[_COMMUNITY_announcements.py|announcements.py]]
- [[_COMMUNITY_categories.py|categories.py]]
- [[_COMMUNITY_resources.py|resources.py]]
- [[_COMMUNITY_enrollment.py|enrollment.py]]
- [[_COMMUNITY_mockData.ts|mockData.ts]]
- [[_COMMUNITY_utils.ts|utils.ts]]
- [[_COMMUNITY_TC011_Search_and_manage_a_user_account.py|TC011_Search_and_manage_a_user_account.py]]
- [[_COMMUNITY_TC012_Submit_a_course_assignment_response.py|TC012_Submit_a_course_assignment_response.py]]
- [[_COMMUNITY_TC013_Complete_a_course_builder_draft_and_publish_it.py|TC013_Complete_a_course_builder_draft_and_publish_it.py]]
- [[_COMMUNITY_TC014_Resume_learning_from_a_selected_lesson.py|TC014_Resume_learning_from_a_selected_lesson.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY___init__.py|__init__.py]]
- [[_COMMUNITY_test_fb.py|test_fb.py]]
- [[_COMMUNITY_ConfirmDialog.tsx|ConfirmDialog.tsx]]
- [[_COMMUNITY_progress.py|progress.py]]
- [[_COMMUNITY_Dashboard.tsx|Dashboard.tsx]]
- [[_COMMUNITY_StudentFooter.tsx|StudentFooter.tsx]]
- [[_COMMUNITY_DataTable.tsx|DataTable.tsx]]
- [[_COMMUNITY_Tabs.tsx|Tabs.tsx]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Client|Client]]
- [[_COMMUNITY_Any|Any]]

## God Nodes (most connected - your core abstractions)
1. `success_response()` - 146 edges
2. `unwrap()` - 107 edges
3. `cn()` - 60 edges
4. `check_course_permission()` - 44 edges
5. `Card()` - 42 edges
6. `Button()` - 39 edges
7. `Badge()` - 28 edges
8. `invalidate_cache()` - 24 edges
9. `useTranslation()` - 23 edges
10. `getMyInstructorCourses()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `run_tests()` --calls--> `invalidate_cache()`  [INFERRED]
  backend/test_verify.py → backend/app/core/cache.py
- `seed_all()` --calls--> `init_firebase()`  [INFERRED]
  backend/app/scripts/seed_firestore.py → backend/app/core/firebase.py
- `read_root()` --calls--> `success_response()`  [EXTRACTED]
  backend/app/main.py → backend/app/utils/response.py
- `get_analytics_root()` --calls--> `success_response()`  [EXTRACTED]
  backend/app/routers/analytics.py → backend/app/utils/response.py
- `get_instructor_analytics()` --calls--> `success_response()`  [EXTRACTED]
  backend/app/routers/analytics.py → backend/app/utils/response.py

## Import Cycles
- None detected.

## Communities (85 total, 21 thin omitted)

### Community 0 - "unwrap"
Cohesion: 0.17
Nodes (21): InstructorAssignments(), RubricCriterion, InstructorSubmissions(), Assignments(), Dashboard(), timeAgo(), createAssignment(), deleteAssignment() (+13 more)

### Community 1 - "instructor.py"
Cohesion: 0.09
Nodes (24): RubricCriterion, RubricScore, BaseModel, get_all_users(), RoleUpdate, StatusUpdate, update_me(), update_user_role() (+16 more)

### Community 2 - "dependencies"
Cohesion: 0.09
Nodes (62): AnnouncementCreateUpdate, AssignmentCreateUpdate, check_course_permission(), create_course_announcement_notifications(), create_course_module(), create_instructor_announcement(), create_instructor_course_assignment(), create_instructor_course_quiz() (+54 more)

### Community 3 - "courses.py"
Cohesion: 0.10
Nodes (41): invalidate_cache(), submit_assignment(), CategoryCreate, create_category(), delete_category(), get_categories(), update_category(), admin_update_course_status() (+33 more)

### Community 4 - "cn"
Cohesion: 0.10
Nodes (25): Certificates(), CourseDetail(), Resources(), CertificateVerify, VerifyCertificate(), getStudentCourseAnnouncements(), api, CacheEntry (+17 more)

### Community 5 - "Card.tsx"
Cohesion: 0.24
Nodes (16): CourseBuilder(), Step, STEPS, checkCoursePublish(), createInstructorLesson(), createInstructorModule(), createInstructorResource(), deleteInstructorLesson() (+8 more)

### Community 6 - "Topbar.tsx"
Cohesion: 0.21
Nodes (11): PageHeader(), ModuleFeedbackProps, Badge(), variants, Card(), CardProps, CATEGORY_COLORS, PLACEHOLDER_THREADS (+3 more)

### Community 7 - "Dashboard.tsx"
Cohesion: 0.20
Nodes (17): InstructorCourses(), Dashboard(), Skeleton(), InstructorStudents(), archiveCourse(), publishCourse(), AtRiskStudent, CoursePerformance (+9 more)

### Community 8 - "App.tsx"
Cohesion: 0.15
Nodes (21): BreadcrumbItem, ModuleFeedback(), CourseLearning(), FlatItem, getCourseQuizzesList(), getVimeoEmbedUrl(), getYouTubeEmbedUrl(), resolveUrl() (+13 more)

### Community 9 - "assignments.py"
Cohesion: 0.06
Nodes (57): App(), AuthBranding(), AuthBrandingProps, ProtectedRoute(), defaultNavItems, NavItem, Sidebar(), SidebarProps (+49 more)

### Community 10 - "AssignmentCard.tsx"
Cohesion: 0.50
Nodes (4): CourseThumbnail(), CourseThumbnailProps, getCourseTheme(), ThemeConfig

### Community 11 - "Dashboard.tsx"
Cohesion: 0.08
Nodes (25): require_admin(), require_instructor(), get_db(), get_firestore_db(), init_firebase(), get_admin_analytics(), get_analytics_root(), get_course_analytics() (+17 more)

### Community 12 - "success_response"
Cohesion: 0.09
Nodes (25): footerLinks, StudentFooter(), StudentFooterProps, Accordion(), AccordionItem, AccordionProps, ConfirmDialog(), ConfirmDialogProps (+17 more)

### Community 13 - "compilerOptions"
Cohesion: 0.05
Nodes (37): dependencies, autoprefixer, axios, clsx, date-fns, firebase, lucide-react, postcss (+29 more)

### Community 14 - "adminService.ts"
Cohesion: 0.18
Nodes (16): AnnouncementCreate, create_announcement(), delete_announcement(), get_announcements(), get_student_all_announcements(), get_student_course_announcements(), get_student_unread_count(), mark_all_announcements_read() (+8 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 16 - "BaseModel"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 17 - "assignmentService.ts"
Cohesion: 0.25
Nodes (15): InstructorAnalytics(), InstructorAnnouncements(), StudentAnnouncements(), createInstructorAnnouncement(), deleteInstructorAnnouncement(), getInstructorAnnouncements(), getStudentAnnouncements(), markAllAnnouncementsAsRead() (+7 more)

### Community 18 - "Sidebar.tsx"
Cohesion: 0.25
Nodes (15): InstructorQuizzes(), Tab, TABS, createQuestion(), createQuiz(), deleteQuestion(), deleteQuiz(), getCourseQuizzes() (+7 more)

### Community 19 - "main.py"
Cohesion: 0.19
Nodes (13): create_question(), create_quiz(), delete_question(), delete_quiz(), get_course_quizzes(), get_my_attempts(), get_quiz(), get_quiz_questions() (+5 more)

### Community 20 - "Badge.tsx"
Cohesion: 0.37
Nodes (13): _check(), EduBridge MOOC Platform — Firestore Seed Script.  Populates Firestore with rea, Return True if the document already exists (skip on re-run)., Run all seed functions in dependency order., seed_all(), seed_announcements(), seed_assignments(), seed_categories() (+5 more)

### Community 21 - "index.ts"
Cohesion: 0.21
Nodes (11): create_discussion(), create_module_comment(), create_reply(), delete_discussion(), DiscussionCreate, get_all_discussions(), get_course_discussions(), get_module_discussion() (+3 more)

### Community 22 - "seed_firestore.py"
Cohesion: 0.16
Nodes (13): AdminSettings(), AdminUsers(), createAnnouncement(), createDiscussion(), createReply(), deleteAnnouncement(), getAllUsers(), getAnnouncements() (+5 more)

### Community 23 - "MyCourses.tsx"
Cohesion: 0.23
Nodes (12): AdminCourses(), CATEGORY_COLORS, MyCourses(), tabFromPath(), TabKey, TABS, addToWishlist(), adminUpdateCourseStatus() (+4 more)

### Community 24 - "dependencies.py"
Cohesion: 0.24
Nodes (10): AssignmentCreate, create_assignment(), delete_assignment(), get_assignment(), get_assignment_submissions(), get_course_assignments(), get_my_submission(), grade_submission() (+2 more)

### Community 25 - "Button.tsx"
Cohesion: 0.24
Nodes (6): Button(), ButtonProps, CertificateCardProps, CourseCard(), CourseCardProps, Course

### Community 26 - "Discussions.tsx"
Cohesion: 0.37
Nodes (11): InstructorDiscussions(), timeAgo(), deleteDiscussionThread(), getInstructorDiscussionDetail(), getInstructorDiscussions(), getModuleDiscussion(), hideDiscussionThread(), pinDiscussionThread() (+3 more)

### Community 27 - "Calendar.tsx"
Cohesion: 0.26
Nodes (11): Calendar(), CalendarEventItem, FilterType, ViewMode, createCalendarEvent(), deleteCalendarEvent(), getCalendar(), toggleCalendarEvent() (+3 more)

### Community 28 - "Categories.tsx"
Cohesion: 0.54
Nodes (6): AdminCategories(), Category, createCategory(), deleteCategory(), getCategories(), updateCategory()

### Community 29 - "firebase.py"
Cohesion: 0.07
Nodes (24): BaseSettings, _build_cache_key(), CacheManager, CustomJSONEncoder, _execute_with_cache_async(), _execute_with_cache_sync(), _format_cached_response(), MemoryCache (+16 more)

### Community 30 - "CreateCourse.tsx"
Cohesion: 0.33
Nodes (6): CATEGORIES, CourseFormData, CreateCourse(), INITIAL, STEPS, createCourse()

### Community 32 - "get_current_user"
Cohesion: 0.33
Nodes (8): submit_quiz(), Assignment, AssignmentBase, AssignmentCreate, Quiz, QuizBase, QuizCreate, QuizSubmit

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
Cohesion: 0.10
Nodes (25): NotificationDropdown(), NotificationDropdownProps, TopbarProps, AssignmentCard(), AssignmentCardProps, statusStyles, CalendarCard(), CalendarCardProps (+17 more)

### Community 38 - "utils.ts"
Cohesion: 0.67
Nodes (3): Request, upload_material(), UploadFile

## Knowledge Gaps
- **157 isolated node(s):** `Config`, `Config`, `Config`, `Config`, `Config` (+152 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `success_response()` connect `courses.py` to `get_current_user`, `instructor.py`, `dependencies`, `utils.ts`, `Dashboard.tsx`, `adminService.ts`, `main.py`, `index.ts`, `dependencies.py`, `firebase.py`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `unwrap()` connect `cn` to `unwrap`, `Card.tsx`, `Dashboard.tsx`, `App.tsx`, `assignments.py`, `assignmentService.ts`, `Sidebar.tsx`, `seed_firestore.py`, `MyCourses.tsx`, `Discussions.tsx`, `Calendar.tsx`, `Categories.tsx`, `CreateCourse.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `firebase` connect `compilerOptions` to `assignments.py`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `Config`, `Verify the Firebase ID token and return the decoded token.     Implements a ret`, `Comprehensive dashboard summary for instructors.` to the rest of the system?**
  _164 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `instructor.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09425287356321839 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0890937019969278 - nodes in this community are weakly interconnected._
- **Should `courses.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10042283298097252 - nodes in this community are weakly interconnected._