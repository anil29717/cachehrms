# Cachedigitech HRMS — Project Documentation

## 1. Project Overview

| Item | Value |
|------|--------|
| **Name** | Cachedigitech Internal HRMS |
| **Version** | 1.0 |
| **Type** | Internal Web Application (Modular Monolith) |
| **Scale** | ~200 employees, 50 concurrent users |

**Purpose:** Single source of truth for employee data, attendance, leave, payroll, assets, tickets, expenses, and announcements—with role-based access, optional Microsoft SSO, and CRM-friendly API integration.

---

## 2. Problems It Solves

| Problem | How HRMS Addresses It |
|--------|------------------------|
| **Fragmented employee data** | Central employee master (profile, department, designation, documents) with one place to view and update. |
| **Manual attendance & leave** | Check-in/out with IP, leave apply/approve workflow, balance tracking, and calendar views. |
| **Payroll opacity** | Salary structure, payroll runs, payslip view/download, and LOP/leave integration. |
| **Asset & ticket chaos** | Asset inventory, allocation/returns, maintenance requests; ticket system with categories and reports. |
| **Expense paperwork** | Expense types, claim submission, approval flow, and reporting. |
| **Scattered communications** | Announcements (birthdays, holidays, events, deadlines, asset collection) with read tracking. |
| **Room double-booking** | Room master and booking with conflict prevention. |
| **Slow onboarding** | Staged onboarding (offer acceptance → documents → IT setup → HR activation) with invite links. |
| **Inconsistent access control** | RBAC: Super Admin (full), HR (configurable sidebar/module access), with scope-based permissions. |
| **External system integration** | API Manager for API keys and read-only CRM endpoints (employees, departments, search). |
| **Audit & compliance** | Audit logging for key actions and system logs; JWT + refresh token auth; optional Microsoft SSO. |

---

## 3. What the Application Can Do (Features)

### 3.1 Authentication & Access

- **Email/password login** with JWT (access + refresh tokens).
- **Microsoft SSO** (optional): Sign in with Microsoft; user must exist in HRMS (matched by email). Supports single-tenant (tenant ID in env) or multi-tenant (`/common`).
- **Roles:** Super Admin (full access), HR Admin (access controlled per user via Permissions).
- **Permission management (Super Admin):** Assign HR users and toggle “Show in sidebar” per module/submodule (dashboard, departments, employees, attendance, leave, payroll, assets, tickets, expenses, announcements, booking, onboarding, settings). New HR users have no access until granted.
- **Protected routes** and sidebar visibility based on role and scope permissions.

### 3.2 Dashboard

- **Core HR:** Total/active employees, pending leave requests, pending expenses.
- **Workforce insights:** Charts (e.g. employee status).
- **Operations snapshot:** Open/high-priority tickets, total assets, this month’s expense.
- **Recent activity:** Feed of leave, expense, ticket, asset events.
- **Quick actions:** Add Employee, Apply Leave, Create Expense, Create Ticket.

### 3.3 Departments

- List, create, edit, view departments; hierarchy and department head.

### 3.4 Employees

- **List:** Pagination, search, filters (status, department, employment type).
- **Detail:** Personal, employment, bank, documents, education, experience, attendance, leave, payroll.
- **Add/Edit:** Create/update employee; employee code generation (e.g. EMP-YYYY-XXXX).
- **Documents:** Employee documents management.
- **Onboarding entry:** Add employee via onboarding flow.

### 3.5 Onboarding

- **Staged flow:** Offer acceptance → documents → personal/bank/education/experience → IT setup → HR review & activation.
- **Invite links:** Candidate joins via `/onboarding/join/:token`; document uploads and verification.
- **HR:** List onboardings, view detail, advance stages, create employee at appropriate stage.

### 3.6 Attendance

- Check-in / check-out (timestamp, IP); today’s attendance; history/calendar; shift and late handling.

### 3.7 Leave

- **Apply leave:** Date range, type, half-day; optional employee selector for HR/Super Admin (cannot apply for self as Super Admin).
- **Approvals:** Pending approvals list; approve/reject.
- **Views:** Leave calendar, balance by type, leave policy.

### 3.8 Payroll

- **Payroll runs:** List, generate payroll.
- **Salary structure:** Per-employee salary structure.
- **Payslips:** View and download; “My Payslips” for self.

### 3.9 Assets

- **Inventory:** Asset list, add asset, asset categories.
- **Allocation:** Assign asset to employee, allocated assets list, returns.
- **Maintenance:** Service/maintenance requests, repair history.

### 3.10 Tickets

- **Create/view:** Create ticket; list all / my tickets; ticket detail.
- **Categories:** Ticket category settings.
- **Reports:** Overview, volume, resolution time.

### 3.11 Expenses

- **Expense types:** Configure types and limits.
- **Claims:** New claim, pending/approved/paid/rejected lists, claim detail.
- **Reports:** Expense dashboard and reports.

### 3.12 Announcements

- **Create/edit:** Create and edit announcements.
- **Views:** All, birthdays, holidays, asset collection, events, deadlines.
- **Reports:** Announcement reports.

### 3.13 Booking

- **Rooms:** Room list, add/edit room, book room.
- **Bookings:** My bookings; all bookings (admin).

### 3.14 Settings

- **Permissions:** Per-HR-user sidebar access (show/hide modules and submodules).
- **API Manager:** API access keys for CRM/integration; rate limits.
- **System logs:** View system/audit logs.
- **Profile:** User profile (and theme toggle in app).

### 3.15 Integration role (external)

This project stores a separate **employee integration role** for external systems (CRM, etc.). This is **not** the HRMS RBAC `Role` used for permissions.

