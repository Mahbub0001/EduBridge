"""
EduBridge MOOC Platform — Firestore Seed Script.

Populates Firestore with realistic demo data including:
  - categories, users, courses, modules, lessons
  - quizzes, questions, assignments, announcements

Usage:
    python -m app.scripts.seed_firestore

Ensure backend/.env is configured with FIREBASE_SERVICE_ACCOUNT_PATH.
"""

import logging
import sys
import os
from datetime import datetime, timezone

# ── path setup so that `import app...` works from the backend/ directory ──
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

# Change to backend dir so .env and relative service-account paths resolve
os.chdir(_BACKEND_DIR)

os.environ.setdefault("ENVIRONMENT", "development")

from app.core.firebase import init_firebase, db
from firebase_admin import auth as admin_auth

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed")

NOW = datetime.now(timezone.utc)

# ═══════════════════════════════════════════════════════════════════════
# Helper
# ═══════════════════════════════════════════════════════════════════════

def _check(collection: str, doc_id: str) -> bool:
    """Return True if the document already exists (skip on re-run)."""
    return db.collection(collection).document(doc_id).get().exists


def _set(collection: str, doc_id: str, data: dict):
    db.collection(collection).document(doc_id).set(data)
    logger.info("  ✓ %s/%s", collection, doc_id)


# ═══════════════════════════════════════════════════════════════════════
# 1. Categories
# ═══════════════════════════════════════════════════════════════════════

CATEGORIES = [
    {"id": "programming",       "name": "Programming",              "description": "Learn programming languages and software development."},
    {"id": "web-development",   "name": "Web Development",          "description": "Build modern web applications with frontend and backend technologies."},
    {"id": "education",         "name": "Education",                "description": "Teaching methodologies, pedagogy, and educational technology."},
    {"id": "cybersecurity",     "name": "Cybersecurity",            "description": "Protect systems, networks, and data from digital attacks."},
    {"id": "data-science",      "name": "Data Science",             "description": "Analyze and interpret complex data with statistical and computational tools."},
    {"id": "mobile-development","name": "Mobile Development",       "description": "Create mobile applications for iOS and Android platforms."},
]

def seed_categories():
    logger.info("[categories]")
    for cat in CATEGORIES:
        if _check("categories", cat["id"]):
            logger.info("  ∼ %s exists, skipped", cat["id"])
            continue
        _set("categories", cat["id"], {
            "name": cat["name"],
            "slug": cat["id"],
            "description": cat["description"],
            "created_at": NOW,
        })


# ═══════════════════════════════════════════════════════════════════════
# 2. Users  (Firebase Auth + Firestore)
# ═══════════════════════════════════════════════════════════════════════

SEED_USERS = [
    {
        "uid": "student-demo-uid",
        "email": "student@example.com",
        "password": "password123",
        "name": "Alice Johnson",
        "role": "student",
    },
    {
        "uid": "instructor-demo-uid",
        "email": "instructor@example.com",
        "password": "password123",
        "name": "Dr. Robert Chen",
        "role": "instructor",
    },
    {
        "uid": "admin-demo-uid",
        "email": "admin@example.com",
        "password": "password123",
        "name": "Sarah Williams",
        "role": "admin",
    },
]

def seed_users():
    logger.info("[users]")
    for u in SEED_USERS:
        # Firebase Auth user
        try:
            admin_auth.get_user(u["uid"])
            logger.info("  ∼ Auth user %s exists, skipped", u["email"])
        except admin_auth.UserNotFoundError:
            admin_auth.create_user(
                uid=u["uid"],
                email=u["email"],
                password=u["password"],
                display_name=u["name"],
            )
            logger.info("  ✓ Auth user created: %s", u["email"])

        # Firestore document
        if _check("users", u["uid"]):
            logger.info("  ∼ Firestore doc %s exists, skipped", u["uid"])
            continue
        _set("users", u["uid"], {
            "firebase_uid": u["uid"],
            "email": u["email"],
            "name": u["name"],
            "photo_url": None,
            "role": u["role"],
            "status": "active",
            "created_at": NOW,
            "updated_at": NOW,
        })


# ═══════════════════════════════════════════════════════════════════════
# 3. Courses
# ═══════════════════════════════════════════════════════════════════════

