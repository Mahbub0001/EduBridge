# EduBridge MOOC Platform

Full-stack MOOC platform with React frontend and FastAPI backend, powered by Firebase.

## Prerequisites

- Python 3.10+
- Node.js 22.12+ (required by Vite 8)
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

## Production deployment

Render uses the `main` branch, root directory `backend`, build command
`pip install -r requirements.txt`, and start command
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Use `/health` as the health
check path. Set `ENVIRONMENT=production`, `FRONTEND_URL` to the Vercel origin,
and `FIREBASE_CREDENTIALS_JSON` to the Firebase service account JSON as a secret
environment variable; never commit that file.

Vercel uses the `main` branch and root directory `frontend`. Use Node.js 24.x,
`npm ci` to install dependencies, `npm run build` to build, and `dist` as output.
Configure all six `VITE_FIREBASE_*` variables used in
`frontend/src/services/firebase.ts` for both Production and Preview. Set
`VITE_API_BASE_URL=https://edubridge-iymd.onrender.com` for both environments.
Changing a Vite environment variable requires a new build and deployment.

Push committed changes to `main` to trigger both platforms. Local commits and
uncommitted edits do not update a deployment. The client checks Render's health
endpoint before API calls after inactivity, allowing up to two minutes for a
free instance to wake without repeating writes or logins.
