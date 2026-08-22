# DayFlow AI — Technical Architecture and System Engineering Documentation

## 1. System Overview

DayFlow AI is an enterprise-grade Human Resource Management System (HRMS) engineered to streamline core workforce operations including employee onboarding, role-based access control, automated shift attendance tracking, atomic leave management workflows, multi-structured payroll processing, and grounded artificial intelligence policy assistance.

The platform provides a dual-interface architecture:
- Employee Self-Service Portal: Allows employees to view personal profiles, execute shift clock-in/clock-out operations, simulate and apply for time-off, inspect read-only salary paystubs, and query corporate policies via AI.
- Executive Admin & HR Command Center: Enables HR administrators to manage employee records, review and approve/reject leave applications with row-level transaction safety, compute payroll structures, monitor workforce attendance analytics, and review AI-generated executive summaries.

---

## 2. Technical Stack and Infrastructure

### 2.1 Backend Architecture
- Framework: FastAPI (Python 3.10+) utilizing asynchronous request handlers.
- Database ORM: AsyncSQLAlchemy 2.0 with PostgreSQL (asyncpg driver) for production and SQLite (aiosqlite) for lightweight local testing.
- Data Validation: Pydantic v2 schemas for strict request/response data contracts.
- Authentication & Security: Passlib (Bcrypt hashing) and PyJWT (HS256 JWT tokens).
- Test Automation: Pytest test suite with AsyncIO fixtures.
- Server Engine: Uvicorn ASGI server with automatic reload capabilities.

### 2.2 Frontend Architecture
- Framework: React 18 with TypeScript in strict mode.
- Build Tool: Vite 8.x for hot module replacement and optimized bundle minification.
- Styling Engine: Vanilla CSS tokens combined with Tailwind CSS utility classes following Google Material 3 visual standards.
- Routing: React Router DOM v6 with declarative client-side route guards.
- Component Library: Custom modular component architecture with Lucide reactivity primitives.

### 2.3 Artificial Intelligence Infrastructure
- AI Model: Google Gemini API (`gemini-3.7-flash`).
- Retrieval-Augmented Generation (RAG): Context-aware prompt injection using structured HR policy documentation and live user database context.

---

## 3. System Architecture and Data Flow

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

### 3.1 Request Lifecycle
1. Client Dispatch: The frontend client sends an HTTP request containing a JSON payload and an `Authorization: Bearer <token>` header.
2. Route Handling: FastAPI routes the request to an API endpoint defined under `/api/v1/`.
3. Dependency Injection: Middleware verifies token signature, checks subject identity against PostgreSQL `profiles`, and enforces Role-Based Access Control (RBAC).
4. Business Service Layer: Dedicated service classes (`AuthService`, `AttendanceService`, `LeaveService`, `PayrollService`, `GeminiService`) process domain logic using atomic database transactions.
5. Standard Response Formatting: Output data is serialized into unified response wrappers containing `success`, `data`, and `error` structures.

---

## 4. Database Schema and Entity Relationships

### 4.1 Data Models

#### Profile (`profiles`)
- `id` (UUID, Primary Key)
- `auth_user_id` (UUID, Unique, Indexed)
- `employee_id` (String, Unique, Indexed)
- `role` (Enum: `ADMIN`, `HR`, `EMPLOYEE`)
- `full_name` (String)
- `email` (String, Unique, Indexed)
- `phone` (String, Nullable)
- `address` (Text, Nullable)
- `department_id` (UUID, Foreign Key -> `departments.id`, Nullable)
- `job_title` (String, Nullable)
- `is_active` (Boolean, Default True)
- `is_email_verified` (Boolean, Default False)
- `created_at` (DateTime with Timezone)
- `updated_at` (DateTime with Timezone)

#### Department (`departments`)
- `id` (UUID, Primary Key)
- `name` (String, Unique)
- `code` (String, Unique)
- `description` (Text, Nullable)

#### AttendanceRecord (`attendance_records`)
- `id` (UUID, Primary Key)
- `employee_id` (UUID, Foreign Key -> `profiles.id`, Indexed)
- `date` (Date, Indexed)
- `check_in` (DateTime with Timezone, Nullable)
- `check_out` (DateTime with Timezone, Nullable)
- `work_hours` (Float, Default 0.0)
- `status` (Enum: `PRESENT`, `ABSENT`, `HALF_DAY`, `LEAVE`)
- `notes` (Text, Nullable)

#### LeaveType (`leave_types`)
- `id` (UUID, Primary Key)
- `name` (String, Unique)
- `code` (String, Unique)
- `is_paid` (Boolean, Default True)
- `default_days_per_year` (Integer)
- `is_active` (Boolean, Default True)