COURSES = [
    {
        "id": "structured-programming-c",
        "title": "Structured Programming using C",
        "description": "Master the fundamentals of structured programming with the C language. "
                       "This course covers variables, control structures, functions, arrays, "
                       "pointers, and file handling through hands-on exercises and real-world projects.",
        "category": "programming",
        "level": "Beginner",
        "language": "English",
        "estimated_hours": 40,
        "thumbnail_url": "https://placehold.co/600x400/1e293b/ffffff?text=C+Programming",
        "instructor_id": "instructor-demo-uid",
        "rating_avg": 4.7,
        "enrollment_count": 1560,
        "learning_outcomes": [
            "Write syntactically correct C programs",
            "Implement control structures and loops",
            "Create reusable functions with parameters",
            "Manage memory with pointers and dynamic allocation",
            "Handle files for input/output operations",
            "Debug and troubleshoot C programs effectively",
        ],
        "prerequisites": [
            "Basic computer literacy",
            "No prior programming experience required",
        ],
    },
    {
        "id": "intro-educational-technology",
        "title": "Introduction to Educational Technology",
        "description": "Explore how technology transforms teaching and learning. This course covers "
                       "digital tools, learning management systems, multimedia content creation, "
                       "and assessment platforms for modern educators.",
        "category": "education",
        "level": "Beginner",
        "language": "English",
        "estimated_hours": 30,
        "thumbnail_url": "https://placehold.co/600x400/1e293b/ffffff?text=EdTech",
        "instructor_id": "instructor-demo-uid",
        "rating_avg": 4.5,
        "enrollment_count": 2340,
        "learning_outcomes": [
            "Evaluate digital tools for educational contexts",
            "Design multimedia learning materials",
            "Use LMS platforms to manage courses",
            "Implement formative and summative online assessments",
            "Apply accessibility standards to digital content",
        ],
        "prerequisites": [
            "Familiarity with basic computer applications",
            "Interest in teaching or instructional design",
        ],
    },
    {
        "id": "python-for-beginners",
        "title": "Python for Beginners",
        "description": "Start your programming journey with Python, one of the most versatile and "
                       "in-demand languages. Learn syntax, data structures, OOP, and build "
                       "real-world projects like a calculator app and a web scraper.",
        "category": "programming",
        "level": "Beginner",
        "language": "English",
        "estimated_hours": 35,
        "thumbnail_url": "https://placehold.co/600x400/1e293b/ffffff?text=Python",
        "instructor_id": "instructor-demo-uid",
        "rating_avg": 4.8,
        "enrollment_count": 4200,
        "learning_outcomes": [
            "Write clean and idiomatic Python code",
            "Work with lists, dictionaries, sets, and tuples",
            "Build reusable classes and modules",
            "Read and write files in various formats",
            "Use third-party libraries to extend functionality",
        ],
        "prerequisites": [
            "Basic computer literacy",
            "No prior programming experience required",
        ],
    },
    {
        "id": "web-development-react",
        "title": "Web Development with React",
        "description": "Build modern, responsive single-page applications using React. Learn "
                       "components, hooks, state management, routing, and API integration. "
                       "Capstone project: a full-featured task management app.",
        "category": "web-development",
        "level": "Intermediate",
        "language": "English",
        "estimated_hours": 45,
        "thumbnail_url": "https://placehold.co/600x400/1e293b/ffffff?text=React",
        "instructor_id": "instructor-demo-uid",
        "rating_avg": 4.6,
        "enrollment_count": 3120,
        "learning_outcomes": [
            "Build reusable React components with JSX",
            "Manage component state with hooks and context",
            "Implement client-side routing with React Router",
            "Consume REST APIs and handle async data",
            "Optimize performance with memoization and lazy loading",
        ],
        "prerequisites": [
            "HTML, CSS, and JavaScript fundamentals",
            "Basic understanding of ES6+ syntax",
        ],
    },
    {
        "id": "digital-pedagogy-online-learning",
        "title": "Digital Pedagogy and Online Learning",
        "description": "Design effective online learning experiences using research-backed "
                       "pedagogical frameworks. Topics include constructivism, blended learning "
                       "models, synchronous vs asynchronous strategies, and learning analytics.",
        "category": "education",
        "level": "Intermediate",
        "language": "English",
        "estimated_hours": 25,
        "thumbnail_url": "https://placehold.co/600x400/1e293b/ffffff?text=Digital+Pedagogy",
        "instructor_id": "instructor-demo-uid",
        "rating_avg": 4.4,
        "enrollment_count": 980,
        "learning_outcomes": [
            "Apply pedagogical theories to online course design",
            "Design blended and hybrid learning experiences",
            "Facilitate synchronous and asynchronous discussions",
            "Use learning analytics to improve student outcomes",
            "Evaluate the effectiveness of digital learning interventions",
        ],
        "prerequisites": [
            "Teaching or training experience recommended",
            "Basic familiarity with LMS platforms",
        ],
    },
    {
        "id": "cybersecurity-fundamentals",
        "title": "Cybersecurity Fundamentals",
        "description": "Gain a solid foundation in cybersecurity principles, including network "
                       "security, cryptography, identity management, threat analysis, and "
                       "incident response. Prepares you for entry-level security roles.",
        "category": "cybersecurity",
        "level": "Beginner",
        "language": "English",
        "estimated_hours": 30,
        "thumbnail_url": "https://placehold.co/600x400/1e293b/ffffff?text=Cybersecurity",
        "instructor_id": "instructor-demo-uid",
        "rating_avg": 4.3,
        "enrollment_count": 2100,
        "learning_outcomes": [
            "Identify common cyber threats and attack vectors",
            "Apply encryption techniques to protect data",
            "Configure basic network security controls",
            "Recognize social engineering and phishing attempts",
            "Implement incident response procedures",
        ],
        "prerequisites": [
            "Basic understanding of computer networks",
            "Familiarity with operating system concepts",
        ],
    },
]

def seed_courses():
    logger.info("[courses]")
    for c in COURSES:
        if _check("courses", c["id"]):
            logger.info("  ∼ %s exists, skipped", c["id"])
            continue
        doc = {
            "title": c["title"],
            "description": c["description"],
            "thumbnail_url": c["thumbnail_url"],
            "category": c["category"],
            "level": c["level"],
            "language": c["language"],
            "estimated_hours": c["estimated_hours"],
            "price_type": "free",
            "price": 0.0,
            "learning_outcomes": c["learning_outcomes"],
            "prerequisites": c["prerequisites"],
            "status": "published",
            "instructor_id": c["instructor_id"],
            "rating_avg": c["rating_avg"],
            "enrollment_count": c["enrollment_count"],
            "created_at": NOW,
            "updated_at": NOW,
        }
        _set("courses", c["id"], doc)


# ═══════════════════════════════════════════════════════════════════════
# 4. Modules & 5. Lessons
# ═══════════════════════════════════════════════════════════════════════

