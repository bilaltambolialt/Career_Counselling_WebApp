# DATABASE SCHEMA

**Project:** Indian Career Guidance Council (ICGC)
**Schema Version:** v1.29.0
**Database:** Supabase (PostgreSQL)
**Last Updated:** 2026-03-31

---

## Design Principles

1. Every tenant-scoped table has a `tenant_id` column (FK → `admins.id`)
2. UUIDs used for all primary keys
3. `created_at` / `updated_at` on tables where mutation tracking is needed
4. Soft deletes via `is_active` where applicable
5. Backend uses Supabase `service_role` key (bypasses RLS); app-layer enforces tenant isolation
6. RLS policies exist as a secondary backup layer
7. All timestamps in UTC (TIMESTAMPTZ)

---

## Table Index

| #  | Table Name                    | Scope          | Has tenant_id        |
|----|-------------------------------|----------------|----------------------|
| 1  | `super_admins`                | Platform       | No                   |
| 2  | `admins`                      | Platform       | No (IS the tenant)   |
| 3  | `counselors`                  | Tenant         | Yes                  |
| 4  | `students`                    | Tenant         | Yes                  |
| 5  | `student_profiles`            | Tenant         | Yes                  |
| 6  | `student_exam_scores`         | Tenant         | Yes                  |
| 7  | `colleges`                    | Platform       | No                   |
| 8  | `college_branches`            | Platform       | No                   |
| 9  | `cutoff_data`                 | Platform       | Nullable (legacy)    |
| 10 | `predictions`                 | Tenant         | Yes                  |
| 11 | `student_documents`           | Tenant         | Yes                  |
| 12 | `student_college_preferences` | Tenant         | Yes                  |
| 13 | `student_college_bookmarks`   | Tenant         | Yes                  |
| 14 | `counseling_sessions`         | Tenant         | Yes                  |
| 15 | `session_requests`            | Tenant         | Yes                  |
| 16 | `notifications`               | Tenant/Platform| Yes (nullable)       |
| 17 | `top_colleges`                | Platform       | No                   |
| 18 | `password_reset_tokens`       | Platform       | No                   |
| 19 | `landing_inquiries`           | Platform       | No                   |

---

## Table Definitions

---

### 1. `super_admins`
Platform-level administrator. Single or very few accounts.

| Column        | Type         | Constraints          | Description                        |
|---------------|--------------|----------------------|------------------------------------|
| id            | uuid         | PK, default gen_uuid |                                    |
| name          | varchar(150) | NOT NULL             |                                    |
| email         | varchar(255) | UNIQUE, NOT NULL     | Login email                        |
| password_hash | varchar(255) | NOT NULL             | bcryptjs hash                      |
| is_active     | boolean      | default true         |                                    |
| created_at    | timestamptz  | default now()        |                                    |
| updated_at    | timestamptz  | default now()        |                                    |

---

### 2. `admins`
**Tenant owners.** Each Admin record = one isolated tenant. `admins.id` is used as `tenant_id` throughout the system.

| Column              | Type         | Constraints           | Description                              |
|---------------------|--------------|-----------------------|------------------------------------------|
| id                  | uuid         | PK, default gen_uuid  | Also the tenant_id for this tenant       |
| name                | varchar(150) | NOT NULL              |                                          |
| email               | varchar(255) | UNIQUE, NOT NULL      | Login email                              |
| password_hash       | varchar(255) | NOT NULL              | bcryptjs hash                            |
| must_change_password| boolean      | default false         | Force password change on next login      |
| organization_name   | varchar(255) | NOT NULL              | Counselling org / institute name         |
| phone               | varchar(20)  | NULL                  |                                          |
| city                | varchar(100) | NULL                  |                                          |
| state               | varchar(100) | NULL                  |                                          |
| is_active           | boolean      | default true          |                                          |
| tokens_allocated    | integer      | default 0             | Total tokens bought (1 token = 1 student)|
| tokens_used         | integer      | default 0             | Tokens consumed (students created)       |
| created_by          | uuid         | FK → super_admins.id  |                                          |
| created_at          | timestamptz  | default now()         |                                          |
| updated_at          | timestamptz  | default now()         |                                          |

