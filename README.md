# Cachedigitech Internal HRMS

Internal HRMS for ~200 employees. Single source of truth for employee data with RBAC and CRM integration.

## Docs

| File | Purpose |
|------|--------|
| **PROJECT.md** | Project structure, tech stack, env, API base paths, theme |
| **TASKS.md** | Full task list from PRD (all phases) |
| **TODO.md** | Current step-by-step todo |

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env if needed (DATABASE_URL, JWT_SECRET, etc.)
npm install
npx prisma generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

API runs at `http://localhost:4000/api/v1`. Default login after seed: **admin@cachedigitech.com** / **Admin@123**.

## Integration employee role

Employees have an `externalRole` field for external integrations (not HRMS RBAC). Allowed values: `employee | manager | admin | subadmin`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`. Use the proxy to the API or set `VITE_API_BASE_URL=http://localhost:4000/api/v1` in `.env`.

### If API Manager shows "Unknown argument rateLimitPerHour"

Prisma CLI was aligned to 5.x. In `backend` run:

```bash
cd backend
npm install
npx prisma generate
npm run db:deploy:admin
```

Then restart the backend (`npm run dev`).

## Stack

- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt
- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, Lucide React, React Router v6, React Query, Zustand, React Toastify, Light/Dark theme