COURSE_MODULES = {
    "structured-programming-c": [
        {
            "id": "c-mod-1",
            "title": "Introduction to Programming",
            "description": "Understand what programming is, set up your development environment, and write your first C program.",
            "order": 1,
            "lessons": [
                {"id": "c-mod-1-les-1", "title": "What is Programming?", "content": "An overview of programming paradigms, the role of compilers and interpreters, and why C is still relevant today.", "duration_minutes": 15},
                {"id": "c-mod-1-les-2", "title": "Setting Up Your Environment", "content": "Installing GCC, choosing a text editor or IDE, and compiling your first 'Hello, World!' program.", "duration_minutes": 20},
                {"id": "c-mod-1-les-3", "title": "Basic Syntax and Structure", "content": "Understanding C program structure, header files, the main() function, and basic I/O with printf and scanf.", "duration_minutes": 25},
            ],
        },
        {
            "id": "c-mod-2",
            "title": "Control Structures",
            "description": "Learn how to control program flow with conditional statements and loops.",
            "order": 2,
            "lessons": [
                {"id": "c-mod-2-les-1", "title": "Conditional Statements", "content": "Using if, else-if, else and switch-case to make decisions in your programs.", "duration_minutes": 20},
                {"id": "c-mod-2-les-2", "title": "Loops in C", "content": "Master for, while, and do-while loops with practical examples including nested loops.", "duration_minutes": 25},
                {"id": "c-mod-2-les-3", "title": "Break, Continue, and Goto", "content": "Loop control statements and when (not) to use goto for flow control.", "duration_minutes": 15},
            ],
        },
        {
            "id": "c-mod-3",
            "title": "Functions and Arrays",
            "description": "Write reusable code with functions and manage collections of data with arrays.",
            "order": 3,
            "lessons": [
                {"id": "c-mod-3-les-1", "title": "Defining and Calling Functions", "content": "Function declaration, definition, parameters, return values, and scope rules.", "duration_minutes": 25},
                {"id": "c-mod-3-les-2", "title": "Arrays and Strings", "content": "Working with one-dimensional and two-dimensional arrays, string handling with standard library functions.", "duration_minutes": 30},
                {"id": "c-mod-3-les-3", "title": "Passing Arrays to Functions", "content": "How arrays are passed to functions and practical sorting and searching examples.", "duration_minutes": 20},
            ],
        },
        {
            "id": "c-mod-4",
            "title": "Advanced Topics",
            "description": "Dive into pointers, dynamic memory allocation, structures, and file I/O.",
            "order": 4,
            "lessons": [
                {"id": "c-mod-4-les-1", "title": "Pointers and Memory", "content": "Understanding memory addresses, pointer arithmetic, and the relationship between pointers and arrays.", "duration_minutes": 30},
                {"id": "c-mod-4-les-2", "title": "Structures and Unions", "content": "Grouping related data with structs, creating typedef aliases, and using unions for memory-efficient designs.", "duration_minutes": 25},
                {"id": "c-mod-4-les-3", "title": "File Input and Output", "content": "Reading from and writing to text and binary files using fopen, fread, fwrite, and fclose.", "duration_minutes": 25},
            ],
        },
    ],
    "intro-educational-technology": [
        {
            "id": "edtech-mod-1",
            "title": "Foundations of Educational Technology",
            "description": "Explore the history, theories, and frameworks that underpin educational technology.",
            "order": 1,
            "lessons": [
                {"id": "edtech-mod-1-les-1", "title": "What is Educational Technology?", "content": "Definitions, historical evolution, and the role of technology in modern education.", "duration_minutes": 15},
                {"id": "edtech-mod-1-les-2", "title": "Learning Theories and Technology", "content": "How behaviorism, cognitivism, constructivism, and connectivism inform technology integration.", "duration_minutes": 20},
                {"id": "edtech-mod-1-les-3", "title": "The SAMR and TPACK Models", "content": "Frameworks for evaluating and guiding technology adoption in the classroom.", "duration_minutes": 20},
            ],
        },
        {
            "id": "edtech-mod-2",
            "title": "Digital Tools for the Classroom",
            "description": "Survey of popular digital tools for content creation, collaboration, and assessment.",
            "order": 2,
            "lessons": [
                {"id": "edtech-mod-2-les-1", "title": "Learning Management Systems", "content": "Comparing Moodle, Canvas, Google Classroom, and Blackboard for course management.", "duration_minutes": 25},
                {"id": "edtech-mod-2-les-2", "title": "Multimedia Content Creation", "content": "Creating engaging video, interactive presentations, and screencasts with free tools.", "duration_minutes": 30},
                {"id": "edtech-mod-2-les-3", "title": "Collaboration and Communication Tools", "content": "Using forums, wikis, video conferencing, and shared documents to foster collaboration.", "duration_minutes": 20},
            ],
        },
        {
            "id": "edtech-mod-3",
            "title": "Online Pedagogy",
            "description": "Strategies for teaching effectively in online and blended environments.",
            "order": 3,
            "lessons": [
                {"id": "edtech-mod-3-les-1", "title": "Synchronous vs Asynchronous Learning", "content": "When to use live sessions vs self-paced activities and how to balance both.", "duration_minutes": 20},
                {"id": "edtech-mod-3-les-2", "title": "Building Community Online", "content": "Techniques for fostering presence, engagement, and a sense of belonging in virtual classrooms.", "duration_minutes": 20},
                {"id": "edtech-mod-3-les-3", "title": "Universal Design for Learning", "content": "Applying UDL principles to create inclusive digital learning experiences.", "duration_minutes": 25},
            ],
        },
        {
            "id": "edtech-mod-4",
            "title": "Assessment and Analytics",
            "description": "Design effective online assessments and leverage data to improve instruction.",
            "order": 4,
            "lessons": [
                {"id": "edtech-mod-4-les-1", "title": "Designing Online Assessments", "content": "Best practices for quizzes, assignments, rubrics, and peer assessment in digital environments.", "duration_minutes": 25},
                {"id": "edtech-mod-4-les-2", "title": "Learning Analytics", "content": "Using data from LMS and other tools to track progress, identify at-risk students, and personalize learning.", "duration_minutes": 20},
                {"id": "edtech-mod-4-les-3", "title": "Ethics and Privacy in EdTech", "content": "Student data privacy, FERPA compliance, and ethical considerations in educational technology.", "duration_minutes": 20},
            ],
        },
    ],
    "python-for-beginners": [
        {
            "id": "py-mod-1",
            "title": "Getting Started with Python",
            "description": "Install Python, set up your development environment, and learn the basics.",
            "order": 1,
            "lessons": [
                {"id": "py-mod-1-les-1", "title": "Installing Python and VS Code", "content": "Downloading Python, setting up VS Code with extensions, and running your first script.", "duration_minutes": 15},
                {"id": "py-mod-1-les-2", "title": "Variables and Data Types", "content": "Numbers, strings, booleans, type conversion, and dynamic typing in Python.", "duration_minutes": 20},
                {"id": "py-mod-1-les-3", "title": "Operators and Expressions", "content": "Arithmetic, comparison, logical, and assignment operators with practical examples.", "duration_minutes": 20},
            ],
        },
        {
            "id": "py-mod-2",
            "title": "Control Flow and Collections",
            "description": "Master conditional logic, loops, and Python's built-in collection types.",
            "order": 2,
            "lessons": [
                {"id": "py-mod-2-les-1", "title": "Conditionals and Loops", "content": "if-elif-else, for loops, while loops, and list comprehensions.", "duration_minutes": 25},
                {"id": "py-mod-2-les-2", "title": "Lists, Tuples, and Dictionaries", "content": "Creating, accessing, and manipulating Python's core data structures.", "duration_minutes": 25},
                {"id": "py-mod-2-les-3", "title": "Sets and Strings", "content": "Set operations and powerful string methods for text processing.", "duration_minutes": 20},
            ],
        },
        {
            "id": "py-mod-3",
            "title": "Functions and Modules",
            "description": "Write reusable code and organize your projects with modules and packages.",
            "order": 3,
            "lessons": [
                {"id": "py-mod-3-les-1", "title": "Defining Functions", "content": "Parameters, return values, default arguments, keyword arguments, and lambda functions.", "duration_minutes": 25},
                {"id": "py-mod-3-les-2", "title": "Working with Modules", "content": "Importing standard library modules, creating your own modules, and using __name__.", "duration_minutes": 20},
                {"id": "py-mod-3-les-3", "title": "File Handling and Exceptions", "content": "Reading and writing files, using context managers, and handling exceptions gracefully.", "duration_minutes": 25},
            ],
        },
        {
            "id": "py-mod-4",
            "title": "Object-Oriented Programming",
            "description": "Model real-world entities with classes, inheritance, and polymorphism.",
            "order": 4,
            "lessons": [
                {"id": "py-mod-4-les-1", "title": "Classes and Objects", "content": "Defining classes, creating instances, initializers, and instance vs class attributes.", "duration_minutes": 25},
                {"id": "py-mod-4-les-2", "title": "Inheritance and Polymorphism", "content": "Extending classes, method overriding, super() calls, and duck typing.", "duration_minutes": 25},
                {"id": "py-mod-4-les-3", "title": "Magic Methods and Properties", "content": "Customizing behavior with dunder methods and using @property decorators.", "duration_minutes": 20},
            ],
        },
    ],
    "web-development-react": [
        {
            "id": "react-mod-1",
            "title": "React Fundamentals",
            "description": "Understand the core concepts of React: components, JSX, and props.",
            "order": 1,
            "lessons": [
                {"id": "react-mod-1-les-1", "title": "What is React?", "content": "The virtual DOM, declarative UI, and why React dominates frontend development.", "duration_minutes": 15},
                {"id": "react-mod-1-les-2", "title": "JSX and Components", "content": "Writing JSX syntax, creating functional components, and composing components together.", "duration_minutes": 25},
                {"id": "react-mod-1-les-3", "title": "Props and Conditional Rendering", "content": "Passing data via props, children prop, and rendering conditionally with ternary and &&.", "duration_minutes": 20},
            ],
        },
        {
            "id": "react-mod-2",
            "title": "State and Events",
            "description": "Manage dynamic data and respond to user interactions.",
            "order": 2,
            "lessons": [
                {"id": "react-mod-2-les-1", "title": "useState Hook", "content": "Adding state to functional components, updating state, and understanding re-renders.", "duration_minutes": 25},
                {"id": "react-mod-2-les-2", "title": "Handling Events and Forms", "content": "Event handlers, form inputs, controlled components, and form validation patterns.", "duration_minutes": 30},
                {"id": "react-mod-2-les-3", "title": "Lifting State Up", "content": "Sharing state between components by lifting it to a common ancestor.", "duration_minutes": 20},
            ],
        },
        {
            "id": "react-mod-3",
            "title": "Hooks and Side Effects",
            "description": "Master React hooks for side effects, context, and performance.",
            "order": 3,
            "lessons": [
                {"id": "react-mod-3-les-1", "title": "useEffect Hook", "content": "Running side effects, dependency arrays, cleanup functions, and data fetching patterns.", "duration_minutes": 25},
                {"id": "react-mod-3-les-2", "title": "useContext and useReducer", "content": "Global state with Context API and complex state logic with useReducer.", "duration_minutes": 30},
                {"id": "react-mod-3-les-3", "title": "Custom Hooks", "content": "Extracting reusable logic into custom hooks for cleaner, more composable code.", "duration_minutes": 20},
            ],
        },
        {
            "id": "react-mod-4",
            "title": "Routing and API Integration",
            "description": "Build multi-page experiences and connect to backend services.",
            "order": 4,
            "lessons": [
                {"id": "react-mod-4-les-1", "title": "React Router", "content": "Setting up routes, navigation, dynamic parameters, and nested layouts.", "duration_minutes": 25},
                {"id": "react-mod-4-les-2", "title": "Fetching Data from APIs", "content": "Using fetch and axios, handling loading/error states, and displaying data.", "duration_minutes": 25},
                {"id": "react-mod-4-les-3", "title": "Performance Optimization", "content": "React.memo, useMemo, useCallback, code splitting with lazy, and Suspense.", "duration_minutes": 25},
            ],
        },
    ],
    "digital-pedagogy-online-learning": [
        {
            "id": "dp-mod-1",
            "title": "Foundations of Digital Pedagogy",
            "description": "Explore theoretical frameworks for teaching in the digital age.",
            "order": 1,
            "lessons": [
                {"id": "dp-mod-1-les-1", "title": "What is Digital Pedagogy?", "content": "Defining digital pedagogy and distinguishing it from traditional pedagogy.", "duration_minutes": 15},
                {"id": "dp-mod-1-les-2", "title": "Constructivism in Digital Spaces", "content": "How constructivist learning theory applies to online and blended environments.", "duration_minutes": 20},
                {"id": "dp-mod-1-les-3", "title": "Connectivism and Networked Learning", "content": "Learning in the digital age through networks, communities, and connected resources.", "duration_minutes": 20},
            ],
        },
        {
            "id": "dp-mod-2",
            "title": "Designing Online Courses",
            "description": "Systematic approaches to designing effective online learning experiences.",
            "order": 2,
            "lessons": [
                {"id": "dp-mod-2-les-1", "title": "Backward Design for Online Courses", "content": "Starting with desired outcomes, then assessments, then learning activities.", "duration_minutes": 25},
                {"id": "dp-mod-2-les-2", "title": "Blended Learning Models", "content": "Station rotation, flipped classroom, flex model, and how to choose the right blend.", "duration_minutes": 25},
                {"id": "dp-mod-2-les-3", "title": "Creating Engaging Multimedia Content", "content": "Design principles for video lectures, interactive simulations, and digital readings.", "duration_minutes": 20},
            ],
        },
        {
            "id": "dp-mod-3",
            "title": "Facilitation and Community",
            "description": "Build and sustain learning communities in online environments.",
            "order": 3,
            "lessons": [
                {"id": "dp-mod-3-les-1", "title": "The Instructor's Role Online", "content": "Shifting from sage on the stage to guide on the side: facilitation strategies.", "duration_minutes": 20},
                {"id": "dp-mod-3-les-2", "title": "Fostering Online Discussions", "content": "Designing meaningful discussion prompts, managing participation, and assessing contributions.", "duration_minutes": 25},
                {"id": "dp-mod-3-les-3", "title": "Group Work and Collaboration", "content": "Structuring effective group projects, peer feedback, and collaborative tools.", "duration_minutes": 20},
            ],
        },
        {
            "id": "dp-mod-4",
            "title": "Assessment and Quality Assurance",
            "description": "Design assessments that promote learning and ensure quality in online education.",
            "order": 4,
            "lessons": [
                {"id": "dp-mod-4-les-1", "title": "Authentic Online Assessment", "content": "Portfolios, project-based assessments, e-portfolios, and competency-based evaluation.", "duration_minutes": 25},
                {"id": "dp-mod-4-les-2", "title": "Using Learning Analytics", "content": "Interpreting LMS data to improve course design and support student success.", "duration_minutes": 20},
                {"id": "dp-mod-4-les-3", "title": "Quality Standards in Online Education", "content": "QM standards, OSCQR rubric, and continuous improvement processes.", "duration_minutes": 20},
            ],
        },
    ],
    "cybersecurity-fundamentals": [
        {
            "id": "sec-mod-1",
            "title": "Introduction to Cybersecurity",
            "description": "Understand the threat landscape and core security principles.",
            "order": 1,
            "lessons": [
                {"id": "sec-mod-1-les-1", "title": "What is Cybersecurity?", "content": "The CIA triad, security domains, and the importance of cybersecurity in modern organizations.", "duration_minutes": 15},
                {"id": "sec-mod-1-les-2", "title": "Common Threats and Attack Vectors", "content": "Malware, phishing, DoS attacks, man-in-the-middle, and zero-day exploits.", "duration_minutes": 25},
                {"id": "sec-mod-1-les-3", "title": "Basic Security Controls", "content": "Preventive, detective, and corrective controls: firewalls, IDS/IPS, and antivirus.", "duration_minutes": 20},
            ],
        },
        {
            "id": "sec-mod-2",
            "title": "Cryptography",
            "description": "Learn the art and science of securing information through encryption.",
            "order": 2,
            "lessons": [
                {"id": "sec-mod-2-les-1", "title": "Symmetric Encryption", "content": "AES, DES, and stream ciphers: how symmetric encryption works and when to use it.", "duration_minutes": 25},
                {"id": "sec-mod-2-les-2", "title": "Asymmetric Encryption and PKI", "content": "RSA, ECC, digital signatures, certificates, and public key infrastructure.", "duration_minutes": 30},
                {"id": "sec-mod-2-les-3", "title": "Hashing and Integrity", "content": "MD5, SHA family, HMAC, and using hashes for data integrity and password storage.", "duration_minutes": 20},
            ],
        },
        {
            "id": "sec-mod-3",
            "title": "Network Security",
            "description": "Protect network infrastructure from unauthorized access and attacks.",
            "order": 3,
            "lessons": [
                {"id": "sec-mod-3-les-1", "title": "Network Segmentation and Firewalls", "content": "DMZs, VLANs, ACLs, and firewall rule design for defense in depth.", "duration_minutes": 25},
                {"id": "sec-mod-3-les-2", "title": "Secure Protocols and VPNs", "content": "TLS/SSL, SSH, IPsec, and setting up secure remote access with VPNs.", "duration_minutes": 25},
                {"id": "sec-mod-3-les-3", "title": "Intrusion Detection and Prevention", "content": "Signature-based vs anomaly-based detection, SIEM, and security monitoring.", "duration_minutes": 20},
            ],
        },
        {
            "id": "sec-mod-4",
            "title": "Incident Response and Governance",
            "description": "Prepare for, respond to, and recover from security incidents.",
            "order": 4,
            "lessons": [
                {"id": "sec-mod-4-les-1", "title": "Incident Response Lifecycle", "content": "Preparation, detection, containment, eradication, recovery, and lessons learned.", "duration_minutes": 25},
                {"id": "sec-mod-4-les-2", "title": "Security Policies and Compliance", "content": "Developing security policies, GDPR, HIPAA, and PCI-DSS compliance basics.", "duration_minutes": 20},
                {"id": "sec-mod-4-les-3", "title": "Disaster Recovery and Business Continuity", "content": "Backup strategies, RTO/RPO, DR plans, and tabletop exercises.", "duration_minutes": 20},
            ],
        },
    ],
}