**Token system:** `tokens_remaining = tokens_allocated - tokens_used`. Student creation is gated by `consume_token(p_admin_id)` PostgreSQL RPC (atomic check + decrement).

---

### 3. `counselors`

| Column              | Type         | Constraints             | Description                        |
|---------------------|--------------|-------------------------|------------------------------------|
| id                  | uuid         | PK, default gen_uuid    |                                    |
| tenant_id           | uuid         | NOT NULL, FK → admins.id|                                    |
| name                | varchar(150) | NOT NULL                |                                    |
| email               | varchar(255) | NOT NULL                | Unique per tenant                  |
| password_hash       | varchar(255) | NOT NULL                |                                    |
| must_change_password| boolean      | default false           |                                    |
| phone               | varchar(20)  | NULL                    |                                    |
| specialization      | varchar(150) | NULL                    |                                    |
| is_active           | boolean      | default true            |                                    |
| created_at          | timestamptz  | default now()           |                                    |
| updated_at          | timestamptz  | default now()           |                                    |

**Unique constraint:** `(email, tenant_id)`

---

### 4. `students`

| Column                 | Type         | Constraints              | Description                            |
|------------------------|--------------|--------------------------|----------------------------------------|
| id                     | uuid         | PK, default gen_uuid     |                                        |
| tenant_id              | uuid         | NOT NULL, FK → admins.id |                                        |
| assigned_counselor_id  | uuid         | NULL, FK → counselors.id |                                        |
| name                   | varchar(150) | NOT NULL                 |                                        |
| email                  | varchar(255) | NOT NULL                 |                                        |
| password_hash          | varchar(255) | NOT NULL                 |                                        |
| must_change_password   | boolean      | default false            |                                        |
| phone                  | varchar(20)  | NULL                     |                                        |
| category               | varchar(20)  | NULL                     | OPEN/OBC/SC/ST/EWS/VJ/NT/SEBC         |
| predictions_enabled    | boolean      | default false            | Counselor must enable before student can run predictions |
| is_active              | boolean      | default true             |                                        |
| created_at             | timestamptz  | default now()            |                                        |
| updated_at             | timestamptz  | default now()            |                                        |

**Unique constraint:** `(email, tenant_id)`

---

### 5. `student_profiles`
Extended profile for a student (9 sections in UI).

| Column                      | Type          | Description                                           |
|-----------------------------|---------------|-------------------------------------------------------|
| id                          | uuid          | PK                                                    |
| student_id                  | uuid          | UNIQUE FK → students.id                               |
| tenant_id                   | uuid          | FK → admins.id                                        |
| phone                       | varchar(15)   | Student personal phone                                |
| dob                         | date          |                                                       |
| gender                      | varchar(20)   | Male / Female / Non-binary / Prefer not to say        |
| minority_status             | boolean       | default false                                         |
| state                       | varchar(100)  | State of domicile                                     |
| annual_family_income        | varchar(100)  | Income range string                                   |
| category                    | varchar(20)   | Editable category (OPEN/OBC/SC/ST/EWS/VJ/NT/SEBC)    |
| parent_mobile               | varchar(15)   | Parent / guardian mobile                              |
| college_fee_range           | varchar(50)   | Acceptable fee range per year                         |
| qualification_type          | varchar(20)   | '12th' or 'Diploma'                                   |
| board_12th                  | varchar(100)  |                                                       |
| stream_12th                 | varchar(50)   | PCM / PCB / Commerce / Arts / PCMB / PCM+PCB          |
| percentage_12th             | numeric(5,2)  |                                                       |
| pcm_percentage              | numeric(5,2)  |                                                       |
| pcb_percentage              | numeric(5,2)  |                                                       |
| diploma_board               | varchar(100)  |                                                       |
| diploma_branch              | varchar(150)  |                                                       |
| diploma_percentage          | numeric(5,2)  |                                                       |
| diploma_year_of_passing     | smallint      |                                                       |
| is_drop_year                | boolean       | default false                                         |
| num_attempts                | smallint      | default 1                                             |
| domains_of_interest         | text[]        | Array of domain strings                               |
| preferred_degree_type       | varchar(50)   | BE/BTech/BPharm etc.                                  |
| preferred_branches          | jsonb         | Array of {rank, name} objects                         |
| preferred_states            | text[]        |                                                       |
| preferred_cities            | varchar(255)  |                                                       |
| only_government_colleges    | boolean       | default false                                         |
| private_allowed             | boolean       | default true                                          |
| deemed_universities_allowed | boolean       | default true                                          |
| autonomous_allowed          | boolean       | default true                                          |
| created_at                  | timestamptz   |                                                       |
| updated_at                  | timestamptz   |                                                       |

