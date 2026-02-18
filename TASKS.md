# HRMS — Full Task List (from PRD)

Tasks are grouped by phase. Check off as completed. Use **TODO.md** for the current step-by-step list.

---

## Phase 0: Project Setup

- [ ] **0.1** Create repo structure (backend/, frontend/, docs/)
- [ ] **0.2** Backend: Init Node + TypeScript + Express, tsconfig, scripts
- [ ] **0.3** Backend: Add Prisma, connect to PostgreSQL (DBURI from PRD)
- [ ] **0.4** Backend: Add .env.example and document env vars
- [ ] **0.5** Frontend: Init Vite + React + TypeScript
- [ ] **0.6** Frontend: Add TailwindCSS, Lucide React, React Router v6, React Query, Zustand, React Toastify
- [ ] **0.7** Frontend: Configure theme (Light/Dark) and persist in localStorage
- [ ] **0.8** README with setup and run instructions

---

## Phase 1: Database & Auth

### Database (Prisma)

- [ ] **1.1** Define `employees` table (per PRD §4.1)
- [ ] **1.2** Define `departments` table
- [ ] **1.3** Define `users`, `roles`, `permissions`, `role_permissions`
- [ ] **1.4** Define `attendance`, `shifts`
- [ ] **1.5** Define `leave_requests`, `leave_balances`
- [ ] **1.6** Define `payroll`
- [ ] **1.7** Define `audit_logs`
- [ ] **1.8** Define `api_access` (CRM integration)
- [ ] **1.9** Run migrations and verify DB

### Auth Module

- [ ] **1.10** Auth API: Login (email/password), JWT + refresh token
- [ ] **1.11** Password hashing (bcrypt, 10 rounds), password policy validation
- [ ] **1.12** Remember me, session handling
- [ ] **1.13** Forgot password (email OTP), password reset
- [ ] **1.14** Account lockout after 5 failed attempts, login activity logging
- [ ] **1.15** Auth middleware: verify JWT, attach user/role
- [ ] **1.16** RBAC middleware: check permissions by role
- [ ] **1.17** Frontend: Login page, token storage, auth context/store
- [ ] **1.18** Frontend: Protected routes and role-based redirects

---

## Phase 2: Core Modules (MVP)

### Departments

- [ ] **2.1** API: List departments, get by id, create, update (Admin only)
- [ ] **2.2** API: Assign department head, hierarchy (parent_id)
- [ ] **2.3** Frontend: Departments list and detail (all roles), manage (Admin)

### Employees

- [ ] **2.4** API: List with pagination, search, filter (status, department, employment_type)
- [ ] **2.5** API: Get employee by id, create, update, soft delete (status) — with RBAC
- [ ] **2.6** Employee code generation: EMP-YYYY-XXXX
- [ ] **2.7** API: Export employees (Excel/CSV) — HR/Admin
- [ ] **2.8** Frontend: Employee list, filters, search, pagination
- [ ] **2.9** Frontend: Employee detail page (personal, employment, bank, documents, education, experience, attendance, leave, payroll)
- [ ] **2.10** Frontend: Add/Edit employee (HR/Admin, Manager for team)
- [ ] **2.11** Frontend: Export employee list

### Dashboard

- [ ] **2.12** API: Dashboard stats by role (Super Admin/HR vs Manager vs Employee)
- [ ] **2.13** Frontend: Role-based dashboard (welcome, counts, charts, quick actions)
- [ ] **2.14** Frontend: Manager dashboard (team size, attendance, pending leave, team list)
- [ ] **2.15** Frontend: Employee dashboard (attendance status, leave balance, holidays, check-in/out, payslip)

---

## Phase 3: Attendance

- [ ] **3.1** API: Check-in / Check-out with timestamp and IP
- [ ] **3.2** Shift validation, grace period, late flag, working_hours, overtime
- [ ] **3.3** API: Get today's attendance, my attendance history (calendar)
- [ ] **3.4** API: Team attendance (Manager), department attendance (HR)
- [ ] **3.5** API: Monthly attendance report
- [ ] **3.6** API: Attendance correction request (Employee), approve (Manager/HR)
- [ ] **3.7** API: Shifts CRUD, holiday calendar (Admin/HR)
- [ ] **3.8** Frontend: Check-in/out button, today’s attendance, my calendar view
- [ ] **3.9** Frontend: Team/department attendance views, correction request/approval