def seed_modules_and_lessons():
    logger.info("[modules & lessons]")
    for course_id, modules in COURSE_MODULES.items():
        if not _check("courses", course_id):
            logger.warning("  ⚠ Course %s not found, skipping its modules", course_id)
            continue
        for mod in modules:
            mod_doc = {
                "course_id": course_id,
                "title": mod["title"],
                "description": mod["description"],
                "order": mod["order"],
                "created_at": NOW,
            }
            if not _check("modules", mod["id"]):
                _set("modules", mod["id"], mod_doc)

            for les in mod["lessons"]:
                les_doc = {
                    "module_id": mod["id"],
                    "course_id": course_id,
                    "title": les["title"],
                    "content": les["content"],
                    "content_type": "text",
                    "duration_minutes": les["duration_minutes"],
                    "order": mod["lessons"].index(les) + 1,
                    "created_at": NOW,
                }
                if not _check("lessons", les["id"]):
                    _set("lessons", les["id"], les_doc)


# ═══════════════════════════════════════════════════════════════════════
# 6. Quizzes  &  7. Questions
# ═══════════════════════════════════════════════════════════════════════

COURSE_QUIZZES = {
    "structured-programming-c": {
        "id": "c-quiz",
        "title": "C Programming Fundamentals Quiz",
        "instructions": "Answer the following multiple-choice questions covering basic C programming concepts.",
        "passing_score": 60,
        "questions": [
            {"question": "Which of the following is a valid C variable name?", "options": ["2variable", "variable_two", "var-two", "var two"], "correct": 1},
            {"question": "What is the correct way to declare a pointer in C?", "options": ["int ptr;", "int *ptr;", "pointer int ptr;", "int ptr*;"], "correct": 1},
            {"question": "Which function is used to read a string from standard input in C?", "options": ["scanf()", "gets()", "fgets()", "All of the above"], "correct": 3},
            {"question": "What does the sizeof() operator return?", "options": ["Size of a variable in bits", "Size of a variable in bytes", "Address of a variable", "Value of a variable"], "correct": 1},
            {"question": "Which loop guarantees at least one execution?", "options": ["for loop", "while loop", "do-while loop", "None of the above"], "correct": 2},
        ],
    },
    "intro-educational-technology": {
        "id": "edtech-quiz",
        "title": "Educational Technology Basics Quiz",
        "instructions": "Test your understanding of key educational technology concepts and frameworks.",
        "passing_score": 60,
        "questions": [
            {"question": "What does LMS stand for?", "options": ["Learning Management System", "Library Management Software", "Lesson Module Structure", "Learning Media Standard"], "correct": 0},
            {"question": "Which framework categorizes technology integration into Substitution, Augmentation, Modification, and Redefinition?", "options": ["TPACK", "SAMR", "Bloom's Taxonomy", "ADDIE"], "correct": 1},
            {"question": "What is the primary benefit of asynchronous learning?", "options": ["Real-time interaction", "Flexibility in scheduling", "Lower internet bandwidth", "Automatic grading"], "correct": 1},
            {"question": "Which learning theory emphasizes learning through social interaction and collaboration?", "options": ["Behaviorism", "Cognitivism", "Constructivism", "Connectivism"], "correct": 2},
            {"question": "What does UDL stand for?", "options": ["Unified Digital Learning", "Universal Design for Learning", "User-Driven Learning", "Unified Development Lifecycle"], "correct": 1},
        ],
    },
    "python-for-beginners": {
        "id": "py-quiz",
        "title": "Python Basics Quiz",
        "instructions": "Test your knowledge of Python syntax, data types, and control flow.",
        "passing_score": 60,
        "questions": [
            {"question": "What is the output of print(type(3.14))?", "options": ["<class 'int'>", "<class 'float'>", "<class 'decimal'>", "<class 'double'>"], "correct": 1},
            {"question": "Which keyword is used to define a function in Python?", "options": ["func", "define", "def", "function"], "correct": 2},
            {"question": "What does len() return for a string?", "options": ["Memory size", "Number of characters", "Number of words", "Index of last character"], "correct": 1},
            {"question": "Which of the following creates a list in Python?", "options": ["list = {1, 2, 3}", "list = [1, 2, 3]", "list = (1, 2, 3)", "list = <1, 2, 3>"], "correct": 1},
            {"question": "What is the correct way to handle an exception in Python?", "options": ["try...catch", "try...except", "try...finally", "throw...catch"], "correct": 1},
        ],
    },
    "web-development-react": {
        "id": "react-quiz",
        "title": "React Fundamentals Quiz",
        "instructions": "Assess your understanding of React components, hooks, and state management.",
        "passing_score": 60,
        "questions": [
            {"question": "What is JSX?", "options": ["A JavaScript library", "A syntax extension for JavaScript", "A CSS framework", "A build tool"], "correct": 1},
            {"question": "Which hook is used to add state to a functional component?", "options": ["useEffect", "useState", "useContext", "useReducer"], "correct": 1},
            {"question": "What does the useEffect hook's dependency array control?", "options": ["When the component renders", "When the effect runs", "Which state variables are created", "How many times the effect runs per second"], "correct": 1},
            {"question": "How do you pass data from a parent to a child component?", "options": ["State", "Props", "Context", "Refs"], "correct": 1},
            {"question": "What is the virtual DOM?", "options": ["A direct copy of the browser DOM", "A lightweight JavaScript representation of the DOM", "A database for DOM elements", "A browser extension"], "correct": 1},
        ],
    },
    "digital-pedagogy-online-learning": {
        "id": "dp-quiz",
        "title": "Digital Pedagogy Quiz",
        "instructions": "Evaluate your knowledge of online teaching strategies and pedagogical frameworks.",
        "passing_score": 60,
        "questions": [
            {"question": "Which pedagogical approach emphasizes learning through experience and reflection?", "options": ["Behaviorism", "Experiential Learning", "Direct Instruction", "Programmed Learning"], "correct": 1},
            {"question": "What is a key characteristic of the flipped classroom model?", "options": ["All instruction happens in class", "Lectures are watched at home, practice happens in class", "Students learn entirely online", "No assessments are used"], "correct": 1},
            {"question": "What does 'synchronous learning' mean?", "options": ["Self-paced learning", "Real-time, live instruction", "Learning through textbooks", "Automated grading"], "correct": 1},
            {"question": "Which of the following is an example of formative assessment?", "options": ["Final exam", "Weekly quiz with feedback", "Capstone project", "Certification test"], "correct": 1},
            {"question": "What is a learning analytics dashboard used for?", "options": ["Creating course content", "Tracking student engagement and performance", "Grading assignments automatically", "Scheduling live sessions"], "correct": 1},
        ],
    },
    "cybersecurity-fundamentals": {
        "id": "sec-quiz",
        "title": "Cybersecurity Fundamentals Quiz",
        "instructions": "Test your grasp of core cybersecurity principles, threats, and defenses.",
        "passing_score": 60,
        "questions": [
            {"question": "What does CIA stand for in cybersecurity?", "options": ["Confidentiality, Integrity, Availability", "Control, Identification, Authentication", "Cryptography, Internet, Access", "Central Intelligence Agency"], "correct": 0},
            {"question": "Which type of attack tricks users into revealing sensitive information?", "options": ["Brute force", "Phishing", "Man-in-the-middle", "Denial of Service"], "correct": 1},
            {"question": "What is the primary purpose of encryption?", "options": ["Speed up data transfer", "Protect data confidentiality", "Reduce file size", "Organize data"], "correct": 1},
            {"question": "Which protocol provides secure web communication?", "options": ["HTTP", "FTP", "HTTPS", "SMTP"], "correct": 2},
            {"question": "What is the first phase of the incident response lifecycle?", "options": ["Detection", "Containment", "Preparation", "Recovery"], "correct": 2},
        ],
    },
}

