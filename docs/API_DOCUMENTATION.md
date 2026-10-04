# API DOCUMENTATION

**Project:** Indian Career Guidance Council (ICGC)
**API Version:** v1
**Base URL:** `http://localhost:5000/api/v1` (dev) / `https://<your-railway-app>.railway.app/api/v1` (prod)
**Last Updated:** 2026-03-31

---

## Conventions

- All requests: `Content-Type: application/json` (except file uploads: `multipart/form-data`)
- Authentication: `Authorization: Bearer <JWT_TOKEN>`
- JWT payload: `{ userId, role, tenantId, email, iat, exp }`
- `tenant_id` is **never** accepted from the client body — always injected from the JWT server-side
- All responses follow this envelope:
  ```json
  {
    "success": true | false,
    "data": { } | [ ] | null,
    "message": "Human readable message",
    "error": null | "Error detail"
  }
  ```
- List endpoints include pagination meta:
  ```json
  { "data": [...], "meta": { "page": 1, "totalPages": 3, "total": 45 } }
  ```
- Timestamps: ISO 8601 UTC
- Categories use `OPEN` (not `General`)
- Wrong current password returns **422** (not 401)

---

## Role Hierarchy

```
super_admin  →  admin (tenant)  →  counselor  →  student
```

---

## Public Routes
> No JWT required.

| Method | Route                        | Description                                  |
|--------|------------------------------|----------------------------------------------|
| POST   | `/auth/login`                | Login with email + password; returns JWT     |
| POST   | `/auth/logout`               | Stateless no-op (client clears JWT)          |
| POST   | `/auth/forgot-password`      | Send password reset email (always returns 200)|
| POST   | `/auth/reset-password`       | Reset password using token from email        |
| GET    | `/colleges`                  | Platform-wide college list                   |
| GET    | `/colleges/:id/branches`     | Branches for a college                       |
| POST   | `/public/inquiry`            | Submit landing page session request form     |

### POST `/auth/login`
```json
Request:
{
  "email": "student@example.com",
  "password": "plaintext",
  "role": "student" | "admin" | "counselor" | "super_admin"
}

Response 200:
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { "id": "uuid", "name": "...", "email": "...", "role": "student", "tenantId": "uuid" }
  }
}
```

### POST `/auth/forgot-password`
```json
Request: { "email": "user@example.com", "role": "student" }
Response 200: always returns 200 (security — does not reveal whether email exists)
```

### POST `/auth/reset-password`
```json
Request: { "token": "hex-string-from-email", "newPassword": "newpass123" }
Response 200: { "success": true, "message": "Password reset successfully." }
```

---

## Super Admin Routes
> Requires role: `super_admin`
> Base path: `/superadmin`

