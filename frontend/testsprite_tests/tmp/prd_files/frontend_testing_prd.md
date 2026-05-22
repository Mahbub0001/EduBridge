# Product Requirements Document (PRD) for Frontend Testing
## EduBridge MOOC Platform

This document outlines the frontend testing specifications, user interaction pathways, route rules, API sync expectations, and validation criteria for the **EduBridge MOOC Platform**.

---

## 1. Overview & Tech Stack
* **Frontend**: React (v19) built with Vite and TypeScript.
* **Styling**: TailwindCSS for component design, Lucide React for iconography.
* **State Management**: Zustand (with persistent local storage integration).
* **API Communication**: Axios with requests/responses interceptors to manage Bearer Token injection.
* **Backend Database & Security**: FastAPI backend interacting with Firebase Firestore & Authentication.

---

## 2. User Roles & Permissions Matrix
* **Anonymous/Guest**: Public Pages, Course previews, Certificate verification, Login, and Registration.
* **Student**: Course enrollment, learning portal, quizzes, assignments submissions, discussion participation, calendar scheduling, certificate collection.
* **Instructor**: Course curation, curriculum building (modules/lessons/files), quiz editing, setting assignments, grading student submissions, forum moderation.
* **Admin**: User listings, user role changing, blocking/unblocking accounts, auditing course publications, categories creation, global platform analytics.

---

## 3. Navigable Route Map & Access Rules
* `/` - Landing Page
* `/login` - User Login Page
* `/register` - User Registration Page
* `/forgot-password` - Forgot Password Page
* `/student/dashboard` - Student Dashboard
* `/student/my-courses` - Student My Courses list
* `/student/courses/:courseId` - Student Course Detail overview
* `/student/courses/:courseId/learn` - Student learning player
* `/instructor/dashboard` - Instructor dashboard home
* `/instructor/courses` - Instructor courses catalog overview
* `/instructor/create-course` - Form to create a new course
* `/instructor/course-builder` - Curriculum builder for courses
* `/admin/dashboard` - System Administrator dashboard
* `/admin/users` - Users profiles management

---

## 4. Functional Test Specifications

### 4.1 User Authentication Flow
- Select role pill ("Student" or "Instructor").
- Enter credentials and submit login form. Expected redirect to correct dashboard.
- Continue with Google OAuth option.

### 4.2 Student Dashboard & Notice Board
- Display enrolled courses count and progress percentages.
- Notice Board displays recent notifications.

### 4.3 Course Browsing, Wishlist, & Enrollment
- Filter courses by category.
- Wishlist toggling (click heart to add/remove).
- Enroll in a course from CourseDetail.

### 4.4 Course Learning Player & Progress Tracking
- Select lesson from curriculum sidebar.
- Play video, read description.
- Mark lesson as completed, increments progress bar.

### 4.5 Student Assignments Portal
- View list of assignments and statuses.
- Submit text description and file attachments.

### 4.6 Timed Quizzes & Question Interactions
- Click Start Quiz to begin.
- MCQ, True/False, Short Answer formats.
- Submit answers and view scorecard.

### 4.7 Instructor Course & Curriculum Builder
- Create draft course.
- Add modules and lessons.
- Publish course.

### 4.8 Instructor Assignment & Grading Hub
- Grade submitted student assignments with score and feedback comments.

### 4.9 Admin User Control & Course Moderation
- Search users, update role and block/unblock status.
- Audit course publish statuses.

---

## 5. Non-Functional Testing Requirements
- **Theme Syncing**: Light/Dark Mode toggle.
- **Auth State Persistence**: Local storage tokens.
- **Offline Resiliency**: Load mock data if API is down.
- **Responsive design**: Check layouts on mobile.

---

## 6. Reference Seed Data (Credentials)
- **Student**: `student@example.com` / `password123`
- **Instructor**: `instructor@example.com` / `password123`
- **Admin**: `admin@example.com` / `password123`