---

### 6. `student_exam_scores`

| Column         | Type         | Description                                         |
|----------------|--------------|-----------------------------------------------------|
| id             | uuid         | PK                                                  |
| student_id     | uuid         | FK → students.id                                    |
| tenant_id      | uuid         | FK → admins.id                                      |
| exam_type      | varchar(50)  | JEE_MAIN / JEE_ADVANCED / MHT_CET / NEET_UG / NEET_PG / OTHER |
| attempt_year   | smallint     | Year of attempt                                     |
| attempt_number | smallint     | 1st, 2nd, etc.                                      |
| percentile     | numeric(6,4) | 0–100                                               |
| rank           | integer      | AIR or state rank                                   |
| score          | numeric(8,2) | Raw score                                           |
| is_primary     | boolean      | default false — primary score used for predictions  |
| created_at     | timestamptz  |                                                     |
| updated_at     | timestamptz  |                                                     |

---

### 7. `colleges`
Platform-wide master list (not tenant-scoped). Managed by Super Admin.

| Column       | Type         | Constraints                                              |
|--------------|--------------|----------------------------------------------------------|
| id           | uuid         | PK                                                       |
| name         | varchar(255) | NOT NULL                                                 |
| short_name   | varchar(50)  | NULL                                                     |
| location     | varchar(150) | City                                                     |
| state        | varchar(100) |                                                          |
| college_type | varchar(50)  | CHECK: Government / Private / Aided / Autonomous         |
| affiliation  | varchar(150) | Affiliated university                                    |
| website      | varchar(255) |                                                          |
| is_active    | boolean      | default true                                             |
| created_at   | timestamptz  |                                                          |
| updated_at   | timestamptz  |                                                          |

---

### 8. `college_branches`

| Column      | Type         | Constraints                                   |
|-------------|--------------|-----------------------------------------------|
| id          | uuid         | PK                                            |
| college_id  | uuid         | NOT NULL, FK → colleges.id ON DELETE CASCADE  |
| branch_name | varchar(150) | NOT NULL                                      |
| branch_code | varchar(50)  | e.g. CO, ME, CE                               |
| total_seats | smallint     |                                               |
| is_active   | boolean      | default true                                  |
| created_at  | timestamptz  |                                               |

---

### 9. `cutoff_data`
Historical cutoff data. **Platform-wide since v1.22.0** — `tenant_id` is nullable.

| Column            | Type         | Constraints                                   | Notes                        |
|-------------------|--------------|-----------------------------------------------|------------------------------|
| id                | uuid         | PK                                            |                              |
| tenant_id         | uuid         | NULL, FK → admins.id                          | Nullable since v1.22.0       |
| college_id        | uuid         | NOT NULL, FK → colleges.id                    |                              |
| branch_id         | uuid         | NOT NULL, FK → college_branches.id            |                              |
| year              | smallint     | NOT NULL                                      |                              |
| round             | smallint     | NOT NULL                                      | 1–6                          |
| category          | varchar(20)  | NOT NULL                                      | OPEN/OBC/SC/ST/EWS/VJ/NT/SEBC|
| exam_type         | varchar(20)  | NOT NULL                                      | JEE_MAIN/JEE_ADVANCED/MHT_CET/NEET_UG/NEET_PG/OTHER |
| cutoff_percentile | numeric(6,4) | NULL                                          |                              |
| cutoff_rank       | integer      | NULL                                          |                              |
| cutoff_score      | numeric(8,2) | NULL                                          |                              |
| city              | varchar(100) | NULL                                          | v1.9.0                       |
| dte_code          | varchar(50)  | NULL                                          | v1.21.0                      |
| course_code       | varchar(50)  | NULL                                          | v1.21.0                      |
| created_at        | timestamptz  | default now()                                 |                              |