def seed_quizzes_and_questions():
    logger.info("[quizzes & questions]")
    for course_id, quiz_data in COURSE_QUIZZES.items():
        quiz_id = quiz_data["id"]

        # Quiz document
        if not _check("quizzes", quiz_id):
            _set("quizzes", quiz_id, {
                "title": quiz_data["title"],
                "course_id": course_id,
                "instructions": quiz_data["instructions"],
                "passing_score": quiz_data["passing_score"],
                "created_at": NOW,
                "updated_at": NOW,
            })

        # Questions (as subcollection within quiz / or separate collection)
        for idx, q in enumerate(quiz_data["questions"]):
            qid = f"{quiz_id}-q-{idx + 1}"
            if not _check("questions", qid):
                _set("questions", qid, {
                    "quiz_id": quiz_id,
                    "course_id": course_id,
                    "question_text": q["question"],
                    "options": q["options"],
                    "correct_answer": q["correct"],
                    "order": idx + 1,
                })


# ═══════════════════════════════════════════════════════════════════════
# 8. Assignments
# ═══════════════════════════════════════════════════════════════════════

COURSE_ASSIGNMENTS = [
    {
        "id": "c-assign-1",
        "course_id": "structured-programming-c",
        "title": "Student Record Management System",
        "instructions": (
            "Write a C program that manages student records using structures. "
            "Your program should:\n"
            "1. Define a Student structure with name, roll number, and marks in 3 subjects.\n"
            "2. Allow the user to add, display, search, and delete records.\n"
            "3. Calculate and display the average marks and grade for each student.\n"
            "4. Save all records to a file and load them on program startup.\n\n"
            "Submit your .c source file along with a brief README explaining your design."
        ),
        "total_marks": 100,
        "due_date_days": 14,
    },
    {
        "id": "edtech-assign-1",
        "course_id": "intro-educational-technology",
        "title": "EdTech Tool Evaluation Report",
        "instructions": (
            "Select three educational technology tools from the following categories: "
            "LMS, quiz platform, and video creation tool.\n\n"
            "For each tool:\n"
            "1. Describe its primary features and pricing model.\n"
            "2. Evaluate its strengths and weaknesses for classroom use.\n"
            "3. Rate it on a 5-point scale for: ease of use, engagement, accessibility, and assessment support.\n\n"
            "Submit a PDF report (max 1500 words) with your findings and recommendations."
        ),
        "total_marks": 100,
        "due_date_days": 10,
    },
    {
        "id": "py-assign-1",
        "course_id": "python-for-beginners",
        "title": "Personal Expense Tracker",
        "instructions": (
            "Build a command-line expense tracker in Python.\n\n"
            "Requirements:\n"
            "1. Add, edit, delete, and view expenses with categories and dates.\n"
            "2. Store data in a JSON file for persistence.\n"
            "3. Show monthly and category-wise summaries.\n"
            "4. Export the summary as a CSV file.\n"
            "5. Include error handling for file operations and invalid input.\n\n"
            "Submit your .py file(s) with a requirements.txt if using any external libraries."
        ),
        "total_marks": 100,
        "due_date_days": 14,
    },
    {
        "id": "react-assign-1",
        "course_id": "web-development-react",
        "title": "Task Management Dashboard",
        "instructions": (
            "Create a task management single-page application using React.\n\n"
            "Features required:\n"
            "1. Add, edit, delete, and mark tasks as complete.\n"
            "2. Filter tasks by status (all, active, completed).\n"
            "3. Search tasks by title.\n"
            "4. Use React Router for navigation (Home, About, Dashboard views).\n"
            "5. Use localStorage or Context API for state persistence.\n"
            "6. Style with Tailwind CSS or a CSS framework of your choice.\n\n"
            "Submit your project source code (zipped) with setup instructions."
        ),
        "total_marks": 100,
        "due_date_days": 21,
    },
    {
        "id": "dp-assign-1",
        "course_id": "digital-pedagogy-online-learning",
        "title": "Online Course Blueprint Design",
        "instructions": (
            "Design a blueprint for a 6-week online course on a topic of your choice.\n\n"
            "Your submission should include:\n"
            "1. Course description, learning outcomes, and target audience.\n"
            "2. Week-by-week outline with topics, activities, and assessments.\n"
            "3. Description of the technology tools you will use.\n"
            "4. A rubric for the final project assessment.\n"
            "5. A justification of your pedagogical approach with references.\n\n"
            "Submit as a PDF document (max 2000 words)."
        ),
        "total_marks": 100,
        "due_date_days": 14,
    },
    {
        "id": "sec-assign-1",
        "course_id": "cybersecurity-fundamentals",
        "title": "Security Audit and Risk Assessment",
        "instructions": (
            "Conduct a security audit of a small organization (real or fictional).\n\n"
            "Your report should include:\n"
            "1. Asset identification and classification.\n"
            "2. Threat modeling using STRIDE or PASTA methodology.\n"
            "3. Risk assessment matrix (likelihood × impact).\n"
            "4. Recommended security controls with justification.\n"
            "5. Incident response plan outline.\n\n"
            "Submit your findings as a PDF report (max 2000 words)."
        ),
        "total_marks": 100,
        "due_date_days": 14,
    },
]

