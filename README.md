# College Admission Prediction & Notification Web Application

> **Production-grade multi-tenant SaaS platform** for data-driven college admission analysis, counseling management, and student guidance.

---

## Overview

This platform enables educational consultancies (Admins/Tenants) to manage students and counselors, generate data-driven admission probability recommendations based on historical cutoff data, produce professional reports, and deliver targeted notifications — all within a strictly isolated multi-tenant architecture.

---

## Tech Stack

| Layer         | Technology                         |
|---------------|------------------------------------|
| Frontend      | React.js + Tailwind CSS            |
| Backend       | Node.js (Express)                  |
| Database      | Supabase (PostgreSQL)              |
| Hosting       | Vercel (Frontend + Edge Functions) |
| Auth          | Email/Password + JWT (Role-scoped) |
| PDF Engine    | Puppeteer                          |
| Analysis Engine | Custom percentile scoring (Node.js) |

---

## Role Hierarchy

```
Super Admin
  └── Admin (Tenant Owner)
        └── Counselor
              └── Student
```

---

## Core Features by Role

### Student
- Profile builder
- Exam score entry
- Data-driven admission probability recommendations
- Student Probability Report (Abstract PDF)
- College explorer & tracker
- Notification center
- Counselor session requests

### Admin (Tenant Owner)
- Tenant-isolated dashboard
- Create/manage students & counselors
- Upload cutoff data (manual + CSV)
- Manage sessions
- Create/publish notifications
- Tenant analytics

### Counselor
- Assigned student management
- Session scheduling & management
- Detailed counselor report generation (PDF)
- Notification publishing

### Super Admin
- Platform-wide analytics
- Admin account management
- Sponsored college management
- Revenue tracking

---

## Documentation Index

| File | Description |
|------|-------------|
| [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) | Architecture decisions, system context |
| [docs/PROJECT_LOG.md](docs/PROJECT_LOG.md) | Phase-by-phase progress log |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Full schema with versioning |
| [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | All API routes and contracts |
| [docs/TENANT_ARCHITECTURE.md](docs/TENANT_ARCHITECTURE.md) | Multi-tenant isolation strategy |
| [database/migrations/](database/migrations/) | SQL migration files |
| [database/rls_policies.sql](database/rls_policies.sql) | Row-level security policies |

---

## Schema Version

**Current:** `v1.3.0`

---

## Development Status

See [docs/PROJECT_LOG.md](docs/PROJECT_LOG.md) for detailed progress.

| Phase | Title | Status |
|-------|-------|--------|
| 1 | Foundation — Docs, Schema, Folder Structure | Done |
| 2 | Authentication System (All Roles) | Done |
| 3 | Admin Dashboard + Student/Counselor CRUD | Done |
| 4 | Student Profile + Exam Score Entry | Done |
| 5 | Prediction Engine (Cutoff-based Matching) | Done |
| 6 | Report Generation (Both Types) | Done |
| 7 | Notifications Engine | Done |
| 8 | Counselor Flow + Session Management | Done |
| 9 | Super Admin Portal + Cutoff Management | Done |
| 9.1 | Landing Page Integration | Done |
| 10 | Deployment, RLS hardening, QA | Pending |

---

## License

Private — All rights reserved.