**Unique index (v1.26.0):** `(college_id, branch_id, year, round, category, exam_type, city, cutoff_percentile, cutoff_rank, cutoff_score, dte_code, course_code) NULLS NOT DISTINCT` — prevents duplicate rows on re-upload.

---

### 10. `predictions`
Percentile-based cutoff matching results. Referred to as "recommendations" in the UI (never "AI").

| Column                | Type         | Description                                     |
|-----------------------|--------------|-------------------------------------------------|
| id                    | uuid         | PK                                              |
| student_id            | uuid         | FK → students.id                                |
| tenant_id             | uuid         | FK → admins.id                                  |
| college_id            | uuid         | FK → colleges.id                                |
| branch_id             | uuid         | FK → college_branches.id                        |
| exam_score_id         | uuid         | FK → student_exam_scores.id ON DELETE CASCADE   |
| probability_percentage| numeric(5,2) | 0.00–100.00                                     |
| confidence_score      | numeric(4,3) | 0.000–1.000                                     |
| classification        | varchar(20)  | Dream / Safe / Backup                           |
| risk_level            | varchar(20)  | Low / Medium / High                             |
| score_diff_pct        | numeric(6,2) |                                                 |
| avg_cutoff_used       | numeric(8,2) |                                                 |
| trend_shift           | numeric(6,2) |                                                 |
| strategy_suggestion   | text         |                                                 |
| created_at            | timestamptz  |                                                 |

---

### 11. `student_documents`
Uploaded documents for a student (v1.5.0).

| Column       | Type         | Description                                      |
|--------------|--------------|--------------------------------------------------|
| id           | uuid         | PK                                               |
| student_id   | uuid         | FK → students.id                                 |
| tenant_id    | uuid         | FK → admins.id                                   |
| doc_type     | varchar(100) | e.g. marksheet_10th, marksheet_12th, aadhar      |
| file_url     | text         | Supabase Storage URL                             |
| file_name    | varchar(255) |                                                  |
| uploaded_at  | timestamptz  | default now()                                    |

---

### 12. `student_college_preferences`
Dream / Target / Safe college shortlist per student (v1.8.0).

| Column          | Type        | Description                               |
|-----------------|-------------|-------------------------------------------|
| id              | uuid        | PK                                        |
| student_id      | uuid        | FK → students.id                          |
| tenant_id       | uuid        | FK → admins.id                            |
| college_id      | uuid        | FK → colleges.id                          |
| category        | varchar(20) | dream / target / safe                     |
| added_at        | timestamptz | default now()                             |

**Unique constraint:** `(student_id, college_id, category)`
**Max 5 per category** — enforced at app layer.

---

### 13. `student_college_bookmarks`
Student bookmarks from Explore Colleges page (v1.16.0).

| Column      | Type        | Description              |
|-------------|-------------|--------------------------|
| id          | uuid        | PK                       |
| student_id  | uuid        | FK → students.id         |
| tenant_id   | uuid        | FK → admins.id           |
| college_id  | uuid        | FK → top_colleges.id     |
| created_at  | timestamptz | default now()            |

---

### 14. `counseling_sessions`
Scheduled counseling sessions (v1.12.0).

| Column        | Type         | Description                                         |
|---------------|--------------|-----------------------------------------------------|
| id            | uuid         | PK                                                  |
| student_id    | uuid         | FK → students.id                                    |
| counselor_id  | uuid         | FK → counselors.id                                  |
| tenant_id     | uuid         | FK → admins.id                                      |
| scheduled_at  | timestamptz  | Session date/time                                   |
| duration_mins | smallint     | Always 60                                           |
| status        | varchar(30)  | scheduled / completed / cancelled                   |
| meeting_link  | varchar(255) | Video call URL                                      |
| notes         | text         | Counselor-only notes (never returned to students)   |
| created_at    | timestamptz  |                                                     |
| updated_at    | timestamptz  |                                                     |