def seed_assignments():
    logger.info("[assignments]")
    from datetime import timedelta
    for a in COURSE_ASSIGNMENTS:
        if _check("assignments", a["id"]):
            logger.info("  ∼ %s exists, skipped", a["id"])
            continue
        due = NOW + timedelta(days=a["due_date_days"])
        _set("assignments", a["id"], {
            "title": a["title"],
            "course_id": a["course_id"],
            "instructions": a["instructions"],
            "due_date": due,
            "total_marks": a["total_marks"],
            "created_at": NOW,
            "updated_at": NOW,
        })


# ═══════════════════════════════════════════════════════════════════════
# 9. Announcements
# ═══════════════════════════════════════════════════════════════════════

ANNOUNCEMENTS = [
    {
        "id": "announce-welcome",
        "author": "admin-demo-uid",
        "title": "Welcome to EduBridge MOOC Platform!",
        "content": (
            "We are thrilled to welcome you to EduBridge — your gateway to world-class online education. "
            "Explore our curated courses, track your progress, and earn certificates. "
            "If you have any questions, check the FAQs or contact our support team."
        ),
    },
    {
        "id": "announce-new-courses",
        "author": "admin-demo-uid",
        "title": "New Courses Available This Semester",
        "content": (
            "We have added several new courses including 'Cybersecurity Fundamentals', "
            "'Web Development with React', and 'Digital Pedagogy and Online Learning'. "
            "Enroll now and start learning at your own pace!"
        ),
    },
    {
        "id": "announce-maintenance",
        "author": "admin-demo-uid",
        "title": "Scheduled Platform Maintenance",
        "content": (
            "EduBridge will undergo scheduled maintenance on Saturday from 02:00 to 04:00 UTC. "
            "During this time, some features may be temporarily unavailable. "
            "We apologize for any inconvenience."
        ),
    },
]

