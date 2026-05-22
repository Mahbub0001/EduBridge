# Product Requirements Document (PRD) for Frontend Testing
## EduBridge MOOC Platform

This document outlines the frontend testing specifications, user interaction pathways, route rules, API sync expectations, and validation criteria for the **EduBridge MOOC Platform**. It serves as a comprehensive guide for QA engineers and developer automation pipelines (e.g., TestSprite, Playwright, Cypress) to inspect, execute, and verify the frontend application.

---

## Table of Contents
1. [Overview & Tech Stack](#1-overview--tech-stack)
2. [User Roles & Permissions Matrix](#2-user-roles--permissions-matrix)
3. [Navigable Route Map & Access Rules](#3-navigable-route-map--access-rules)
4. [Functional Test Specifications](#4-functional-test-specifications)
   - [4.1 User Authentication Flow](#41-user-authentication-flow)
   - [4.2 Student Dashboard & Notice Board](#42-student-dashboard--notice-board)
   - [4.3 Course Browsing, Wishlist, & Enrollment](#43-course-browsing-wishlist--enrollment)
   - [4.4 Course Learning Player & Progress Tracking](#44-course-learning-player--progress-tracking)
   - [4.5 Student Assignments Portal](#45-student-assignments-portal)
   - [4.6 Timed Quizzes & Question Interactions](#46-timed-quizzes--question-interactions)
   - [4.7 Instructor Course & Curriculum Builder](#47-instructor-course--curriculum-builder)
   - [4.8 Instructor Assignment & Grading Hub](#48-instructor-assignment--grading-hub)
   - [4.9 Admin User Control & Course Moderation](#49-admin-user-control--course-moderation)
   - [4.10 Platform Discussions (Q&A Boards)](#410-platform-discussions-qa-boards)
   - [4.11 Certificates Generation & Public Verification](#411-certificates-generation--public-verification)
5. [Non-Functional Testing Requirements](#5-non-functional-testing-requirements)
   - [5.1 Auth State Persistence & Token Refresh](#51-auth-state-persistence--token-refresh)
   - [5.2 Offline Resiliency & Mock Data Fallbacks](#52-offline-resiliency--mock-data-fallbacks)
   - [5.3 Responsive Design & Accessibility (a11y)](#53-responsive-design--accessibility-a11y)
   - [5.4 Theme Syncing](#54-theme-syncing)
6. [Reference Seed Data (Credentials)](#6-reference-seed-data-credentials)

---

## 1. Overview & Tech Stack

**EduBridge** is a modern full-stack Massive Open Online Course (MOOC) platform. The system leverages:
* **Frontend**: React (v19) built with Vite and TypeScript.
* **Styling**: TailwindCSS for component design, Lucide React for iconography.
* **State Management**: Zustand (with persistent local storage integration).
* **API Communication**: Axios with requests/responses interceptors to manage Bearer Token injection.
* **Backend Database & Security**: FastAPI backend interacting with Firebase Firestore & Authentication.

---

## 2. User Roles & Permissions Matrix

The frontend behaves dynamically depending on the active user’s role, which is loaded from the backend session (`/api/auth/session`) and cached in the Zustand `edubridge-auth` local storage state.

| Role | Access Scope | Allowed Dashboards / Areas |
| :--- | :--- | :--- |
| **Anonymous/Guest** | Public Pages, Course previews, Certificate verification, Login, and Registration. | Public landing, auth screens |
| **Student** | Course enrollment, learning portal, quizzes, assignments submissions, discussion participation, calendar scheduling, certificate collection. | `/student/*`, `/learning/*` |
| **Instructor** | Course curation, curriculum building (modules/lessons/files), quiz editing, setting assignments, grading student submissions, forum moderation. | `/instructor/*`, `/student/*` (as learner) |
| **Admin** | User listings, user role changing, blocking/unblocking accounts, auditing course publications, categories creation, global platform analytics. | `/admin/*`, `/instructor/*`, `/student/*` |
| **Super Admin** | Full access including all system admin parameters. | `/admin/*`, `/instructor/*`, `/student/*` |

---

## 3. Navigable Route Map & Access Rules

All route routing is configured in [App.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/App.tsx) and guarded by the `ProtectedRoute` component.

### Public Routes (No Authentication Required)
* **`/`** - [Landing.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/Landing.tsx): Platform overview, hero stats, and featured courses.
* **`/login`** - [Login.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/auth/Login.tsx): Selector between role portals (Student vs Instructor), email/password fields, and Continue with Google button.
* **`/register`** - [Register.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/auth/Register.tsx): Registration form for accounts.
* **`/forgot-password`** - [ForgotPassword.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/auth/ForgotPassword.tsx): Trigger email recovery.
* **`/verify-certificate/:certificateId`** - [VerifyCertificate.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/VerifyCertificate.tsx): Global public certificate verification.

### Protected Student Routes (Require `student`, `instructor`, or `admin`)
* **`/student/dashboard`** - [Dashboard.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Dashboard.tsx): Enrolled progress summary, notices, recent tasks, calendar indicators.
* **`/student/my-courses/*`** - [MyCourses.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/MyCourses.tsx): Course manager categorized by status tabs: All, In Progress, Completed, Wishlist, and Explore catalog.
* **`/student/courses/:courseId`** - [CourseDetail.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/CourseDetail.tsx): Detailed Syllabus view, instructor biography, and Enroll button.
* **`/student/courses/:courseId/learn`** or **`/learning/:courseId`** - [CourseLearning.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/CourseLearning.tsx): Active lessons player with modules, resources download, and progress toggle.
* **`/student/calendar`** - [Calendar.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Calendar.tsx): Interactive scheduling calendar representing assignments deadlines and course milestones.
* **`/student/resources`** - [Resources.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Resources.tsx): Directory of attached worksheets and files.
* **`/student/assignments`** - [Assignments.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Assignments.tsx): Submission portal for students' items.
* **`/student/discussions`** - [Discussions.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Discussions.tsx): Group forums.
* **`/student/certificates`** - [Certificates.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Certificates.tsx): Collect completed certificate files.
* **`/student/settings/*`** - [Settings.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Settings.tsx): Profile details, notification toggles, theme changes.

### Protected Instructor Routes (Require `instructor` or `admin`)
* **`/instructor/dashboard`** - [Dashboard.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Dashboard.tsx): Analytical overview dashboard (revenue, total students, active enrollments).
* **`/instructor/courses`** - [Courses.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Courses.tsx): Courses managed by the logged-in instructor.
* **`/instructor/create-course`** - [CreateCourse.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/CreateCourse.tsx): Form wizard to instantiate a new draft course.
* **`/instructor/course-builder`** - [CourseBuilder.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/CourseBuilder.tsx): Interactive drag-and-drop hierarchy builder to add/edit modules, lessons, and attachment files.
* **`/instructor/quizzes`** - [Quizzes.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Quizzes.tsx): Questions pool and parameters for course testing (MCQ, True/False).
* **`/instructor/assignments`** - [Assignments.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Assignments.tsx): Formulate assignments with deadlines.
* **`/instructor/submissions`** - [Submissions.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Submissions.tsx): Grading pane for checking submitted PDF/Zip assignments.
* **`/instructor/analytics`** - [Analytics.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Analytics.tsx): Interactive Recharts tables presenting user engagement.
* **`/instructor/announcements`** - [Announcements.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Announcements.tsx): Formulate notice alerts sent to all active students.
* **`/instructor/discussions`** - [Discussions.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Discussions.tsx): Moderator dashboard for course discussions.
* **`/instructor/students`** - [Students.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Students.tsx): Roster view of active learners.
* **`/instructor/settings`** - [Settings.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Settings.tsx): Profile adjustments.
* **`/instructor/help`** - [HelpCenter.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/HelpCenter.tsx): Help documentation.

### Protected Admin Routes (Require `admin` or `super_admin`)
* **`/admin/dashboard`** - [Dashboard.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/admin/Dashboard.tsx): Platform statistics and key aggregates.
* **`/admin/users`** - [Users.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/admin/Users.tsx): Management table of all registered student, instructor, and admin accounts.
* **`/admin/courses`** - [Courses.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/admin/Courses.tsx): Administration course audit panel (approving, rejecting, or blocking courses).
* **`/admin/categories`** - [Categories.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/admin/Categories.tsx): CRUD of classification groups (e.g. Development, Design, Business).
* **`/admin/analytics`** - [Analytics.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/admin/Analytics.tsx): Global performance metrics.
* **`/admin/settings`** - [Settings.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/admin/Settings.tsx): Main application config attributes.

---

## 4. Functional Test Specifications

### 4.1 User Authentication Flow
* **File Locations**: [Login.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/auth/Login.tsx), [Register.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/auth/Register.tsx), [ForgotPassword.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/auth/ForgotPassword.tsx)
* **Test Case 1 (Email Authentication Validation)**:
  * *Interactions*: Input invalid email syntax (`student@invalid`). Verify inline error trigger or HTML validation preventer. Input valid credentials.
  * *Role Selection*: Select "Student" role pill. Submit form. Expected outcome: redirect to `/student/dashboard`. Select "Instructor" role pill. Submit form. Expected outcome: redirect to `/instructor/dashboard`.
* **Test Case 2 (OAuth Google Authentication)**:
  * *Interactions*: Click "Continue with Google". Simulate a popup blockage. Verify the application gracefully triggers fallback redirection (`signInWithRedirect`).
* **Test Case 3 (Registration Verification)**:
  * *Interactions*: Input Full Name, Email, Password, and Password Confirmation. Test password mismatch validation. Submit successfully to trigger redirect to Login or Dashboard depending on backend session validation.
* **Test Case 4 (Forgot Password Workflow)**:
  * *Interactions*: Input email in the input area and click request recovery. Confirm checkmark / alert box reporting verification email sent.

### 4.2 Student Dashboard & Notice Board
* **File Location**: [Dashboard.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Dashboard.tsx)
* **Test Case 1 (Metrics Aggregations)**:
  * *Interactions*: Verify that statistics block items matches actual data (e.g., number of Enrolled Courses, Pending Assignments, and Certificates).
  * *Expected UI State*: If there are active courses, the hero card must display the title of the first active course alongside a functional "Resume Learning" button and a radial circular progress representation. If zero courses are active, verify the placeholder showing "No Active Courses" alongside an "Explore Courses" action button.
* **Test Case 2 (Notice Board Sync)**:
  * *Interactions*: Check that the notice board loads announcements, showing titles, messages, and a formatted relative timestamp (e.g. "2 hours ago", "3 days ago").

### 4.3 Course Browsing, Wishlist, & Enrollment
* **File Locations**: [MyCourses.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/MyCourses.tsx), [CourseDetail.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/CourseDetail.tsx)
* **Test Case 1 (Catalog Filters)**:
  * *Interactions*: Navigate to `/student/my-courses/explore`. Change category filters from the dropdown. Search courses by typing keyword in the filter input. Verify results immediately update.
* **Test Case 2 (Wishlist Operations)**:
  * *Interactions*: Hover on a course card and click the Heart icon. Navigate to the "Wishlist" tab. Confirm the course appears. Click the Heart icon again. Verify it disappears from the Wishlist list.
* **Test Case 3 (Course Enrollment)**:
  * *Interactions*: On [CourseDetail.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/CourseDetail.tsx), inspect course syllabus, modules, and level. If not enrolled, verify "Enroll Now" button is visible. Click "Enroll Now". Confirm transition to `/learning/:courseId` or change of the button text to "Resume Learning".

### 4.4 Course Learning Player & Progress Tracking
* **File Location**: [CourseLearning.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/CourseLearning.tsx)
* **Test Case 1 (Lessons Player Navigation)**:
  * *Interactions*: Open the lessons learning portal. Click modules in the sidebar to expand lessons list. Select a lesson. Verify details content pane loads correct data (lesson description, title, and video iframe player).
* **Test Case 2 (Completing Lessons)**:
  * *Interactions*: Click the "Mark as Completed" checkbox. Check that:
    1. The progress percentage in the sidebar and top header increments.
    2. The checkbox remains checked on page refresh.
    3. The next lesson is highlighted or automatically loaded.

### 4.5 Student Assignments Portal
* **File Location**: [Assignments.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Assignments.tsx)
* **Test Case 1 (Assignments Directory)**:
  * *Interactions*: Verify listing representing assignment title, parent course title, due date, status indicator (e.g., "pending", "submitted", "graded"), and grade result.
* **Test Case 2 (Submit Assignment Workflow)**:
  * *Interactions*: Click a pending assignment. Type text into the submission details text area. Click file selector and select a sample file (e.g. PDF/ZIP). Click "Submit Assignment".
  * *Expected UI State*: Submission status immediately shifts to "Submitted". File name and timestamp appear. Form inputs become disabled or read-only.

### 4.6 Timed Quizzes & Question Interactions
* **File Location**: [CourseLearning.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/CourseLearning.tsx) (integrated quiz player)
* **Test Case 1 (Quiz Setup & Timer)**:
  * *Interactions*: Select quiz from syllabus list. Read instructions panel detailing: Time Limit, Max Attempts, Passing Score, and Total Marks. Click "Start Quiz".
  * *Expected UI State*: Timed count begins counting down. Questions list is populated.
* **Test Case 2 (Question Submission & Review)**:
  * *Interactions*: Answer multiple choice questions by clicking radio options. Fill short text field. Click "Submit Quiz". Confirm dialog confirmation pop-up.
  * *Evaluation*: Verify results scorecard renders correctly: shows correct count, final score, pass/fail status badge, and optional explanations.

### 4.7 Instructor Course & Curriculum Builder
* **File Locations**: [CreateCourse.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/CreateCourse.tsx), [CourseBuilder.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/CourseBuilder.tsx)
* **Test Case 1 (Create Course Wizard)**:
  * *Interactions*: Fill in title, category, description, and thumbnail URL. Click save. Confirm draft course appears in the course list.
* **Test Case 2 (Curriculum Hierarchy Creator)**:
  * *Interactions*: Inside `CourseBuilder.tsx`, click "Add Module". Formulate module title. Expand module and click "Add Lesson". Fill in title, select type, add description, and upload a file.
  * *CRUD operations*: Verify instructor can delete or edit modules/lessons by clicking the inline gear/trash bin icons.
* **Test Case 3 (Publish Validation Audit)**:
  * *Interactions*: Click "Publish Course". If curriculum is incomplete (e.g., has empty modules or no lessons), confirm the validation overlay pops up with descriptive warning notifications. If valid, confirm the course status switches to "Published".

### 4.8 Instructor Assignment & Grading Hub
* **File Locations**: [Assignments.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Assignments.tsx), [Submissions.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Submissions.tsx)
* **Test Case 1 (Grade & Review Submissions)**:
  * *Interactions*: Navigate to `/instructor/submissions`. Filter by assignment title or course. Click on a student's submission row.
  * *Evaluation Actions*: Inspect submission text details and attachment download links. Input numeric grade (e.g., `85`) and write reviewer feedback in the comments box.
  * *Action Buttons*: Click "Grade Submission" or "Return for Revision". Confirm the status changes on screen.

### 4.9 Admin User Control & Course Moderation
* **File Locations**: [Users.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/admin/Users.tsx), [Courses.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/admin/Courses.tsx), [Categories.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/admin/Categories.tsx)
* **Test Case 1 (User Permissions Control)**:
  * *Interactions*: Find a target user profile via the search bar. Click the Role selector dropdown and select a different role (e.g. upgrade Student to Instructor). Click status toggles to Block/Unblock user.
  * *Expected UI Response*: Refresh the page and verify the state updates persist.
* **Test Case 2 (Course Moderation Auditing)**:
  * *Interactions*: Navigate to `/admin/courses`. Audit the course list. Select status drop downs to change course states between `Approved`, `Pending`, or `Rejected`.
* **Test Case 3 (Categories Settings)**:
  * *Interactions*: In `/admin/categories`, fill details in "Add Category" dialog and click submit. Verify the list renders the new category.

### 4.10 Platform Discussions (Q&A Boards)
* **File Locations**: [Discussions.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Discussions.tsx), [Discussions.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/instructor/Discussions.tsx)
* **Test Case 1 (Discussion Thread Workflows)**:
  * *Interactions*: Under a course learning section, click Q&A tab. Click "New Thread". Input question title and body text. Click post. Verify the item displays at the top of the discussion list.
  * *Replying*: Click on the thread. Input text response, submit, and verify reply renders beneath the parent comment.
  * *Moderator Actions*: As an instructor or admin, verify presence of "Pin Thread" and "Delete Thread" icons. Click "Pin Thread" and confirm the pinned state badge and visual ordering.

### 4.11 Certificates Generation & Public Verification
* **File Locations**: [Certificates.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/student/Certificates.tsx), [VerifyCertificate.tsx](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/pages/VerifyCertificate.tsx)
* **Test Case 1 (Generation Trigger)**:
  * *Interactions*: Complete 100% of a course lessons. Navigate to `/student/certificates`. Check that the certificate is generated, showing course title, completion date, student name, and a unique certificate ID link.
* **Test Case 2 (Public Verification Portal)**:
  * *Interactions*: Copy the unique certificate ID and access the public verification path: `/verify-certificate/:certificateId`.
  * *Expected UI State*: Renders public verification details showing verified credential banner, course details, name of the recipient student, and verified credentials checklist. An invalid ID must display a clean 404/not-found layout.

---

## 5. Non-Functional Testing Requirements

### 5.1 Auth State Persistence & Token Refresh
* **Zustand Storage**: Check that `edubridge-auth` key in `localStorage` persists correctly.
* **Token Expired Handling**: Simulate token expiration (e.g. by intercepting Axios requests and injecting a 401 response). Check that the interceptor in [api.ts](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/services/api.ts) calls `auth.currentUser.getIdToken(true)` to refresh the session token and retry the original request.
* **Double 401 Safeguard**: If a secondary 401 response is received, verify the user is logged out automatically and redirected to `/login` to prevent infinite redirect loops.

### 5.2 Offline Resiliency & Mock Data Fallbacks
* **Mock Data File**: [mockData.ts](file:///e:/ACADEMIC/3.2/blended/project-3/frontend/src/services/mockData.ts)
* **Verify Fallback**: Shut down local API backend. Verify that the frontend client loads correctly using the fallback data structures without crashing or throwing blank panels. Check that warning alerts or offline indicator symbols display on-screen.

### 5.3 Responsive Design & Accessibility (a11y)
* **Breakpoints Visual Audit**:
  * *Mobile (<768px)*: Sidebar collapses into a hamburger icon overlay. Tables scale down into single-column cards. Form elements stretch full-width.
  * *Tablet (768px - 1024px)*: Compact sidebar or top-nav styling. Grid systems scale to 2 columns.
  * *Desktop (>1024px)*: Fixed left sidebar menu, main workspace pane taking remaining space, and full grids.
* **Aria Rules**:
  * Form inputs must have matching `<label>` elements or `aria-label` tags.
  * Password reveal button must alternate `aria-label` between "Hide password" and "Show password".

### 5.4 Theme Syncing
* **Theme Store**: Confirm local preferences store `edubridge-preferences` persists active setting (`light` vs `dark`).
* **UI Refresh**: Click the dark mode toggle switch on the bottom left or in settings. Verify that dark mode stylesheet tokens (`dark:bg-slate-900`, `dark:text-white`) apply to elements immediately.

---

## 6. Reference Seed Data (Credentials)

The database seed tool populates Firebase Auth and Firestore with three default test user roles:

* **Student Role**:
  * *Email*: `student@example.com`
  * *Password*: `password123`
* **Instructor Role**:
  * *Email*: `instructor@example.com`
  * *Password*: `password123`
* **Admin Role**:
  * *Email*: `admin@example.com`
  * *Password*: `password123`