---

### 15. `session_requests`
Student-initiated session requests (v1.14.0).

| Column       | Type        | Description                                        |
|--------------|-------------|----------------------------------------------------|
| id           | uuid        | PK                                                 |
| student_id   | uuid        | FK → students.id                                   |
| counselor_id | uuid        | FK → counselors.id (assigned counselor)            |
| tenant_id    | uuid        | FK → admins.id                                     |
| message      | text        | Optional student note                              |
| status       | varchar(20) | pending / accepted / declined                      |
| created_at   | timestamptz |                                                    |
| updated_at   | timestamptz |                                                    |

---

### 16. `notifications`

| Column            | Type         | Description                                            |
|-------------------|--------------|--------------------------------------------------------|
| id                | uuid         | PK                                                     |
| tenant_id         | uuid         | NULL = platform-wide; set = tenant-scoped              |
| created_by        | uuid         | admin.id / counselor.id / super_admin.id               |
| created_by_role   | varchar(30)  | admin / counselor / super_admin                        |
| title             | varchar(255) |                                                        |
| message           | text         |                                                        |
| type              | varchar(50)  | general / session_scheduled / session_cancelled / session_request / session_declined / token_request |
| recipient_role    | varchar(30)  | student / counselor / admin / super_admin / all        |
| recipient_id      | uuid         | NULL = broadcast; set = targeted to one user           |
| link              | varchar(255) | Optional deep-link path                                |
| is_read           | boolean      | default false                                          |
| created_at        | timestamptz  |                                                        |

---

### 17. `top_colleges`
Curated college lists managed by Super Admin (v1.15.0). Used in student Explore page.

| Column             | Type          | Description                                     |
|--------------------|---------------|-------------------------------------------------|
| id                 | uuid          | PK                                              |
| name               | varchar(255)  | NOT NULL                                        |
| location           | varchar(150)  |                                                 |
| state              | varchar(100)  |                                                 |
| college_type       | varchar(50)   | Government / Private / Aided / Autonomous       |
| ranking            | integer       | National ranking                                |
| field              | varchar(100)  | Engineering / Medical / Law / etc.              |
| program            | varchar(255)  | Specific program name                           |
| dte_code           | varchar(50)   | v1.17.0                                         |
| branch_code        | varchar(50)   | v1.17.0                                         |
| is_sponsored       | boolean       | default false — v1.20.0                         |
| sponsorship_amount | numeric(12,2) | Amount paid for sponsorship                     |
| sponsored_from     | timestamptz   | Sponsorship start date                          |
| sponsored_until    | timestamptz   | Sponsorship expiry — auto-expires in student view|
| created_at         | timestamptz   |                                                 |
| updated_at         | timestamptz   |                                                 |

**Sponsored logic:** Active = `is_sponsored = true AND (sponsored_until IS NULL OR sponsored_until > now())`. Sponsored colleges appear first in Explore and Predictions pages with an amber **S** badge.

---

### 18. `password_reset_tokens`
Custom token-based forgot-password flow (v1.27.0). Used because auth is custom bcrypt (not Supabase Auth).

| Column     | Type         | Description                          |
|------------|--------------|--------------------------------------|
| id         | uuid         | PK                                   |
| email      | varchar(255) | NOT NULL                             |
| role       | varchar(50)  | student / counselor / admin / super_admin |
| token      | varchar(128) | UNIQUE — 96-char hex (crypto.randomBytes) |
| expires_at | timestamptz  | now() + 1 hour                       |
| used       | boolean      | default false — marked true after reset |
| created_at | timestamptz  |                                      |

---

### 19. `landing_inquiries`
Public session request submissions from landing page (v1.23.0).

