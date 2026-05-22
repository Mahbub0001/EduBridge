# EduBridge MOOC Platform

Full-stack MOOC platform with React frontend and FastAPI backend, powered by Firebase.

## Prerequisites

- Python 3.10+
- Node.js 20+
- Firebase project with Authentication and Firestore enabled

## Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and configure:

```
FIREBASE_SERVICE_ACCOUNT_PATH=../mooc-blended-firebase-adminsdk-fbsvc-1bf71dac6e.json
FRONTEND_URL=http://localhost:5173,http://localhost:3000
ENVIRONMENT=development
```

### Frontend

```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env` and fill in Firebase Web App config values from Firebase Console.

## Running

### Backend

```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm run dev
```

## Seeding Firestore with Demo Data

Populate Firestore with categories, users, courses, modules, lessons, quizzes, questions, assignments, and announcements:

```bash
cd backend
python -m app.scripts.seed_firestore
```

The seed script:
- Creates **3 demo users** in Firebase Auth + Firestore:
  - `student@example.com` / `password123` (role: student)
  - `instructor@example.com` / `password123` (role: instructor)
  - `admin@example.com` / `password123` (role: admin)
- Seeds **6 courses** with modules, lessons, quizzes, and assignments
- Is **idempotent** — safe to re-run without duplicating data
- Uses the **Firebase Admin SDK** via `FIREBASE_SERVICE_ACCOUNT_PATH` from `.env`

## API Documentation

Once the backend is running, visit [http://localhost:8000/docs](http://localhost:8000/docs) for Swagger UI.
