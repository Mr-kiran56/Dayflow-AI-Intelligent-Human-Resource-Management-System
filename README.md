# Dayflow AI — Backend API

> **Subtitle**: Intelligent Human Resource Management System  
> **Tagline**: Every workday, perfectly aligned.

Production-quality, secure, clean-architecture backend for **Dayflow AI**, built using FastAPI, Supabase PostgreSQL, Supabase Auth, SQLAlchemy 2.0 (asyncpg), Alembic, and Google Gemini API (`google-genai`).

---

## 🛠️ Technology Stack

- **Framework**: Python 3.10+ / 3.12, FastAPI, Uvicorn
- **Validation & Settings**: Pydantic v2, `pydantic-settings`
- **Database**: Supabase PostgreSQL (or SQLite `aiosqlite` for local dev/testing)
- **ORM & Async DB**: SQLAlchemy 2.0, `asyncpg`, `aiosqlite`
- **Migrations**: Alembic
- **Auth**: Supabase Auth (JWT bearer token issuance and verification)
- **RBAC**: Application-level role-based authorization (`ADMIN`, `HR`, `EMPLOYEE`)
- **AI**: Google Gemini API via official SDK (`google-genai`, model: `gemini-3.7-flash`)
- **Testing**: Pytest, `pytest-asyncio`, `httpx`

---

## 📂 Project Architecture

```text
backend/
├── app/
│   ├── main.py                   # Main FastAPI application entrypoint & middleware
│   ├── core/
│   │   ├── config.py             # Pydantic settings management
│   │   ├── security.py           # JWT token encoding/decoding & verification
│   │   ├── exceptions.py         # Standardized application exception hierarchy
│   │   └── dependencies.py       # Auth & RBAC FastAPI dependencies
│   ├── db/
│   │   ├── base.py               # Metadata registry for Alembic
│   │   ├── base_class.py         # Declarative Base
│   │   ├── session.py            # Async engine and session factory
│   │   ├── enums.py              # Role, AttendanceStatus, LeaveStatus, ComponentType
│   │   └── models/               # SQLAlchemy 2.0 models
│   │       ├── profile.py
│   │       ├── department.py
│   │       ├── attendance.py
│   │       ├── leave.py
│   │       ├── payroll.py
│   │       ├── notification.py
│   │       └── audit.py
│   ├── schemas/                  # Pydantic request/response schemas
│   │   ├── auth.py
│   │   ├── profile.py
│   │   ├── attendance.py
│   │   ├── leave.py
│   │   ├── payroll.py
│   │   ├── notification.py
│   │   ├── analytics.py
│   │   ├── search.py
│   │   └── ai.py
│   ├── api/
│   │   └── v1/                   # REST API Router endpoints
│   │       ├── auth.py
│   │       ├── profile.py
│   │       ├── employees.py
│   │       ├── attendance.py
│   │       ├── leave.py
│   │       ├── payroll.py
│   │       ├── notifications.py
│   │       ├── analytics.py
│   │       ├── search.py
│   │       └── ai.py
│   ├── services/                 # Core business services & transactions
│   │   ├── auth_service.py
│   │   ├── employee_service.py
│   │   ├── attendance_service.py
│   │   ├── leave_service.py
│   │   ├── payroll_service.py
│   │   ├── notification_service.py
│   │   ├── analytics_service.py
│   │   └── gemini_service.py
│   ├── utils/
│   │   └── response_formatter.py # Standardized success & error responses
│   └── seed.py                   # Initial demo data seeder
├── alembic/                      # Database migration scripts
│   ├── env.py
│   └── versions/
│       └── 001_initial_schema.py
├── tests/                        # Automated unit & integration tests
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_rbac.py
│   ├── test_attendance.py
│   ├── test_leave.py
│   ├── test_payroll.py
│   └── test_ai.py
├── .env.example
├── .env
├── alembic.ini
├── requirements.txt
└── README.md
```

---

## ⚡ Quick Start & Setup

### 1. Environment Setup

Create virtual environment and install dependencies:

```bash
python -m venv .venv

# On Windows (PowerShell):
.venv\Scripts\Activate.ps1

# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Environment Variables Configuration

Copy `.env.example` to `.env` and fill in your Supabase and Gemini credentials:

```env
APP_NAME=Dayflow AI
APP_ENV=development
DEBUG=true

API_V1_PREFIX=/api/v1

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

SUPABASE_DB_URL=postgresql+asyncpg://postgres:password@db.your-project.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.7-flash

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=INFO
```

### 3. Database Migration

Run Alembic migration to create tables, constraints, and indexes:

```bash
alembic upgrade head
```

### 4. Seed Demo Data

Run the database seed script:

```bash
python -m app.seed
```

This seeds:
- **Departments**: Engineering, Product, Design, Marketing, Human Resources
- **Leave Types**: Paid Leave (12d), Sick Leave (10d), Unpaid Leave (30d)
- **Employees**: Arjun Rao (ADMIN), Priya Sharma (HR), Rahul Mehta (EMPLOYEE), Sneha Reddy (EMPLOYEE), Ananya Iyer (EMPLOYEE), Vikram Singh (EMPLOYEE)
- **Records**: Attendance logs, Leave balances, Sample requests, Payroll statements, and System notifications.

### 5. Start Application Server

Launch Uvicorn server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **API Base URL**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 🧪 Running Automated Tests

Run the complete test suite:

```bash
pytest
```

Tests cover:
- Authentication & Bearer token validation
- Role-based authorization (`ADMIN`, `HR`, `EMPLOYEE`)
- Attendance check-in, duplicate prevention, duration calculation
- Leave submission, overlap detection, eligibility checking, atomic approval transaction & rejection
- Payroll precision calculation and access control
- Gemini AI context boundary isolation & service fallbacks

---

## 🔌 API Endpoints Summary

### Health Checks
- `GET /health` — Check process health
- `GET /ready` — Check database connectivity

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/signup` — User registration & profile creation
- `POST /api/v1/auth/login` — User authentication & JWT issuance
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Logout user session
- `GET /api/v1/auth/me` — Get current user profile
- `POST /api/v1/auth/forgot-password` — Password recovery request
- `POST /api/v1/auth/reset-password` — Password reset execution

