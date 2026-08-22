# DayFlow AI — Intelligent Human Resource Management System

DayFlow AI is an enterprise-grade, full-stack Human Resource Management System (HRMS) built with React 18, TypeScript, FastAPI, PostgreSQL, and Google Gemini AI. The application provides role-based access for employees and HR administrators to manage attendance, leave workflows, payroll calculations, notifications, and AI-driven policy insights.

---

## Technical Stack

- Frontend: React 18, TypeScript, Vite 8.x, Tailwind CSS, Lucide Icons, React Router v6
- Backend: Python 3.10+, FastAPI, AsyncSQLAlchemy 2.0, Pydantic v2, Pytest, Uvicorn
- Database: PostgreSQL (asyncpg) / SQLite (aiosqlite dev)
- Authentication: Passlib (Bcrypt), PyJWT (HS256 JWT tokens), Email Verification Enforcer
- Artificial Intelligence: Google Gemini API (`gemini-3.7-flash`), Retrieval-Augmented Generation (RAG)

---

## Core System Features

### 1. Authentication and Access Control
- Role-Based Access Control (RBAC): Strict segregation between `EMPLOYEE` and `ADMIN`/`HR` roles.
- Password Policy Checklist: Enforces 8+ characters, uppercase, numeric, and special character requirements.
- Strict Email Verification: Blocks unverified accounts from logging in until email verification is confirmed in the database.

### 2. Employee Self-Service Portal
- Shift Attendance Clock-In / Clock-Out: One-click daily attendance recording with automated duration calculations.
- Time-Off Management & Simulator: What-If leave balance simulator to preview deductions prior to submission.
- Read-Only Payroll Paystubs: View structured salary breakdowns (Base, HRA, Allowances, Deductions, Net Salary) with printable corporate paystubs.
- Notification Center: In-app system alerts for account registration and approval updates.

### 3. Executive Admin and HR Command Center
- Workforce Overview: Global analytics cards displaying total headcount, present employees, pending leave requests, and payroll liabilities.
- Global Leave Queue: Approve or reject leave applications with atomic database transactions and required reviewer feedback.
- Attendance History: Monitor daily and weekly attendance records across all corporate departments.
- Payroll Management: Admin controls to update salary structures and verify net payout accuracy.

### 4. Grounded Gemini AI Assistant
- Policy RAG Queries: Context-aware prompt engine answering queries from official HR handbooks without hallucination.
- Paystub & Leave Explainability: Translates personal compensation and leave records into natural language summaries.
- Executive Summaries: Generates executive workforce metrics for management decision-making.

---

## System Architecture

```
                      +----------------------------------+
                      |         React Frontend           |
                      |   (TypeScript / Vite App)        |
                      +----------------------------------+
                                       |
                                       | HTTP / REST API (JSON)
                                       v
                      +----------------------------------+
                      |          FastAPI Server          |
                      |    (Async Request Pipeline)      |
                      +----------------------------------+
                           /           |            \
                          /            |             \
                         v             v              v
        +-------------------+  +---------------+  +------------------+
        |  PostgreSQL / DB  |  |  JWT Security |  | Google Gemini AI |
        |  (AsyncSQLAlchemy)|  | (RBAC Middleware)| (Policy RAG)     |
        +-------------------+  +---------------+  +------------------+
```

---

## Quickstart Setup Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn package manager

### 1. Backend Setup

1. Create a Python virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env` and populate necessary configuration values:
   ```env
   APP_NAME="Dayflow AI"
   APP_ENV="development"
   DEBUG=True
   API_V1_PREFIX="/api/v1"
   SUPABASE_DB_URL="sqlite+aiosqlite:///./dayflow.db"
   GEMINI_API_KEY="your-gemini-api-key"
   GEMINI_MODEL="gemini-3.7-flash"
   CORS_ORIGINS="http://localhost:5173"
   ```

4. Initialize Seed Data:
   ```bash
   python app/seed.py
   ```

5. Start Backend Server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

### 2. Frontend Setup

1. Navigate to frontend directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start Development Server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Demo Accounts

| Role | Email | Password | Employee ID |
|---|---|---|---|
| Admin / HR | `admin@dayflow.ai` | `AdminPass123!` | `EMP-1001` |
| Employee | `employee@dayflow.ai` | `EmpPass123!` | `EMP-1002` |

---

## Testing and Verification

Run the automated Pytest test suite:
```bash
python -m pytest tests/ -v
```

Build production frontend bundle:
```bash
cd frontend
npm run build
```

---

## SRS Requirement Compliance Matrix

| Section | SRS Requirement | Implementation Details | Status |
|---|---|---|---|
| 3.1.1 | Sign Up | Employee ID, Email, Password Policy, Role Scoping, Email Verification | Complete |
| 3.1.2 | Sign In | Credential Authentication, Inline Error Handling, Dashboard Redirection | Complete |
| 3.2.1 | Employee Dashboard | KPI Cards (Profile, Attendance, Leave), Notifications Feed | Complete |
| 3.2.2 | Admin Dashboard | Roster Overview, Attendance History, Pending Leave Queue | Complete |
| 3.3.1 | View Profile | Personal Details, Job Details, Salary Breakdown, Profile Data | Complete |
| 3.3.2 | Edit Profile | Employee Self-Editing (Phone, Address); Admin Full Editing | Complete |
| 3.4.1 | Attendance Tracking | Check-In/Out Buttons, Daily/Weekly Views, Status Tagging | Complete |
| 3.4.2 | Attendance View | Role-Gated Attendance Access (Self vs Global) | Complete |
| 3.5.1 | Apply for Leave | Leave Types (Paid, Sick, Unpaid), Date Range, Request Statuses | Complete |
| 3.5.2 | Leave Approvals | Global Queue, Row-Locking Balance Deduction, Rejection Comments | Complete |
| 3.6.1 | Employee Payroll | Read-Only Paystub Access, Corporate Salary Slip Generation | Complete |
| 3.6.2 | Admin Payroll Control | Global Salary Structure Editor, Net Salary Calculation | Complete |
| Sec 6 | Future Enhancements | Real-Time Notifications, Analytics Dashboard, Grounded Gemini AI | Complete |

---

## Documentation

Comprehensive end-to-end technical documentation, database schemas, sequence flows, and API reference contracts are available in [DOCUMENTATION.md](file:///DOCUMENTATION.md).

---

## License

This project is released under the [MIT License](file:///LICENSE).