| Method | Route                                      | Description                               |
|--------|--------------------------------------------|-------------------------------------------|
| GET    | `/superadmin/dashboard`                    | Platform stats + revenue breakdown        |
| GET    | `/superadmin/admins`                       | List all tenants                          |
| POST   | `/superadmin/admins`                       | Create new admin/tenant                   |
| GET    | `/superadmin/admins/:id`                   | Get tenant details                        |
| PATCH  | `/superadmin/admins/:id`                   | Update tenant                             |
| PATCH  | `/superadmin/admins/:id/toggle-active`     | Enable / disable tenant                   |
| PATCH  | `/superadmin/admins/:id/allocate-tokens`   | Allocate tokens to tenant                 |
| GET    | `/superadmin/colleges`                     | List all colleges with branches           |
| POST   | `/superadmin/colleges`                     | Create college (+ optional first branch)  |
| POST   | `/superadmin/colleges/branches`            | Add branch to existing college            |
| POST   | `/superadmin/colleges/bulk`                | CSV bulk upload colleges + branches       |
| GET    | `/superadmin/colleges/template`            | Download CSV template for colleges        |
| DELETE | `/superadmin/colleges/:id`                 | Delete college (cascades branches)        |
| DELETE | `/superadmin/colleges/branches/:id`        | Delete a branch                           |
| GET    | `/superadmin/cutoff`                       | List all cutoff data (platform-wide)      |
| POST   | `/superadmin/cutoff`                       | Create single cutoff entry                |
| POST   | `/superadmin/cutoff/bulk`                  | CSV bulk upload cutoff data               |
| GET    | `/superadmin/cutoff/template`              | Download cutoff CSV template              |
| DELETE | `/superadmin/cutoff/:id`                   | Delete cutoff entry                       |
| GET    | `/superadmin/top-colleges`                 | List top/explore colleges                 |
| POST   | `/superadmin/top-colleges`                 | Add college to explore list               |
| POST   | `/superadmin/top-colleges/bulk`            | CSV bulk upload top colleges              |
| GET    | `/superadmin/top-colleges/template`        | Download top-colleges CSV template        |
| DELETE | `/superadmin/top-colleges/:id`             | Delete from explore list                  |
| PATCH  | `/superadmin/top-colleges/:id/toggle-sponsored` | Toggle sponsorship on/off           |
| GET    | `/superadmin/notifications`                | Super admin notification inbox            |
| PATCH  | `/superadmin/notifications/:id/read`       | Mark notification read                    |
| PATCH  | `/superadmin/notifications/read-all`       | Mark all read                             |

### Dashboard Revenue Response
```json
{
  "totalRevenue": 125000,
  "tokenRevenue": 100000,
  "sponsorshipRevenue": 25000,
  "totalTokensAllocated": 100,
  "totalTokensUsed": 87,
  "totalAdmins": 12,
  "totalStudents": 87
}
```

### POST `/superadmin/colleges` — College Creation
```json
Request:
{
  "name": "Government College of Engineering, Pune",
  "short_name": "GCEP",
  "college_type": "Government",
  "state": "Maharashtra",
  "location": "Pune",
  "affiliation": "SPPU",
  "website": "https://coep.org",
  "branch_name": "Computer Engineering",   // optional first branch
  "branch_code": "CO",
  "total_seats": 60
}
```

### POST `/superadmin/colleges/bulk` — CSV Columns
| Column | Required | Notes |
|--------|----------|-------|
| college_name | Yes | Case-insensitive deduplicate |
| short_name | No | |
| college_type | Yes | Government / Private / Aided / Autonomous |
| state | No | |
| location | No | City |
| affiliation | No | University name |
| website | No | |
| branch_name | No | Leave blank for college-only row |
| branch_code | No | |
| total_seats | No | Integer |

### POST `/superadmin/cutoff` — Cutoff Entry
```json
{
  "collegeId": "uuid",           // existing college
  "newCollegeName": "...",       // OR new college name
  "collegeType": "Private",      // required if newCollegeName
  "branchId": "uuid",            // existing branch
  "newBranchName": "...",        // OR new branch name
  "year": 2024,
  "round": 1,
  "category": "OPEN",
  "examType": "MHT_CET",
  "cutoffPercentile": 98.5,
  "city": "Pune",
  "dteCode": "4832",
  "courseCode": "CO"
}
```

### PATCH `/superadmin/top-colleges/:id/toggle-sponsored`
```json
// To enable sponsorship:
{ "sponsored": true, "amount": 15000, "sponsoredUntil": "2026-12-31T00:00:00Z" }

// To remove sponsorship:
{ "sponsored": false }
```

---

## Admin Routes
> Requires role: `admin`. All queries auto-filtered by `tenant_id` from JWT.
> Base path: `/admin`