### Profile & Employees (`/api/v1/profile`, `/api/v1/employees`)
- `GET /api/v1/profile/me` — View current employee profile
- `PATCH /api/v1/profile/me` — Update editable profile fields
- `GET /api/v1/employees` — List all employees (ADMIN/HR)
- `GET /api/v1/employees/{employee_id}` — View employee details
- `PATCH /api/v1/employees/{employee_id}` — Update employee details (ADMIN/HR)

### Attendance (`/api/v1/attendance`)
- `POST /api/v1/attendance/check-in` — Clock in for today
- `POST /api/v1/attendance/check-out` — Clock out and compute total work minutes
- `GET /api/v1/attendance/me` — Get my attendance history
- `GET /api/v1/attendance/me/daily` — Get today's attendance record
- `GET /api/v1/attendance/me/weekly` — Get weekly summary and work hours
- `GET /api/v1/admin/attendance` — View all attendance records (ADMIN/HR)
- `GET /api/v1/admin/attendance/{employee_id}` — View employee attendance history (ADMIN/HR)

### Leave Management (`/api/v1/leave`, `/api/v1/admin/leave`)
- `GET /api/v1/leave/types` — List available leave types
- `GET /api/v1/leave/balances` — View my remaining leave balances
- `POST /api/v1/leave/eligibility` — Check leave eligibility deterministically
- `POST /api/v1/leave/requests` — Submit a leave request
- `GET /api/v1/leave/requests` — View my submitted leave requests
- `GET /api/v1/leave/requests/{request_id}` — View leave request detail
- `DELETE /api/v1/leave/requests/{request_id}` — Cancel a pending leave request
- `GET /api/v1/admin/leave/requests` — List leave requests across organization (ADMIN/HR)
- `POST /api/v1/admin/leave/{request_id}/approve` — **Atomic** approval (updates balance, sends notification, logs audit)
- `POST /api/v1/admin/leave/{request_id}/reject` — Reject leave request with mandatory comment

### Payroll (`/api/v1/payroll`, `/api/v1/admin/payroll`)
- `GET /api/v1/payroll/me` — View current month paystub
- `GET /api/v1/payroll/me/history` — View paystub history
- `GET /api/v1/payroll/me/{payroll_id}` — View specific paystub detail
- `GET /api/v1/admin/payroll` — View all payroll records (ADMIN/HR)
- `GET /api/v1/admin/payroll/{employee_id}` — View employee payroll history (ADMIN/HR)
- `POST /api/v1/admin/payroll` — Create payroll record (ADMIN/HR)
- `PATCH /api/v1/admin/payroll/{payroll_id}` — Update payroll record (ADMIN/HR)

### Notifications & Search (`/api/v1/notifications`, `/api/v1/search`)
- `GET /api/v1/notifications` — View recipient notifications
- `GET /api/v1/notifications/unread-count` — Count unread notifications
- `POST /api/v1/notifications/{id}/read` — Mark notification read
- `POST /api/v1/notifications/read-all` — Mark all notifications read
- `GET /api/v1/search?q=` — Role-scoped global search

### Analytics (`/api/v1/analytics`, `/api/v1/admin/analytics`)
- `GET /api/v1/analytics/me/attendance` — Employee attendance rate & hours
- `GET /api/v1/analytics/me/leave` — Employee leave consumption breakdown
- `GET /api/v1/admin/analytics/overview` — Executive organization overview
- `GET /api/v1/admin/analytics/attendance` — Organization attendance metrics
- `GET /api/v1/admin/analytics/leave` — Organization leave request metrics
- `GET /api/v1/admin/analytics/payroll` — Gross expenditure & net disbursed payroll metrics

### Gemini AI Assistant (`/api/v1/ai`)
- `POST /api/v1/ai/chat` — Context-aware AI assistant (scoped strictly to user authorization)
- `POST /api/v1/ai/attendance-insight` — AI natural language attendance pattern analysis
- `POST /api/v1/ai/leave-check` — AI leave eligibility explanation
- `POST /api/v1/ai/salary-explanation` — AI salary component breakdown explanation
- `POST /api/v1/admin/ai/workforce-summary` — Executive workforce insights for ADMIN/HR

---

## 🔒 Security & Data Privacy

1. **Database as Source of Truth**: Gemini API is used purely as an interpretation/explanation layer. Business logic and factual values (leave balances, net salary, attendance status) are computed deterministically by PostgreSQL and FastAPI.
2. **Data Scope Boundaries**: Employees can ONLY query AI and APIs with their own authorized records. Organizational data queries require `ADMIN` or `HR` role.
3. **Secret Protection**: API Keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are kept strictly server-side and never exposed to client applications.

---

## 🎨 Response Format Specification

### Success Response Format:
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response Format:
```json
{
  "success": false,
  "error": {
    "code": "LEAVE_INSUFFICIENT_BALANCE",
    "message": "Insufficient leave balance for requested leave type",
    "details": []
  }
}
```