def seed_announcements():
    logger.info("[announcements]")
    for a in ANNOUNCEMENTS:
        if _check("announcements", a["id"]):
            logger.info("  ∼ %s exists, skipped", a["id"])
            continue
        _set("announcements", a["id"], {
            "author_id": a["author"],
            "title": a["title"],
            "content": a["content"],
            "created_at": NOW,
            "updated_at": NOW,
        })


# ═══════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════

def seed_all():
    """Run all seed functions in dependency order."""
    logger.info("=" * 60)
    logger.info("EduBridge Firestore Seed Script")
    logger.info("=" * 60)

    # Ensure Firebase is initialized
    init_firebase()

    seed_categories()
    seed_users()
    seed_courses()
    seed_modules_and_lessons()
    seed_quizzes_and_questions()
    seed_assignments()
    seed_announcements()

    logger.info("=" * 60)
    logger.info("Seeding complete!")
    logger.info("=" * 60)
    logger.info("")
    logger.info("Demo accounts (Firebase Auth email/password):")
    logger.info("  student@example.com     / password123  (role: student)")
    logger.info("  instructor@example.com  / password123  (role: instructor)")
    logger.info("  admin@example.com       / password123  (role: admin)")
    logger.info("")
    logger.info("You can log in via POST /api/auth/session after Firebase Auth sign-in.")


if __name__ == "__main__":
    seed_all()
