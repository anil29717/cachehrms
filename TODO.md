# HRMS — Step-by-Step TODO (Current Sprint)

Use this file for the **next actions** to take. Update as you complete each step.

---

## Current Focus: Foundation

### Step 1 — Project scaffolding
- [x] Create `backend/` with Node + Express + TypeScript (package.json, tsconfig.json)
- [x] Create `frontend/` with Vite + React + TypeScript
- [x] Add `.env.example` and README with setup instructions

### Step 2 — Database
- [x] Add Prisma to backend, set DB URI
- [x] Define core schema: `employees`, `departments`, `users`, `roles`, `permissions`, `role_permissions`
- [x] Run first migration

### Step 3 — Auth (backend)
- [x] Auth routes: login, refresh, forgot-password, reset-password
- [x] JWT middleware, RBAC middleware
- [x] Seed Super Admin role and one test user

### Step 4 — Auth (frontend)
- [x] Login page, theme toggle (Light/Dark), React Toastify
- [x] Auth store (Zustand), protected routes, redirect by role

### Step 5 — Dashboard & layout
- [x] App layout (sidebar, header, breadcrumb)
- [x] Role-based dashboard API and UI (stats from API)

### Step 6 — Departments
- [x] Departments CRUD API (list, get, create, update — Admin)
- [x] Departments list and detail page on frontend

### Step 7 — Employees (MVP)
- [x] Employees API (list with pagination/search/filter, get, create/onboard)
- [x] Employee list and detail page, Onboard employee form

### Step 8 — Attendance
- [x] Shifts CRUD API, default shift (seed)
- [x] Check-in / Check-out API (timestamp, IP, late/working hours)
- [x] Today’s attendance, my history (paginated)
- [x] Team attendance (Manager), department attendance (HR), monthly report (HR)
- [x] Frontend: Attendance page (check-in/out, today, my history, team/dept/report/shifts by role)

---

### Step 9 — Leave
- [x] Leave API: apply (balance check, overlap check), my requests, my balances
- [x] Pending approvals (Manager: reportees, HR: all / by department), approve/reject with balance deduction
- [x] Seed: default leave balances (sick, casual, earned) for seed user
- [x] Frontend: Leave page (balance, apply form, my requests, pending approvals for Manager/HR)

---

### Step 10 — Payroll
- [x] Salary structure per employee (CRUD), migration + API
- [x] Payroll runs: list by month/year, generate run, update payment status (pending/processed/failed)
- [x] Payslip: view (employee own, HR any), my payslips list
- [x] Frontend: Payroll submenu (Payroll runs, Salary structure, Generate payroll, My payslips), role-based visibility

---

## Next (after foundation)

- Reports & Settings
- CRM integration APIs

---

## How to use

1. Start with **Step 1** and check off items as done.
2. When Step 1 is complete, move to Step 2, and so on.
3. Sync this with **TASKS.md** (tick the same tasks there when done).
4. For full scope, always refer to **TASKS.md** and **PROJECT.md**.
