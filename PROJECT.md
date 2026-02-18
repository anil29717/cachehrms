# Cachedigitech HRMS — Project File

## Project Overview

| Item | Value |
|------|--------|
| **Name** | Cachedigitech Internal HRMS |
| **Version** | 1.0 |
| **Type** | Internal Web Application (Modular Monolith with CRM) |
| **Scale** | ~200 employees, 50 concurrent users |

---

## Repository Structure

```
d:\HRMS\
├── PROJECT.md              # This file — project overview and structure
├── TASKS.md                # Full task list from PRD
├── TODO.md                 # Current sprint / step-by-step todo
├── .env.example            # Environment variables template
├── README.md               # Setup and run instructions
│
├── backend/                # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/         # DB, env, constants
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access
│   │   ├── middleware/     # Auth, RBAC, validation, rate-limit
│   │   ├── routes/         # API routes (v1)
│   │   ├── utils/          # Helpers, errors
│   │   ├── types/          # Shared types
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma   # DB schema
│   │   └── migrations/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/               # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── api/            # API client, React Query
│   │   ├── components/     # Reusable UI
│   │   ├── layouts/        # App layout, sidebar, header
│   │   ├── pages/          # Route pages
│   │   ├── stores/         # Zustand
│   │   ├── hooks/          # Custom hooks
│   │   ├── theme/          # Light/Dark, Tailwind
│   │   ├── types/          # TS types
│   │   ├── utils/          # Helpers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── docs/                   # Optional: PRD, API specs
    └── (PRD, API docs)
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Lucide React, React Router v6, React Query, Zustand, React Toastify |
| **Backend** | Node.js, Express, TypeScript, JWT, bcrypt |
| **Database** | PostgreSQL, Prisma ORM |
| **Auth** | JWT (8h expiry), refresh token, RBAC |
| **Theme** | Light / Dark (localStorage), as per PRD palette |

---

## Environment

- **Database URI** (from PRD):  
  `postgresql://hrms_user:StrongPassword1@172.16.110.46:5432/cachedigitech_hrms`
- Use `.env` in backend (and frontend if needed); never commit secrets. Use `.env.example` for templates.

---

## API Base Paths (v1)

| Category | Base Path |
|----------|-----------|
| Auth | `/api/v1/auth` |
| Dashboard | `/api/v1/dashboard` |
| Employees | `/api/v1/employees` |
| Departments | `/api/v1/departments` |
| Attendance | `/api/v1/attendance` |
| Leave | `/api/v1/leave` |
| Payroll | `/api/v1/payroll` |
| Reports | `/api/v1/reports` |
| Settings | `/api/v1/settings` |
| CRM Integration | `/api/v1/integration/crm` |

---

## Roles (Hierarchy)

1. **Super Admin** — Full access  
2. **HR Admin** — Employees, leave, attendance, payroll, reports  
3. **Manager** — Team-only views and approvals  
4. **Employee** — Self-service (profile, leave, attendance, payslip)

---

## Theme (from PRD)

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

## References

- **PRD** — Full Product Requirement Document (provided separately).
- **TASKS.md** — Complete task breakdown.
- **TODO.md** — Current step-by-step execution list.