#### LeaveBalance (`leave_balances`)
- `id` (UUID, Primary Key)
- `employee_id` (UUID, Foreign Key -> `profiles.id`, Indexed)
- `leave_type_id` (UUID, Foreign Key -> `leave_types.id`, Indexed)
- `year` (Integer, Indexed)
- `allocated_days` (Integer)
- `used_days` (Integer)
- `remaining_days` (Integer)

#### LeaveRequest (`leave_requests`)
- `id` (UUID, Primary Key)
- `employee_id` (UUID, Foreign Key -> `profiles.id`, Indexed)
- `leave_type_id` (UUID, Foreign Key -> `leave_types.id`, Indexed)
- `start_date` (Date)
- `end_date` (Date)
- `total_days` (Integer)
- `status` (Enum: `PENDING`, `APPROVED`, `REJECTED`)
- `remarks` (Text, Nullable)
- `reviewer_id` (UUID, Foreign Key -> `profiles.id`, Nullable)
- `reviewer_comment` (Text, Nullable)
- `created_at` (DateTime with Timezone)

#### PayrollRecord (`payroll_records`)
- `id` (UUID, Primary Key)
- `employee_id` (UUID, Foreign Key -> `profiles.id`, Indexed)
- `month` (Integer)
- `year` (Integer)
- `base_salary` (Float)
- `hra` (Float)
- `allowances` (Float)
- `deductions` (Float)
- `net_salary` (Float)
- `status` (Enum: `DRAFT`, `PROCESSED`, `PAID`)
- `payment_date` (Date, Nullable)

#### Notification (`notifications`)
- `id` (UUID, Primary Key)
- `recipient_id` (UUID, Foreign Key -> `profiles.id`, Indexed)
- `type` (String)
- `title` (String)
- `message` (Text)
- `reference_type` (String, Nullable)
- `reference_id` (UUID, Nullable)
- `is_read` (Boolean, Default False, Indexed)
- `created_at` (DateTime with Timezone)

---

## 5. Security Architecture and Authorization

### 5.1 Email Verification Security
1. Registration Logic: When a new employee account is created via `POST /api/v1/auth/signup`, `is_email_verified` is initialized to `False`.
2. Access Blocking: `AuthService.login` evaluates `is_email_verified`. Unverified accounts are strictly denied authentication tokens and return HTTP 400 Bad Request with an explicit error message.
3. Verification Activation: An account is marked as verified through the `/api/v1/auth/verify-email` endpoint, setting `is_email_verified = True` in PostgreSQL.

### 5.2 Role-Based Access Control (RBAC)
- Dependency Guard: `require_roles(*allowed_roles)` decorates sensitive administrative endpoints.
- Scoping Rules:
  - `EMPLOYEE`: Access restricted to self records (`/attendance/me`, `/leave/requests`, `/payroll/me`). Attempts to access `/admin/*` or another employee's profile ID return HTTP 403 Forbidden.
  - `ADMIN` / `HR`: Privileged access granted to global workforce attendance, global leave approval queues, global payroll structure updates, and executive AI summary endpoints.

---

## 6. Core Functional Modules

### 6.1 Attendance Management Engine
- Shift Clock-In / Clock-Out: Validates active daily records. Double clock-in returns validation exceptions; clock-out before clock-in is rejected.
- Automatic Hours Calculation: Work duration is dynamically derived in floating-point hours (`work_hours = (check_out - check_in).seconds / 3600`).
- Status Classification: Automatically tags records as `PRESENT`, `HALF_DAY` (< 4 hours), or `ABSENT`.

### 6.2 Leave Management and Atomic Balance Transaction
- Balance Check: `LeaveService.check_eligibility()` verifies requested date ranges against `remaining_days` in `leave_balances`.
- What-If Simulator: Allows employees to compute projected balances prior to submitting formal requests.
- Row-Locking Approval: When an Admin approves a leave request via `POST /admin/leave/{id}/approve`, the transaction executes row-level locking (`with_for_update()`) on `leave_balances`, deducts `total_days` from `remaining_days`, increments `used_days`, and updates request status to `APPROVED`. Rejections require mandatory reviewer comments.

### 6.3 Payroll Calculation Engine
- Net Salary Formula: `Net Salary = Base Salary + HRA + Allowances - Deductions`.
- Read-Only Security: Employees can view their paystubs and export printable corporate salary slips. Only HR/Admin roles can mutate salary structures or process payouts.

### 6.4 Grounded Gemini AI RAG System
- Policy Assistance: Queries standard HR handbooks using strict context injection to eliminate hallucinations.
- Paystub & Leave Insights: Summarizes user salary components and leave entitlement directly from verified database queries.
- Executive Summaries: Aggregates workforce metrics (attendance percentage, pending approvals, payroll liabilities) into executive insights for managers.

---

## 7. API Reference Specification