| Method | Route                                    | Description                              |
|--------|------------------------------------------|------------------------------------------|
| GET    | `/admin/dashboard`                       | Tenant analytics                         |
| GET    | `/admin/students`                        | List all students in tenant              |
| POST   | `/admin/students`                        | Create student (consumes 1 token)        |
| GET    | `/admin/students/:id`                    | Student detail                           |
| PATCH  | `/admin/students/:id`                    | Update student                           |
| PATCH  | `/admin/students/:id/toggle-active`      | Enable / disable student                 |
| PATCH  | `/admin/students/:id/assign-counselor`   | Assign counselor to student              |
| GET    | `/admin/counselors`                      | List all counselors in tenant            |
| POST   | `/admin/counselors`                      | Create counselor                         |
| GET    | `/admin/counselors/:id`                  | Counselor detail                         |
| PATCH  | `/admin/counselors/:id`                  | Update counselor                         |
| PATCH  | `/admin/counselors/:id/toggle-active`    | Enable / disable counselor               |
| POST   | `/admin/notifications`                   | Broadcast notification to tenant         |
| GET    | `/admin/notifications`                   | List tenant notifications                |
| PATCH  | `/admin/notifications/:id/read`          | Mark read                                |
| PATCH  | `/admin/notifications/read-all`          | Mark all read                            |
| GET    | `/admin/inquiries`                       | List landing page inquiries (Apeksha only)|
| PATCH  | `/admin/inquiries/:id`                   | Update inquiry status                    |

---

## Counselor Routes
> Requires role: `counselor`. Auto-filtered by `tenant_id` + `counselor_id`.
> Base path: `/counselor`

| Method | Route                                        | Description                                   |
|--------|----------------------------------------------|-----------------------------------------------|
| GET    | `/counselor/dashboard`                       | Counselor home stats                          |
| GET    | `/counselor/students`                        | List assigned students                        |
| GET    | `/counselor/students/:id`                    | Student detail + full profile                 |
| PATCH  | `/counselor/students/:id/toggle-predictions` | Enable/disable predictions for student        |
| GET    | `/counselor/students/:id/report`             | Generate counselor-detailed PDF report        |
| GET    | `/counselor/sessions`                        | List sessions + Requests tab                  |
| POST   | `/counselor/sessions`                        | Create/schedule session                       |
| PATCH  | `/counselor/sessions/:id`                    | Update session (status / notes / link)        |
| DELETE | `/counselor/sessions/:id`                    | Cancel session                                |
| GET    | `/counselor/sessions/requests`               | List pending session requests                 |
| PATCH  | `/counselor/sessions/requests/:id`           | Accept (schedule) or Decline request          |
| POST   | `/counselor/notifications`                   | Send notification to assigned students        |
| GET    | `/counselor/notifications`                   | View tenant notifications                     |
| PATCH  | `/counselor/notifications/:id/read`          | Mark read                                     |
| PATCH  | `/counselor/notifications/read-all`          | Mark all read                                 |

---

## Student Routes
> Requires role: `student`. Auto-filtered by `student_id` + `tenant_id`.
> Base path: `/student`

### Profile
| Method | Route                     | Description                           |
|--------|---------------------------|---------------------------------------|
| GET    | `/student/profile`        | Get own full profile                  |
| PATCH  | `/student/profile`        | Update any profile section            |

### Exam Scores
| Method | Route                     | Description                           |
|--------|---------------------------|---------------------------------------|
| GET    | `/student/scores`         | List own exam scores                  |
| POST   | `/student/scores`         | Add exam score                        |
| PATCH  | `/student/scores/:id`     | Update exam score                     |
| DELETE | `/student/scores/:id`     | Delete exam score                     |

### Predictions (Data-driven Recommendations)
| Method | Route                         | Description                               |
|--------|-------------------------------|-------------------------------------------|
| POST   | `/student/predictions/run`    | Run prediction (requires predictions_enabled)|
| GET    | `/student/predictions`        | List own predictions                      |
| DELETE | `/student/predictions`        | Clear all predictions (re-run fresh)      |

> **Note:** Returns 403 if `students.predictions_enabled = false`.

### College Preferences
| Method | Route                             | Description                       |
|--------|-----------------------------------|-----------------------------------|
| GET    | `/student/college-preferences`    | List Dream/Target/Safe colleges   |
| POST   | `/student/college-preferences`    | Add college to a category         |
| DELETE | `/student/college-preferences/:id`| Remove college preference         |