| Column        | Type         | Description                                |
|---------------|--------------|--------------------------------------------|
| id            | uuid         | PK                                         |
| name          | varchar(255) | NOT NULL                                   |
| email         | varchar(255) | NOT NULL                                   |
| phone         | varchar(20)  |                                            |
| qualification | varchar(100) | Student's current qualification            |
| concern       | varchar(100) | Category of concern                        |
| concern_detail| text         | Free-text if concern = 'other'             |
| status        | varchar(20)  | new / contacted / closed — default 'new'  |
| created_at    | timestamptz  | default now()                              |

---

## PostgreSQL Functions / RPCs

| Function                  | Description                                                     |
|---------------------------|-----------------------------------------------------------------|
| `consume_token(p_admin_id uuid)` | Atomic token gate on student creation. Returns true if token consumed, false if insufficient tokens. |

---

## Schema Migration History

| Version  | Description                                                              |
|----------|--------------------------------------------------------------------------|
| v1.0.0   | Initial schema — 18 tables                                               |
| v1.1.0   | password_hash, must_change_password, expanded exam types                 |
| v1.2.0   | category constraint changed General → OPEN; students.category nullable   |
| v1.3.0   | Gender constraint expanded; attempt_year rename; attempt_number added    |
| v1.4.0   | exam_type CHECK on cutoff_data; stream-based prediction filtering        |
| v1.5.0   | 17 new cols on student_profiles + student_documents table                |
| v1.6.0   | 5 diploma cols on student_profiles                                       |
| v1.7.0   | ON DELETE CASCADE on predictions.exam_score_id FK                        |
| v1.8.0   | student_college_preferences table (Dream/Target/Safe)                    |
| v1.9.0   | Nullable city on cutoff_data                                             |
| v1.10.0  | notifications table                                                      |
| v1.11.0  | PCM+PCB stream; autonomous_allowed on student_profiles                   |
| v1.12.0  | counseling_sessions table                                                |
| v1.13.0  | predictions_enabled BOOLEAN DEFAULT FALSE on students                    |
| v1.14.0  | session_requests table                                                   |
| v1.15.0  | top_colleges table                                                       |
| v1.16.0  | student_college_bookmarks table                                          |
| v1.17.0  | dte_code + branch_code on top_colleges                                   |
| v1.18.0  | tokens_allocated + tokens_used on admins                                 |
| v1.19.0  | notifications: recipient_role adds 'super_admin'; type adds 'token_request'|
| v1.20.0  | is_sponsored on top_colleges + consume_token() RPC                       |
| v1.21.0  | dte_code + course_code on cutoff_data                                    |
| v1.22.0  | cutoff_data.tenant_id made nullable (centralized platform-wide cutoff)   |
| v1.23.0  | landing_inquiries table                                                  |
| v1.24.0  | sponsorship_amount + sponsored_from + sponsored_until on top_colleges    |
| v1.26.0  | Dedup existing rows + unique index on cutoff_data NULLS NOT DISTINCT     |
| v1.27.0  | password_reset_tokens table                                              |
| v1.28.0  | sponsorship_amount, sponsored_from, sponsored_until on top_colleges      |
| v1.29.0  | parent_mobile + college_fee_range on student_profiles                    |

---

## Entity Relationship Summary

```
super_admins ──creates──► admins (tenant)
admins ──creates──► counselors
admins ──creates──► students          [gated by consume_token()]
counselors ──assigned──► students
students ──has one──► student_profiles
students ──has many──► student_exam_scores
students ──has many──► student_documents
students ──has many──► student_college_preferences
students ──has many──► student_college_bookmarks
students ──has many──► predictions
colleges ──has many──► college_branches
cutoff_data ──refs──► colleges, college_branches    [platform-wide, no tenant filter]
predictions ──refs──► students, colleges, college_branches, student_exam_scores
counseling_sessions ──refs──► students, counselors
session_requests ──refs──► students, counselors
notifications ──belongs to──► admins (tenant) or platform
top_colleges ──is─► sponsored (is_sponsored=true)
landing_inquiries  ──public (no auth)──► managed by super admin
password_reset_tokens ──belongs to──► any role user
```

---

*Schema Version: v1.29.0 — Always create a migration file in `database/migrations/`. Never modify tables directly in production.*