- **Field**: `externalRole`
- **Allowed values**: `employee | manager | admin | subadmin`
- **Default**: `employee`
- **Used in**:
  - Employee create/edit + onboarding forms (HR/admin can set it)
  - Integration API responses (can be included via API key field selection)

---

## 4. Tech Stack

### 4.1 Frontend

| Category | Technology |
|----------|------------|
| **Runtime / build** | React 18, Vite 5, TypeScript 5.6 |
| **Styling** | TailwindCSS 3, PostCSS, Autoprefixer |
| **Routing** | React Router v6 |
| **State** | Zustand (auth, theme persistence) |
| **Server state / API** | TanStack React Query v5 |
| **UI** | Lucide React (icons), React Toastify (notifications) |
| **Charts** | Recharts |
| **Theme** | Light / Dark (localStorage); PRD palette |

### 4.2 Backend

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js |
| **Framework** | Express 4 |
| **Language** | TypeScript 5.6 (tsx for dev) |
| **ORM** | Prisma 5 (PostgreSQL) |
| **Auth** | JWT (access + refresh), bcrypt (password hashing) |
| **Security** | Helmet, CORS, express-rate-limit |
| **Validation** | Zod |
| **File upload** | Multer |

### 4.3 Database

| Item | Technology |
|------|------------|
| **Database** | PostgreSQL |
| **Schema / migrations** | Prisma schema + migrations |

### 4.4 Integrations

- **Microsoft identity:** OAuth2/OIDC (authorization code flow) for SSO; optional tenant-specific or common endpoint; Graph API `/me` for email.
- **CRM:** Read-only REST API (API key auth, rate limiting) for employees, departments, search.

---

## 5. Repository Structure

```
HRMS/
├── PROJECT.md              # This file — features, tech stack, problems solved
├── TASKS.md                # Full task list from PRD (phases)
├── TODO.md                 # Current sprint / step-by-step todo
├── README.md               # Setup and run instructions
│
├── backend/
│   ├── src/
│   │   ├── config/         # DB, env, scopes (RBAC)
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/     # Auth, RBAC, audit, requireScope
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── types/
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/            # API client (fetch + auth header)
│   │   ├── components/
│   │   ├── layouts/        # MainLayout, sidebar (scope-based)
│   │   ├── pages/
│   │   ├── stores/         # Zustand (auth, theme)
│   │   ├── theme/
│   │   ├── utils/          # permissions (canAccessScope, isSuperAdmin)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── docs/                   # Optional: PRD, API specs
```

---

## 6. API Base Paths (v1)

| Category | Base Path |
|----------|-----------|
| Auth | `/api/v1/auth` (login, refresh, me, microsoft, microsoft/callback) |
| Dashboard | `/api/v1/dashboard` |
| Departments | `/api/v1/departments` |
| Employees | `/api/v1/employees` |
| Attendance | `/api/v1/attendance` |
| Leave | `/api/v1/leave` |
| Payroll | `/api/v1/payroll` |
| Rooms | `/api/v1/rooms` |
| Bookings | `/api/v1/bookings` |
| Asset categories | `/api/v1/asset-categories` |
| Assets | `/api/v1/assets` |
| Asset allocations | `/api/v1/asset-allocations` |
| Maintenance requests | `/api/v1/maintenance-requests` |
| Ticket categories | `/api/v1/ticket-categories` |
| Tickets | `/api/v1/tickets` |
| Expense types | `/api/v1/expense-types` |
| Expense claims | `/api/v1/expense-claims` |
| Announcements | `/api/v1/announcements` |
| Onboarding | `/api/v1/onboarding` |
| Settings: API access | `/api/v1/settings/api-access` |
| Settings: Users | `/api/v1/settings/users` |
| Settings: Permissions | `/api/v1/settings/permissions` |
| Integration (CRM) | `/api/v1/integration` |
| System logs | `/api/v1/system-logs` |

---

## 7. Roles & Access Control

| Role | Access |
|------|--------|
| **Super Admin** | Full access to all modules; manages HR permissions (sidebar visibility per HR user). |
| **HR Admin** | Access only to modules/submodules granted by Super Admin (stored in `user_scope_permissions`); sidebar and API protected by scope. |

- **Auth:** JWT in `Authorization: Bearer <token>`; refresh token for new access token.
- **HR permissions:** Refreshed on login and via `GET /auth/me` so sidebar updates after permission changes without re-login.

---

## 8. Theme (PRD)

| Element | Light | Dark |
|---------|--------|------|
| Background | #FFFFFF | #1F2937 |
| Text Primary | #111827 | #F3F4F6 |
| Text Secondary | #4B5563 | #D1D5DB |
| Cards | White + shadow | Dark Gray-800 + border |
| Borders | #E5E7EB | #374151 |
| Primary | #2563EB | #3B82F6 |
| Success | #059669 | #10B981 |
| Error | #DC2626 | #EF4444 |
| Warning | #F59E0B | #FBBF24 |

---

## 9. Environment (Summary)

- **Backend:** `.env` in `backend/` — `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `FRONTEND_URL`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` (for single-tenant SSO). See `backend/.env.example`.
- **Frontend:** Optional `.env` — `VITE_API_BASE_URL`, `VITE_PUBLIC_ORIGIN` (e.g. for onboarding invite links). See `frontend/.env.example`.
- Never commit `.env`; use `.env.example` as template.

---

## 10. References

- **README.md** — Setup and run (backend + frontend, default login).
- **TASKS.md** — Full task list from PRD (phases 0–10).
- **TODO.md** — Current step-by-step execution list.
- **PRD** — Product Requirement Document (if provided in `docs/`).