### Documents
| Method | Route                        | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/student/documents`         | List uploaded documents  |
| POST   | `/student/documents`         | Upload document (multipart)|
| DELETE | `/student/documents/:id`     | Delete document          |

### Reports
| Method | Route                          | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | `/student/reports`             | List own reports               |
| POST   | `/student/reports/generate`    | Generate student summary PDF   |
| GET    | `/student/reports/:id/download`| Download PDF                   |

### Sessions
| Method | Route                       | Description                              |
|--------|-----------------------------|------------------------------------------|
| GET    | `/student/sessions`         | View own sessions (read-only)            |
| GET    | `/student/sessions/request` | Get current session request status       |
| POST   | `/student/sessions/request` | Submit session request to counselor      |

### Notifications
| Method | Route                                | Description         |
|--------|--------------------------------------|---------------------|
| GET    | `/student/notifications`             | List notifications  |
| PATCH  | `/student/notifications/:id/read`    | Mark read           |
| PATCH  | `/student/notifications/read-all`    | Mark all read       |

### Explore Colleges
| Method | Route                          | Description                        |
|--------|--------------------------------|------------------------------------|
| GET    | `/student/explore`             | Browse all top colleges (paginated)|
| GET    | `/student/explore/sponsored`   | Sponsored colleges (active only)   |
| GET    | `/student/explore/bookmarks`   | Student's bookmarked colleges      |
| POST   | `/student/explore/bookmarks`   | Bookmark a college                 |
| DELETE | `/student/explore/bookmarks/:id`| Remove bookmark                   |

### Branches
| Method | Route                      | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/student/branches`        | All platform branch names (for form dropdowns) |

---

## Error Codes

| HTTP Code | Meaning                                       |
|-----------|-----------------------------------------------|
| 200       | Success                                       |
| 201       | Created                                       |
| 400       | Bad request / validation failure              |
| 401       | Unauthenticated (missing/invalid/expired JWT) |
| 403       | Forbidden (role mismatch, tenant violation, or feature disabled) |
| 404       | Resource not found                            |
| 409       | Conflict (duplicate entry)                    |
| 422       | Unprocessable entity (wrong current password, invalid field) |
| 500       | Internal server error                         |

---

## Middleware Stack

```
Request
  → validateJWT()        — verify + decode JWT; attach { userId, role, tenantId, email }
  → requireRole([roles]) — reject if role not in allowed list
  → requireTenant()      — on tenant-scoped routes: reject if tenantId missing
  → Controller
  → sendSuccess() / sendError()
```

---

## Authentication Notes

- Auth is **custom bcrypt** (NOT Supabase Auth) — passwords hashed with `bcryptjs`
- All four user tables (`super_admins`, `admins`, `counselors`, `students`) have `password_hash`
- Forgot-password flow: custom token table (`password_reset_tokens`), email via `nodemailer`
- Required env vars for email: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `FRONTEND_URL`
- JWT is stateless — logout is a client-side clear only; server `/auth/logout` is a no-op

---

## Key Business Rules

| Rule | Detail |
|------|--------|
| Token gate | Student creation requires `consume_token(admin_id)` RPC to succeed |
| Revenue | `tokenRevenue = tokens_allocated × ₹1,000` + `sponsorshipRevenue = SUM(sponsorship_amount)` |
| Predictions gate | `students.predictions_enabled` must be `true` — counselor enables per student |
| Cutoff scope | Platform-wide since v1.22.0 — no tenant filter on prediction engine |
| Session notes | Never returned to student via any endpoint |
| Sponsored expiry | `sponsored_until` checked server-side; expired treated as `is_sponsored = false` in student views |
| Inquiry access | `GET/PATCH /admin/inquiries` gated to `apekshakamble007@gmail.com` only |
| Terminology | Never use "AI" — always "recommendations" or "data-driven analysis" |

---

*API Version: v1 — All routes prefixed with `/api/v1`. Update this doc with every new route.*