---

## Phase 4: Leave

- [ ] **4.1** API: Apply leave (date range, type, half-day, document upload)
- [ ] **4.2** Leave balance check, deduction on approval
- [ ] **4.3** API: List pending approvals, approve/reject (Manager → HR flow)
- [ ] **4.4** API: Leave calendar, balance by type, encashment, comp-off
- [ ] **4.5** Frontend: Apply leave form, balance display
- [ ] **4.6** Frontend: Pending approvals list, approve/reject
- [ ] **4.7** Frontend: Leave calendar, balance view

---

## Phase 5: Payroll (Should Have)

- [ ] **5.1** API: Salary structure per employee, payroll generation (monthly)
- [ ] **5.2** LOP, paid/unpaid leave integration, TDS, PF/ESI, bonus, OT, reimbursement
- [ ] **5.3** API: Payslip PDF, download, bulk processing
- [ ] **5.4** API: Payroll history, bank file (NACH)
- [ ] **5.5** Frontend: Payroll list, generate, process (HR/Admin)
- [ ] **5.6** Frontend: Payslip download (all roles for self)

---

## Phase 6: Reports

- [ ] **6.1** API: Attendance report (daily, monthly, range)
- [ ] **6.2** API: Leave report by employee/department
- [ ] **6.3** API: Payroll summary, department-wise count, attrition, new hire, exit
- [ ] **6.4** API: Export (PDF, Excel, CSV), optional scheduled email
- [ ] **6.5** Frontend: Report filters, run report, export

---

## Phase 7: Settings & Admin

- [ ] **7.1** API: Role CRUD, permission assignment
- [ ] **7.2** API: User management (assign roles)
- [ ] **7.3** API: Company profile, holiday calendar, leave policy, salary components, tax slab
- [ ] **7.4** API: Email templates, audit log viewer
- [ ] **7.5** Frontend: Settings pages (roles, permissions, users, company, holidays, leave policy, tax, templates, audit log)

---

## Phase 8: CRM Integration

- [ ] **8.1** API: api_access table, API key auth for CRM
- [ ] **8.2** GET /integration/crm/employees, /employees/:id, /departments, /search, /by-email/:email (read-only)
- [ ] **8.3** Rate limiting (e.g. 1000/hr per key), API usage logs

---

## Phase 9: Security & Polish

- [ ] **9.1** Rate limiting (100 req/min per IP), CORS, helmet
- [ ] **9.2** Audit logging for CREATE/UPDATE/DELETE and logins
- [ ] **9.3** Validation and error response format (per PRD §6.1)
- [ ] **9.4** Frontend: Breadcrumbs, loading states, toasts (React Toastify), confirmation modals
- [ ] **9.5** Frontend: Form validation, date pickers, file upload with preview
- [ ] **9.6** E2E or smoke tests for critical flows (optional)

---

## Phase 10: Nice to Have

- [ ] **10.1** Bulk employee import (Excel)
- [ ] **10.2** Custom report builder (Admin/HR)
- [ ] **10.3** Advanced analytics
- [ ] **10.4** Email notifications, SMS (future)
- [ ] **10.5** Mobile app, biometric attendance (future)

---

## Checklist Summary

| Phase | Description | Task count |
|-------|-------------|------------|
| 0 | Project setup | 8 |
| 1 | Database & Auth | 18 |
| 2 | Core (Departments, Employees, Dashboard) | 15 |
| 3 | Attendance | 9 |
| 4 | Leave | 7 |
| 5 | Payroll | 6 |
| 6 | Reports | 5 |
| 7 | Settings & Admin | 5 |
| 8 | CRM Integration | 3 |
| 9 | Security & Polish | 6 |
| 10 | Nice to Have | 5 |

Use **TODO.md** for the immediate next steps to execute.