### Authentication Endpoints
- `POST /api/v1/auth/signup`: Registers a new employee account.
- `POST /api/v1/auth/login`: Authenticates credentials and returns JWT token.
- `POST /api/v1/auth/verify-email`: Sets email verification status to True.
- `GET /api/v1/auth/me`: Returns current authenticated profile details.

### Attendance Endpoints
- `POST /api/v1/attendance/check-in`: Clock in for today's shift.
- `POST /api/v1/attendance/check-out`: Clock out of today's shift.
- `GET /api/v1/attendance/me`: Retrieves current employee daily attendance records.
- `GET /api/v1/attendance/me/weekly`: Retrieves current employee weekly attendance history.
- `GET /api/v1/admin/attendance`: Retrieves global workforce attendance (Admin/HR).

### Leave Endpoints
- `GET /api/v1/leave/types`: Lists active leave types.
- `GET /api/v1/leave/balances`: Retrieves logged-in employee's leave balances.
- `POST /api/v1/leave/eligibility`: Simulates leave eligibility for date range.
- `POST /api/v1/leave/requests`: Submits a formal time-off request.
- `GET /api/v1/leave/requests`: Lists employee's submitted leave requests.
- `DELETE /api/v1/leave/requests/{id}`: Cancels pending leave request.
- `GET /api/v1/admin/leave/requests`: Retrieves global pending leave queue (Admin/HR).
- `POST /api/v1/admin/leave/{id}/approve`: Approves leave request with atomic balance deduction.
- `POST /api/v1/admin/leave/{id}/reject`: Rejects leave request with mandatory comment.

### Payroll Endpoints
- `GET /api/v1/payroll/me`: Retrieves current employee payroll records.
- `GET /api/v1/admin/payroll`: Retrieves global employee payroll records (Admin/HR).
- `POST /api/v1/admin/payroll`: Creates or updates employee salary structure (Admin/HR).

### AI & Analytics Endpoints
- `POST /api/v1/ai/chat`: Executes grounded RAG prompt queries against Gemini AI.
- `GET /api/v1/ai/insights/my-leave-and-pay`: Generates AI explainability summary for paystub and leave.
- `GET /api/v1/ai/summary/workforce`: Generates executive workforce overview for management.
- `GET /api/v1/analytics/dashboard`: Computes analytical metrics and chart data.

---

## 8. Verification and Quality Assurance

### 8.1 Automated Unit & Integration Testing
The test suite is built on Pytest and covers core system contracts:
```bash
python -m pytest tests/ -v
```
Test Coverage Areas:
- Unauthorized API access blocking (HTTP 401 / HTTP 403).
- Role-Based Access Control enforcement.
- Shift clock-in and check-out workflows.
- Leave eligibility checking, atomic balance deductions, and rejection rules.
- Payroll view restrictions and administrative updates.
- Grounded AI response authorization.

### 8.2 Frontend Production Build
The frontend TypeScript application compiles using Vite:
```bash
cd frontend
npm run build
```

---

## 9. SRS Requirement Compliance Verification

| SRS Requirement | Feature Description | Implementation Status |
|---|---|---|
| 3.1.1 Sign Up | Employee ID, Email, Password Policy, Role Scoping, Email Verification | Fully Implemented & Enforced |
| 3.1.2 Sign In | Authentication, Credential Validation, Error Banners, Dashboard Routing | Fully Implemented & Enforced |
| 3.2.1 Employee Dashboard | Quick Cards (Profile, Attendance, Leave), Recent Notifications | Fully Implemented |
| 3.2.2 Admin Dashboard | Employee Roster, Attendance History, Leave Approval Queue | Fully Implemented |
| 3.3.1 View Profile | Personal, Job, Salary Structure, Profile Details | Fully Implemented |
| 3.3.2 Edit Profile | Employee Self-Editing (Phone, Address); Admin Full Editing | Fully Implemented |
| 3.4.1 Attendance Tracking | Check-In/Check-Out, Daily/Weekly Views, Status Classification | Fully Implemented |
| 3.4.2 Attendance View | Role-Gated Attendance Records (Self vs Global) | Fully Implemented |
| 3.5.1 Apply for Leave | Leave Types (Paid, Sick, Unpaid), Date Picker, Status Tracking | Fully Implemented |
| 3.5.2 Leave Approvals | Global Queue, Row-Locking Balance Deduction, Rejection Comments | Fully Implemented |
| 3.6.1 Employee Payroll | Read-Only Paystub Access, Salary Slip Generation | Fully Implemented |
| 3.6.2 Admin Payroll Control | Global Payroll Editor, Salary Breakdown Verification | Fully Implemented |
| Section 6 Enhancements | Real-Time Notifications, Analytics Dashboard, Grounded Gemini AI | Fully Implemented |
