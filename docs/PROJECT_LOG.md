# PROJECT LOG

**Project:** College Admission Prediction & Notification Web Application
**Last Updated:** 2026-03-08 (Phase 9 — Super Admin Portal + Cutoff Management)

---

## Phase Status Summary

| Phase | Title                                           | Status      | Date       |
|-------|-------------------------------------------------|-------------|------------|
| 1     | Foundation — Docs, Schema, Folder Structure     | Done        | 2026-02-24 |
| 2     | Authentication System (All Roles)               | Done        | 2026-02-24 |
| 3     | Admin Dashboard + Student/Counselor CRUD        | Done        | 2026-02-24 |
| 4     | Student Profile + Exam Score Entry              | Done        | 2026-02-25 |
| 5     | Prediction Engine (Cutoff-based Matching)       | Done        | 2026-02-28 |
| 5.1   | Bug Fixes + Profile Builder + Exam Stream Filter| Done        | 2026-03-02 |
| 5.2   | Profile Enhancements + Diploma + Branch Dropdowns| Done       | 2026-03-03 |
| 5.3   | College Preferences Section (Dream/Target/Safe)  | Done        | 2026-03-03 |
| 6     | Report Generation (Both Types)                  | Done        | 2026-03-04 |
| 7     | Notifications Engine                            | Done        | 2026-03-04 |
| 7.1   | Post-Phase 7 Fixes + Profile Enhancements       | Done        | 2026-03-08 |
| 8     | Counselor Flow + Session Management             | Done        | 2026-03-08 |
| 8.1   | Post-Phase 8 Fixes + Counselor Enhancements     | Done        | 2026-03-08 |
| 9     | Super Admin Portal + Cutoff Mgmt                | Done        | 2026-03-08 |
| 9.1   | Landing Page Integration into Frontend          | Done        | 2026-03-11 |
| 10    | Deployment, RLS Hardening, QA                   | Pending     | —          |

---

## PHASE 1 ✅ DONE — Foundation
- Docs, schema v1.0.0, RLS policies, folder skeleton, .env.example

## PHASE 2 ✅ DONE — Authentication
- Email+password auth, bcrypt+JWT, 4 role login pages, portal selector, AuthContext, ProtectedRoute, DashboardShell, placeholder dashboards, migration v1.1.0

---

## PHASE 3 ✅ DONE — Admin Dashboard

**Status:** Done | **Completed:** 2026-02-24

### Delivered
- [x] `database/seeds/02_seed_colleges.sql` — 13 colleges + branches
- [x] `backend/src/controllers/admin/dashboardController.js`
- [x] `backend/src/controllers/admin/studentController.js` — list, create, get, update, deactivate, assign counselor
- [x] `backend/src/controllers/admin/counselorController.js` — list, create, get, update, deactivate
- [x] `backend/src/controllers/admin/cutoffController.js` — form entry, CSV upload, template download, delete
- [x] `backend/src/controllers/colleges/collegesController.js` — list + branches
- [x] `backend/src/routes/admin/index.js`
- [x] `backend/src/routes/colleges/index.js`
- [x] `frontend/src/services/adminService.js`
- [x] `frontend/src/services/collegeService.js`
- [x] `frontend/src/components/ui/Pagination.jsx`
- [x] `frontend/src/components/ui/ConfirmModal.jsx`
- [x] `frontend/src/components/ui/StatusBadge.jsx`
- [x] `frontend/src/components/layout/AdminSidebar.jsx`
- [x] `frontend/src/pages/admin/AdminDashboard.jsx`
- [x] `frontend/src/pages/admin/StudentsPage.jsx`
- [x] `frontend/src/pages/admin/CreateStudentPage.jsx`
- [x] `frontend/src/pages/admin/StudentDetailPage.jsx`
- [x] `frontend/src/pages/admin/CounselorsPage.jsx`
- [x] `frontend/src/pages/admin/CreateCounselorPage.jsx`
- [x] `frontend/src/pages/admin/CutoffPage.jsx`

### Post-Phase Bug Fixes (2026-02-25)
- Fixed API response shape: all list controllers now use `sendSuccess(res, array, msg, 200, meta)` pattern
- Fixed category constraint: DB used `'General'` but code used `'OPEN'` — resolved via migration v1.2.0
- Fixed `collegesController` returning nested objects instead of flat arrays
- Fixed HTTP method mismatches: deactivate = DELETE, assignCounselor = POST

---

## PHASE 4 ✅ DONE — Student Profile + Exam Score Entry

**Status:** Done | **Completed:** 2026-02-25

### Delivered
- [x] `backend/src/routes/student/index.js` — student routes (validateJWT + requireRole)
- [x] `backend/src/controllers/student/dashboardController.js` — profile %, scores, counselor
- [x] `backend/src/controllers/student/profileController.js` — get + upsert student_profiles
- [x] `backend/src/controllers/student/examScoresController.js` — CRUD on student_exam_scores
- [x] `backend/src/index.js` — registered /api/v1/student routes
- [x] `frontend/src/services/studentService.js`
- [x] `frontend/src/components/layout/StudentSidebar.jsx`
- [x] `frontend/src/pages/auth/ChangePasswordPage.jsx` — forced on first login (mustChangePassword)
- [x] `frontend/src/pages/student/StudentDashboard.jsx` — real stats, profile bar, recent scores
- [x] `frontend/src/pages/student/ProfilePage.jsx` — DOB, gender, city, state, branch, exam
- [x] `frontend/src/pages/student/ExamScoresPage.jsx` — add / edit / delete scores
- [x] `frontend/src/context/AuthContext.jsx` — added updateUser()
- [x] `frontend/src/components/layout/ProtectedRoute.jsx` — mustChangePassword redirect
- [x] `frontend/src/App.jsx` — Phase 4 routes + /change-password

---

## PHASE 5 ✅ DONE — Prediction Engine (Cutoff-based Matching)

**Status:** Done | **Completed:** 2026-02-28

### Delivered
- [x] `backend/src/controllers/student/predictionController.js` — `listPredictions`, `generatePredictions`, `clearPredictions`
- [x] `backend/src/routes/student/index.js` — added GET/POST/DELETE `/predictions` routes
- [x] `backend/src/controllers/student/dashboardController.js` — added `predictionCount` to dashboard response
- [x] `frontend/src/services/studentService.js` — added `fetchPredictions`, `generatePredictions`, `clearPredictions`
- [x] `frontend/src/pages/student/PredictionsPage.jsx` — full recommendations UI with probability bars, classification badges, strategy hints
- [x] `frontend/src/components/layout/StudentSidebar.jsx` — added Recommendations nav link
- [x] `frontend/src/App.jsx` — added `/student/predictions` route
- [x] `frontend/src/pages/student/StudentDashboard.jsx` — predictions stat card now live + clickable
- [x] Removed all "AI" terminology — replaced with "recommendations", "data-driven analysis", "personalised"

### Algorithm — Percentile Gap Classification
- Student's best percentile (or rank) compared against avg historical cutoff (last 2 years) per college+branch
- `gap = student_percentile − avg_cutoff_percentile`
- **Backup**: gap ≥ 10 → prob 85–97%, Risk: Low (safety school)
- **Safe**: 0 ≤ gap < 10 → prob 50–75%, Risk: Medium (good match)
- **Dream**: −15 ≤ gap < 0 → prob 10–50%, Risk: High (stretch goal)
- Gap < −15 → skipped (too far below cutoff)
- Trend shift computed for colleges with multi-year data
- Algorithm version tagged as `v1.0` in DB

### Post-Phase Notes
- `database/migrations/v1_3_0_fix_schema_bugs.sql` — pending execution (gender constraint, attempt_year rename, attempt_number column)
- Run v1.3.0 migration before testing exam score + prediction flow end-to-end

---

## PHASE 5.1 ✅ DONE — Bug Fixes + Profile Builder + Exam Stream Filter

**Status:** Done | **Completed:** 2026-03-02

### Bug Fixes
- **403 on admin cutoff routes** — diagnosed: valid JWT with wrong role in localStorage; fix: clear localStorage + re-login as admin
- **CSV upload 0 inserted** — two bugs: (1) UI rendered `e.error` instead of `e.message` → row errors were blank; (2) colleges seed not run → all college lookups failed
- **CSV BOM stripping** — added `bom: true` to csv-parse options so Excel-saved files parse correctly
- **exam_type missing from cutoff_data** — NEET students were receiving engineering recommendations; root cause: no stream filter on cutoff fetch

### Exam Stream Filtering (migration v1.4.0)
- Added `exam_type VARCHAR(20)` column to `cutoff_data` table
- `cutoffController.js` — all operations (create, bulk upload, list, template) now include `exam_type`; template updated
- `predictionController.js` rewritten — algorithm v1.1:
  - Computes best score **per exam type** (not one global best)
  - Fetches cutoffs filtered by `.in('exam_type', examTypes)` — NEET students never see engineering cutoffs
  - Groups by `college_id::branch_id::exam_type` — one college can appear in multiple exam streams
- `CutoffPage.jsx` — added Exam column to cutoff list table
- `sample_cutoff_data.csv` updated with `exam_type` column (IITs→JEE_ADVANCED, NITs→JEE_MAIN, Maharashtra→MHT_CET, AIIMS/KEM→NEET_UG/NEET_PG)

### Student Profile Builder (migration v1.5.0)
- **17 new columns** on `student_profiles`: minority_status, annual_family_income, board_12th, stream_12th, percentage_12th, pcm_percentage, pcb_percentage, is_drop_year, num_attempts, domains_of_interest (JSONB), preferred_degree_type, preferred_branches (JSONB), preferred_states (JSONB), preferred_cities, only_government_colleges, private_allowed, deemed_universities_allowed
- **New `student_documents` table** — tracks Supabase Storage file uploads (doc_type, file_name, file_path, file_size)
- `backend/src/controllers/student/profileController.js` — handles all 7 sections; joins students table for phone + category; updated `profile_complete` criteria (S1+S2+S4+S5)
- `backend/src/controllers/student/documentController.js` — NEW: listDocuments (signed URLs), uploadDocument (Supabase Storage), deleteDocument
- `backend/src/routes/student/index.js` — added multer (5MB, PDF/JPG/PNG) + 3 document routes
- `frontend/src/pages/student/ProfilePage.jsx` — full rewrite: 7-section left-nav builder, progress bar, per-section save, completion badges
- `frontend/src/services/studentService.js` — added fetchDocuments, uploadDocument, deleteDocument

### Sections in Profile Builder
| # | Section | Save Target | Complete When |
|---|---------|-------------|---------------|
| 1 | Basic Info | student_profiles + students.phone | gender + dob + state filled |
| 2 | Academic Background | student_profiles | board + stream + % filled |
| 3 | Entrance Exams | read-only → links to ExamScoresPage | ≥1 score exists |
| 4 | Domain Preferences | student_profiles (JSONB) | ≥1 domain selected |
| 5 | Course Preferences | student_profiles | degree type filled |
| 6 | Location Preferences | student_profiles (JSONB) | ≥1 state selected |
| 7 | Documents | student_documents + Supabase Storage | ≥1 doc uploaded |

### Required Setup (user actions)
1. Run `database/migrations/v1_4_0_add_exam_type_to_cutoff.sql` in Supabase SQL Editor
2. Run `database/migrations/v1_5_0_student_profile_builder.sql` in Supabase SQL Editor
3. Create Storage bucket `student-documents` (Private) in Supabase Dashboard → Storage
4. Clear and re-upload cutoff data using updated `database/seeds/sample_cutoff_data.csv`

---

## PHASE 5.2 ✅ DONE — Profile Builder Enhancements + Bug Fixes

**Status:** Done | **Completed:** 2026-03-03

### Bug Fixes

**Wrong-password login redirect (api.js)**
- Root cause: Axios 401 interceptor caught the login endpoint's own 401 (wrong credentials) and did `window.location.href = '/login'`, clearing auth token.
- Fix: Added `isLoginRequest` guard — interceptor skips redirect when `error.config.url` contains `/auth/login`.

**Dashboard profile completeness mismatch (dashboardController.js)**
- Root cause: Old controller computed completeness from 6 legacy fields, diverging from ProfilePage's 7-section model.
- Fix: Rewrote using `Promise.allSettled` parallel fetches (profile + scores + docs + predictions); now mirrors the exact 7-section completion logic in ProfilePage including diploma-awareness and mandatory doc check.

**Exam score delete 500 error (examScoresController.js)**
- Root cause: `predictions.exam_score_id` FK referenced `student_exam_scores(id)` with no `ON DELETE CASCADE`; PostgreSQL rejected the delete.
- Immediate fix: `deleteScore` controller now explicitly deletes related predictions before removing the score.
- DB-level fix: `database/migrations/v1_7_0_fix_predictions_exam_score_fk.sql` — drops and re-adds the FK with `ON DELETE CASCADE`.

**Profile save 500 error**
- Root cause: Migration v1.6.0 not yet applied — `qualification_type` and diploma columns missing in Supabase.
- Fix: Run `v1_6_0_add_diploma_fields.sql` in Supabase SQL Editor.

### New Features

**Diploma / Polytechnic in Academic Background (migration v1.6.0)**
- Added `qualification_type` toggle (`12th / HSC` vs `Diploma / Polytechnic`) at top of Academic Background section.
- New columns on `student_profiles`: `qualification_type`, `diploma_board`, `diploma_branch`, `diploma_percentage`, `diploma_year_of_passing`.
- When switching types, `saveS2` nulls out the opposite type's fields server-side to keep data clean.
- `profile_complete` logic in profileController is now type-aware: uses 12th fields OR diploma fields depending on `qualification_type`.
- Dashboard completion check updated to match.

**Category editable by student**
- Previously read-only, set by institution. Now an editable `<select>` in Basic Info section.
- Accepted values: `OPEN`, `OBC`, `SC`, `ST`, `EWS`.
- Saved to `students.category` alongside `students.phone` in a single combined update query.
- Backend validates against `VALID_CATEGORIES` whitelist.

**Mandatory documents (Documents section)**
- Three documents are now required for section completion: Aadhaar Card, 10th Marksheet, 12th / HSC Marksheet (or Diploma Marksheet when `qualification_type = 'Diploma'`).
- Visual checklist at top of Documents section shows green ✓ / amber ⚠ for each required doc.
- `complete[6]` is `hasAadhaar && has10th && hasAcademic` where `academicDocType` is derived from current `qualification_type`.
- Dashboard `mandatoryDocsComplete` mirrors same logic.

**Branch dropdowns in Course Preferences**
- Replaced 3 free-text branch inputs with `<select>` dropdowns.
- New endpoint `GET /api/v1/student/branches` returns deduplicated, alphabetically sorted branch names from `college_branches.branch_name`.
- Each dropdown filters out branches already selected in the other two rank slots (deduplication).
- Warning shown when no branches are available (empty `college_branches`).

### Files Changed / Created

| File | Change |
|------|--------|
| `frontend/src/utils/api.js` | Fixed 401 interceptor — skip redirect for login requests |
| `backend/src/controllers/student/dashboardController.js` | Rewrote with 7-section completion model + diploma + mandatory docs |
| `database/migrations/v1_6_0_add_diploma_fields.sql` | **NEW** — 5 new columns on student_profiles |
| `database/migrations/v1_7_0_fix_predictions_exam_score_fk.sql` | **NEW** — ON DELETE CASCADE for predictions.exam_score_id |
| `backend/src/controllers/student/profileController.js` | Diploma fields, category validation, combined student table update |
| `backend/src/controllers/student/examScoresController.js` | deleteScore now clears predictions first |
| `backend/src/controllers/student/branchesController.js` | **NEW** — listBranchNames endpoint |
| `backend/src/routes/student/index.js` | Added GET /branches route + branchesController import |
| `frontend/src/pages/student/ProfilePage.jsx` | Diploma toggle, editable category, mandatory docs checklist, branch dropdowns |
| `frontend/src/services/studentService.js` | Added fetchBranchNames |

### Updated Sections in Profile Builder
| # | Section | Complete When (updated) |
|---|---------|------------------------|
| 1 | Basic Info | gender + dob + state filled (category now editable) |
| 2 | Academic Background | 12th fields OR diploma fields filled (based on qualification_type) |
| 3 | Entrance Exams | ≥1 score exists (no change) |
| 4 | Domain Preferences | ≥1 domain selected (no change) |
| 5 | Course Preferences | degree type filled; branches from dropdown (no change) |
| 6 | Location Preferences | ≥1 state selected (no change) |
| 7 | Documents | Aadhaar + 10th marksheet + 12th/Diploma marksheet all uploaded |

### Required Setup (user actions)
1. Run `database/migrations/v1_6_0_add_diploma_fields.sql` in Supabase SQL Editor
2. Run `database/migrations/v1_7_0_fix_predictions_exam_score_fk.sql` in Supabase SQL Editor

---

## PHASE 5.3 ✅ DONE — College Preferences Section

**Status:** Done | **Completed:** 2026-03-03

### Feature Overview
A new Section 5 "College Preferences" inserted between Course Preferences and Location Preferences. Students can shortlist up to 5 colleges per category (Dream / Target / Safe). The section counts toward profile completion; Phase 6 reports will join with predictions to show per-college probability.

### Section numbering change
| ID | Section | Change |
|----|---------|--------|
| 0–4 | Basic Info → Course Prefs | Unchanged |
| **5** | **College Preferences** | **NEW** |
| 6 | Location Preferences | Was 5 |
| 7 | Documents | Was 6 |

### DB (migration v1.8.0)
New table `student_college_preferences`:
- `id, student_id, tenant_id, college_id, college_name, college_location, category, added_at`
- Unique index on `(student_id, college_id)` — same college cannot be added twice
- `category` CHECK IN ('dream', 'target', 'safe')
- `ON DELETE CASCADE` on student_id, tenant_id, college_id FKs

### Backend
- `collegePreferencesController.js` (NEW): listCollegePreferences, addCollegePreference (5-per-category limit, duplicate → 409), removeCollegePreference
- `GET /api/v1/student/college-preferences` — list student's shortlisted colleges
- `POST /api/v1/student/college-preferences` — add `{ college_id, category }`; denormalises college_name + college_location from `colleges` table
- `DELETE /api/v1/student/college-preferences/:id` — remove with ownership check
- `profileController.js` — `profile_complete` now includes college pref count check (S5 required)
- `dashboardController.js` — sectionComplete expanded to 8 entries; denominator 8; college pref count fetched via 5th Promise.allSettled item

### Frontend
- `ProfilePage.jsx`: `Building2`, `X` added to lucide imports; `api.js` default import added; `COLLEGE_CATEGORIES` constant; `collegePrefList`, `collegeOptions`, `addSelections`, `collegePrefErrors`, `addingPref` state; `fetchCollegePreferences` + `api.get('/colleges')` in parallel fetch; `handleAddCollegePref` + `handleRemoveCollegePref` handlers; Section 5 UI with three category cards (Dream/Target/Safe), each with college list + add dropdown; `complete[5]` = `collegePrefList.length > 0`; `complete[6]` = Location; `complete[7]` = Documents; total denominator 8
- `studentService.js`: `fetchCollegePreferences`, `addCollegePreference`, `removeCollegePreference`

### College selection
- Dropdown populated from `GET /api/v1/colleges` (student-accessible, `validateJWT` only — no role restriction)
- Already-added colleges (any category) filtered out of dropdown to prevent duplicates
- `college_name` and `college_location` denormalised at insert time

### Report integration (Phase 6 note)
- For each college in `student_college_preferences`, join with `predictions` on `college_id + student_id`
- Show probability bar, classification badge (Backup/Safe/Dream), recommendation text
- Group output: Dream → Target → Safe

### Required Setup (user action)
1. Run `database/migrations/v1_8_0_student_college_preferences.sql` in Supabase SQL Editor

### Prediction Label Rename (UI-only, no migration)
- `PredictionsPage.jsx` — added `CLASS_LABEL` mapping constant for frontend display:
  - `Backup` → **High Probability**
  - `Safe` → **Medium Probability**
  - `Dream` → **Low Probability**
- DB values (`Backup`, `Safe`, `Dream`) and `predictions.classification` column unchanged
- `CLASS_DESC` descriptions updated to match new terminology
- Applied to: prediction card badge, summary count strip, legend section

---

## PHASE 6 ✅ DONE — Report Generation

**Status:** Done | **Completed:** 2026-03-03

### Overview
Two-type PDF report system using Puppeteer (server-side headless Chrome). Students download their own summary; counselors download detailed reports for assigned students.

### PDF Engine
- **Library:** `puppeteer` (bundled Chromium, ~300MB)
- **Approach:** HTML template literals with inline CSS → `page.pdf({ format: 'A4' })`
- **Response:** Binary PDF streamed with `Content-Disposition: attachment; filename="..."`
- **Frontend:** `axios` with `responseType: 'blob'` → `URL.createObjectURL` → trigger download

### Report Types

#### 1. Student Admission Summary (`student_summary`)
- **Endpoint:** `GET /api/v1/student/reports/summary`
- **Access:** Student (own data only, filtered by JWT userId + tenantId)
- **Content:** Student info, academic background (12th or Diploma), all exam scores, domain/course preferences, college shortlist (Dream/Target/Safe) with probabilities, recommendations summary (counts by classification)
- **Filename:** `admission-summary-{name}-{date}.pdf`

#### 2. Counselor Detailed Report (`counselor_detailed`)
- **Endpoint:** `GET /api/v1/counselor/reports/:studentId`
- **Access:** Counselor (any student in same tenant; tenant_id validated from JWT)
- **Content:** All student summary content PLUS full predictions table (all colleges, probabilities, percentile gap, trend), counselor strategy notes section, generated-by counselor name/email header strip
- **Filename:** `counselor-report-{studentName}-{date}.pdf`

### Backend Files

| File | Action |
|------|--------|
| `backend/src/utils/pdfGenerator.js` | **NEW** — `generatePDF(html)`, `buildStudentSummaryHTML(data)`, `buildCounselorDetailedHTML(data)` |
| `backend/src/controllers/student/reportController.js` | **NEW** — `generateStudentSummaryReport` |
| `backend/src/controllers/counselor/dashboardController.js` | **NEW** — `getCounselorDashboard`, `listAssignedStudents` |
| `backend/src/controllers/counselor/reportController.js` | **NEW** — `generateCounselorDetailedReport` |
| `backend/src/routes/counselor/index.js` | **NEW** — counselor router (validateJWT + requireRole('counselor')) |
| `backend/src/routes/student/index.js` | Updated — added `GET /reports/summary` |
| `backend/src/index.js` | Updated — registered `/api/v1/counselor` router |

### Counselor API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/counselor/dashboard` | Dashboard stats (assigned count + recent students) |
| GET | `/api/v1/counselor/students` | Paginated list of assigned students |
| GET | `/api/v1/counselor/reports/:studentId` | Generate + download counselor detailed PDF |

### Frontend Files

| File | Action |
|------|--------|
| `frontend/src/pages/student/ReportsPage.jsx` | **NEW** — Report download UI with info banner, report card, generate/download button |
| `frontend/src/components/layout/CounselorSidebar.jsx` | **NEW** — Counselor nav (Dashboard, My Students) |
| `frontend/src/pages/counselor/CounselorDashboard.jsx` | Updated — live stats from API, recent students list, CounselorSidebar |
| `frontend/src/pages/counselor/CounselorStudentsPage.jsx` | **NEW** — Paginated assigned students table + per-student report download |
| `frontend/src/components/layout/StudentSidebar.jsx` | Updated — added Reports nav item (Download icon) |
| `frontend/src/services/studentService.js` | Updated — added `generateStudentReport(type)` with `responseType: 'blob'` |
| `frontend/src/App.jsx` | Updated — added `/student/reports`, `/counselor/students` routes |

### Required Setup (user action)
1. Run `npm install` in `backend/` to install puppeteer (downloads Chromium ~300MB)
2. No DB migrations required for Phase 6

### Puppeteer Notes (Windows)
- Uses `args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']` for compatibility
- `headless: true` (Puppeteer v22+)
- PDF generation takes 2–5 seconds per report depending on hardware

### Post-Phase Bug Fixes (2026-03-04)

**Predictions SELECT used non-existent flat columns**
- Root cause: Both `student/reportController.js` and `counselor/reportController.js` selected `college_name`, `branch_name`, `exam_type`, `probability`, `cutoff_percentile`, `gap`, `year` as flat columns — none exist; data lives in joined tables. Supabase silently returned `null` via `Promise.allSettled`, producing 0 recommendations in every report.
- Fix: Rewrote predictions SELECT to use FK joins: `colleges ( name, location, state )`, `college_branches ( branch_name )`, `student_exam_scores ( exam_type )`. Used real column names: `probability_percentage`, `score_diff_pct`, `avg_cutoff_used`.
- `pdfGenerator.js` field references updated to match the new nested structure (`p.colleges?.name`, `p.college_branches?.branch_name`, etc.). Counselor table `Year` column removed (no year on predictions); `colspan` corrected 8 → 7.

**Counselor report download timeout**
- Added `timeout: 120000` to `CounselorStudentsPage.jsx` report download request (default 15 s was insufficient for Puppeteer PDF generation).

**PDF download shows error after successful generation**
- Root cause: The `isPDF` magic-bytes check (`bytes[0] === 0x25...`) and subsequent Content-Type header check both produced false negatives on Windows/Puppeteer v24. The browser simultaneously auto-downloaded the PDF (via `Content-Disposition: attachment`), so the file landed on disk while JavaScript incorrectly flagged it as invalid.
- Fix: Removed all PDF validation checks from both `ReportsPage.jsx` and `CounselorStudentsPage.jsx`. Axios automatically throws for non-2xx responses; a 200 response means the PDF is ready and can be downloaded directly via `URL.createObjectURL(res.data)`. Error catch blocks now correctly handle blob responses with `instanceof Blob` + `.text()` + `JSON.parse` decoding.

---

## PHASE 7 ✅ DONE — Notifications Engine

**Status:** Done | **Completed:** 2026-03-04

### Overview
In-app notification system with auto-triggered events, admin broadcast, per-user unread badge, dropdown, and full-page history.

### DB (migration v1.10.0)
New `notifications` table:
- `id, tenant_id, recipient_id, recipient_role, type, title, message, link, is_read, created_at`
- `recipient_role` CHECK IN ('student', 'counselor', 'admin')
- `type` values: `welcome`, `counselor_assigned`, `predictions_ready`, `cutoff_updated`, `admin_message`
- `link` — optional front-end route to navigate on click
- Index `idx_notifications_recipient` on `(recipient_id, tenant_id, is_read, created_at DESC)`
- Index `idx_notifications_tenant_created` for admin sent-history queries

### Auto-triggered notifications
| Event | Trigger | Recipient |
|-------|---------|-----------|
| Student account created | `createStudent` in admin studentController | New student — "Welcome to the platform" |
| Counselor assigned | `assignCounselor` in admin studentController | Student — "A counselor has been assigned to you" |
| Recommendations generated | `generatePredictions` in student predictionController | Student — "Your recommendations are ready!" |

### Backend Files

| File | Action |
|------|--------|
| `database/migrations/v1_10_0_notifications.sql` | **NEW** — notifications table + indexes |
| `backend/src/utils/notificationUtils.js` | **NEW** — `createNotification(opts)`, `broadcastNotification(table, opts)` helpers |
| `backend/src/controllers/student/notificationsController.js` | **NEW** — `listNotifications`, `markRead`, `markAllRead` |
| `backend/src/controllers/counselor/notificationsController.js` | **NEW** — same, for counselor role |
| `backend/src/controllers/admin/notificationsController.js` | **NEW** — `sendNotification`, `listSentNotifications` |
| `backend/src/routes/student/index.js` | Added `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read` |
| `backend/src/routes/counselor/index.js` | Same 3 notification routes for counselor |
| `backend/src/routes/admin/index.js` | Added `POST /notifications/send`, `GET /notifications/sent` |
| `backend/src/controllers/admin/studentController.js` | Added welcome + counselor_assigned auto-notifications |
| `backend/src/controllers/student/predictionController.js` | Added predictions_ready auto-notification |

### API Routes

| Role | Method | Endpoint | Description |
|------|--------|----------|-------------|
| student | GET | `/api/v1/student/notifications?page=N` | Paginated list (unread first) + unread count in meta |
| student | PATCH | `/api/v1/student/notifications/:id/read` | Mark single read |
| student | PATCH | `/api/v1/student/notifications/read-all` | Mark all read |
| counselor | GET/PATCH | `/api/v1/counselor/notifications` (same 3) | Same for counselor |
| admin | POST | `/api/v1/admin/notifications/send` | Broadcast or targeted send |
| admin | GET | `/api/v1/admin/notifications/sent` | Sent history (admin_message type only) |

### Frontend Files

| File | Action |
|------|--------|
| `frontend/src/components/layout/NotificationBell.jsx` | **NEW** — Bell icon + unread badge + dropdown (top 5 notifications) + mark-all + "View all" link; polls every 60 s; only renders for student/counselor roles |
| `frontend/src/components/layout/DashboardShell.jsx` | Updated — `NotificationBell` added to top navbar right section |
| `frontend/src/pages/student/NotificationsPage.jsx` | **NEW** — Full notifications page (paginated, mark read, mark all, empty state) |
| `frontend/src/pages/counselor/CounselorNotificationsPage.jsx` | **NEW** — Same for counselor |
| `frontend/src/pages/admin/NotificationsPage.jsx` | **NEW** — Admin send form (recipient type picker + title + message + optional link) + sent-history panel |
| `frontend/src/components/layout/StudentSidebar.jsx` | Added `Bell` / Notifications nav item |
| `frontend/src/components/layout/CounselorSidebar.jsx` | Added `Bell` / Notifications nav item |
| `frontend/src/components/layout/AdminSidebar.jsx` | Added `Bell` / Notifications nav item |
| `frontend/src/App.jsx` | Added routes: `/student/notifications`, `/counselor/notifications`, `/admin/notifications` |

### Admin send options
| recipientType | Description |
|--------------|-------------|
| `all_students` | Broadcast to all active students in tenant |
| `all_counselors` | Broadcast to all active counselors in tenant |
| `student` | Single student by UUID (verified against tenant) |
| `counselor` | Single counselor by UUID (verified against tenant) |

### Required Setup (user action)
1. Run `database/migrations/v1_10_0_notifications.sql` in Supabase SQL Editor

### Post-Phase Bug Fixes (2026-03-04)

**Admin sent history showing duplicate entries for broadcasts**
- Root cause: `broadcastNotification` inserts one row per recipient in the `notifications` table. `listSentNotifications` was fetching all rows and returning them individually, so sending to N students showed N identical rows in the sent history panel.
- Fix: Server-side JS deduplication in `listSentNotifications` — fetch all `admin_message` rows for the tenant, group by `title|||message|||link|||recipient_role` using a `Map`, pick first occurrence per group and track count. Each deduplicated group now includes a `recipientCount` field.
- Frontend: Added "X recipients" badge in sent history when `recipientCount > 1`. Fixed React key from `n.id` (undefined after dedup — id not selected) to `${n.title}-${n.created_at}-${idx}`. Added `type` back to the backend SELECT so the emoji icon renders correctly.

**Student dashboard missing notifications preview section**
- Added a Notifications section to `StudentDashboard.jsx` below the Recent Exam Scores card.
- Fetches top 4 notifications via `GET /student/notifications` in parallel with the existing dashboard fetch.
- Displays: emoji type icon, notification title, message preview (truncated), time-ago timestamp, unread dot indicator.
- Section header shows red unread count badge when `unreadCount > 0`.
- "View all" arrow button links to `/student/notifications`.

---

## PHASE 7.1 ✅ DONE — Post-Phase 7 Fixes + Profile Enhancements

**Status:** Done | **Completed:** 2026-03-08

### Additional Notification Fixes

**Domain-based broadcast (students_by_domain)**
- New recipient type `students_by_domain` added to admin `sendNotification` endpoint.
- Backend: `broadcastNotificationByDomain(domain, opts)` in `notificationUtils.js` — queries `student_profiles` using `.filter('domains_of_interest', 'cs', JSON.stringify([domain]))` (JSONB `@>` containment) then cross-references `students` for `is_active = true`.
- Returns the count of students notified; controller returns 404 if count is 0.
- Admin UI: new "Students by Domain" radio option shows a `<select>` with all 9 domain values instead of UUID input.
- Success banner shows e.g. "Notification sent to 3 students interested in Engineering".

**Notification link (View →) not rendering on student/counselor pages**
- Root cause: `n.link` was fetched but never rendered in the notification list items.
- Fix: Added `useNavigate` + `ArrowRight` to both `NotificationsPage.jsx` and `CounselorNotificationsPage.jsx`. When `n.link` is set, a "View →" button appears inline with the timestamp. Clicking it marks the notification read and navigates to the route.

### Profile Enhancements (v1.11.0)

**PCM+PCB stream added**
- New `stream_12th` option for students who took both PCM and PCB combinations.
- DB: dropped and recreated `student_profiles_stream_12th_check` constraint to include `'PCM+PCB'`.
- Backend: `VALID_STREAMS` in `profileController.js` updated.
- Frontend: `STREAMS` constant updated; when `PCM+PCB` is selected, **both** PCM Aggregate and PCB Aggregate fields appear.

**Autonomous Colleges preference added**
- New `autonomous_allowed BOOLEAN DEFAULT TRUE` column on `student_profiles`.
- Backend: added to `ALL_PROFILE_COLUMNS` and `profileFields` in `profileController.js`.
- Frontend: fourth toggle added to the college-type preferences grid in Location Preferences section; grid updated to `sm:grid-cols-2 lg:grid-cols-4`.

**Cutoff moved from Admin → Super Admin**
- Cutoff routes removed from admin backend router and sidebar.
- Full checklist documented under Phase 9.

### Files Changed

| File | Change |
|------|--------|
| `database/migrations/v1_11_0_stream_autonomous.sql` | **NEW** — PCM+PCB constraint + autonomous_allowed column |
| `backend/src/controllers/student/profileController.js` | VALID_STREAMS + ALL_PROFILE_COLUMNS + profileFields updated |
| `frontend/src/pages/student/ProfilePage.jsx` | PCM+PCB stream, autonomous toggle, form state/save |
| `backend/src/utils/notificationUtils.js` | `broadcastNotificationByDomain` with JSONB `.filter()` fix |
| `backend/src/controllers/admin/notificationsController.js` | `students_by_domain` handler, count response |
| `frontend/src/pages/admin/NotificationsPage.jsx` | Domain selector UI, success message shows count |
| `frontend/src/pages/student/NotificationsPage.jsx` | Link "View →" button with navigate |
| `frontend/src/pages/counselor/CounselorNotificationsPage.jsx` | Link "View →" button with navigate |
| `backend/src/routes/admin/index.js` | Cutoff routes removed |
| `frontend/src/components/layout/AdminSidebar.jsx` | Cutoff nav item removed |
| `frontend/src/App.jsx` | /admin/cutoff route removed |

### Required Setup
1. Run `database/migrations/v1_11_0_stream_autonomous.sql` in Supabase SQL Editor

---

## PHASE 8 ✅ DONE — Counselor Session Management

**Status:** Done | **Completed:** 2026-03-08

### Overview
Counselors can schedule, update, and cancel counseling sessions with their students. Students get a read-only view of their sessions. Auto-notifications fire on session creation and cancellation.

### DB (migration v1.12.0)
New `counseling_sessions` table:
- `id, tenant_id, student_id (FK), counselor_id (FK), title, scheduled_at, duration_minutes, status, notes, meeting_link, created_at`
- `status` CHECK IN ('scheduled', 'completed', 'cancelled') — default 'scheduled'
- `duration_minutes` default 60 — valid: 30, 45, 60, 90, 120
- 3 indexes: by counselor, by student, by tenant

### Auto-triggered notifications (new types)
| Event | Trigger | Recipient |
|-------|---------|-----------|
| Session scheduled | `createSession` | Student — "Session Scheduled" with date |
| Session cancelled | `cancelSession` or `updateSession(status=cancelled)` | Student — "Session Cancelled" |

New TYPE_ICON entries: `📅` session_scheduled, `❌` session_cancelled — added to NotificationBell and both notification pages.

### Backend Files

| File | Action |
|------|--------|
| `database/migrations/v1_12_0_counseling_sessions.sql` | **NEW** |
| `backend/src/controllers/counselor/sessionsController.js` | **NEW** — listSessions, getStudentsList, createSession, updateSession, cancelSession |
| `backend/src/controllers/student/sessionsController.js` | **NEW** — listSessions (read-only) |
| `backend/src/routes/counselor/index.js` | Added 5 session routes |
| `backend/src/routes/student/index.js` | Added GET /sessions |

### API Routes

| Role | Method | Endpoint | Description |
|------|--------|----------|-------------|
| counselor | GET | `/counselor/sessions/students-list` | Flat list for dropdown |
| counselor | GET | `/counselor/sessions?status=upcoming\|past\|all` | Paginated list |
| counselor | POST | `/counselor/sessions` | Create + notify student |
| counselor | PATCH | `/counselor/sessions/:id` | Update status/notes/link |
| counselor | DELETE | `/counselor/sessions/:id` | Cancel + notify student |
| student | GET | `/student/sessions?status=upcoming\|past` | Read-only list |

### Frontend Files

| File | Action |
|------|--------|
| `frontend/src/pages/counselor/CounselorSessionsPage.jsx` | **NEW** — tabs, create modal, edit/notes modal, cancel |
| `frontend/src/pages/student/StudentSessionsPage.jsx` | **NEW** — read-only, join meeting button |
| `frontend/src/components/layout/CounselorSidebar.jsx` | Added Sessions (CalendarDays) |
| `frontend/src/components/layout/StudentSidebar.jsx` | Added Sessions (CalendarDays) |
| `frontend/src/App.jsx` | Added `/counselor/sessions`, `/student/sessions` routes |
| `frontend/src/components/layout/NotificationBell.jsx` | session_scheduled/cancelled icons |
| `frontend/src/pages/student/NotificationsPage.jsx` | Same |
| `frontend/src/pages/counselor/CounselorNotificationsPage.jsx` | Same |

### Required Setup (user action)
1. Run `database/migrations/v1_12_0_counseling_sessions.sql` in Supabase SQL Editor

---

## PHASE 8.1 ✅ DONE — Post-Phase 8 Fixes + Counselor Enhancements

**Status:** Done | **Completed:** 2026-03-08

### Bug Fixes

**Sessions dropdown empty — "No assigned students found" (sessionsController.js)**
- Root cause: `getStudentsList` queried `.eq('counselor_id', ...)` but the actual FK column is `assigned_counselor_id`.
- Fix: Corrected to `.eq('assigned_counselor_id', counselorId)` in `backend/src/controllers/counselor/sessionsController.js`.

**[object Object] in Preferred Branches section of counselor PDF report**
- Root cause: `preferred_branches` JSONB array elements were objects in some DB records; the pdfGenerator called `.map(b => b)` directly without coercing to string.
- Fix: Changed to `typeof b === 'string' ? b : (b?.branch_name ?? b?.name ?? '')` in `buildCounselorDetailedHTML`.

### New Features

**Predictions toggle per student (migration v1.13.0)**
- By default all students have `predictions_enabled = FALSE` — counselor must explicitly enable.
- New `PATCH /counselor/students/:id/toggle-predictions` endpoint flips the boolean; verifies student is assigned to the requesting counselor.
- `listAssignedStudents` now returns `predictions_enabled` field.
- `CounselorStudentsPage.jsx`: new "Recommendations" column with a pill-style toggle button (indigo = enabled, gray = disabled). Optimistic update on toggle.
- `predictionController.js`: both `listPredictions` and `generatePredictions` now check `predictions_enabled` and return 403 if false.
- `PredictionsPage.jsx`: catches 403 → shows a "Recommendations Not Available" locked state with lock icon; action buttons hidden when locked.

**Counselor can send notifications to assigned students**
- New `POST /counselor/notifications/send` endpoint; `recipientType`: `all_my_students` (broadcasts to all active assigned students) or `student` (targeted, verifies `assigned_counselor_id` ownership).
- `CounselorNotificationsPage.jsx` rebuilt: "Send Notification" form panel at top, inbox below — mirrors admin notification page pattern.
- Student dropdown for targeted send reuses `sessions/students-list` endpoint.

**Remove duration from Create Session modal**
- Removed `duration_minutes` `<select>` from Create Session modal (backend defaults to 60 min).
- Date & Time field is now full-width.

**Session notes hidden from student portal**
- `notes` column removed from student `sessionsController.js` SELECT — never sent to client.
- "Counselor Notes" block removed from `StudentSessionsPage.jsx` session card.

**Duration text removed from counselor session card**
- Removed `<Clock>` icon + `{session.duration_minutes} min` span from `SessionCard` in `CounselorSessionsPage.jsx`.

### Files Changed

| File | Change |
|------|--------|
| `database/migrations/v1_13_0_predictions_enabled.sql` | **NEW** — `predictions_enabled BOOLEAN DEFAULT FALSE` on students |
| `backend/src/controllers/counselor/dashboardController.js` | `listAssignedStudents` returns `predictions_enabled`; new `toggleStudentPredictions` |
| `backend/src/controllers/counselor/sessionsController.js` | Fixed `assigned_counselor_id` bug in `getStudentsList` |
| `backend/src/controllers/counselor/notificationsController.js` | New `sendNotification` handler |
| `backend/src/controllers/student/sessionsController.js` | Removed `notes` from SELECT |
| `backend/src/controllers/student/predictionController.js` | `predictions_enabled` gate in both list and generate |
| `backend/src/routes/counselor/index.js` | Added toggle-predictions + notifications/send routes |
| `backend/src/utils/pdfGenerator.js` | Safe branch name extraction (string vs object) |
| `frontend/src/pages/counselor/CounselorStudentsPage.jsx` | Predictions toggle button column |
| `frontend/src/pages/counselor/CounselorNotificationsPage.jsx` | Send form added at top |
| `frontend/src/pages/counselor/CounselorSessionsPage.jsx` | Duration field and Clock icon removed |
| `frontend/src/pages/student/PredictionsPage.jsx` | Locked state on 403 |
| `frontend/src/pages/student/StudentSessionsPage.jsx` | Notes block removed |

### Required Setup
1. Run `database/migrations/v1_13_0_predictions_enabled.sql` in Supabase SQL Editor

---

## PHASE 9 ✅ DONE — Super Admin Portal + Cutoff Management

**Status:** Done | **Completed:** 2026-03-08

### Overview
Full Super Admin portal: live platform-wide dashboard, tenant management (activate/deactivate), and cutoff data management across all tenants. No tenant filter — Super Admin sees all data.

### Backend Files

| File | Action |
|------|--------|
| `backend/src/controllers/superadmin/dashboardController.js` | **NEW** — platform-wide stats via Promise.allSettled (no tenant filter) |
| `backend/src/controllers/superadmin/adminsController.js` | **NEW** — `listAdmins` (paginated + per-tenant student/counselor counts), `toggleAdminActive` |
| `backend/src/controllers/superadmin/cutoffController.js` | **NEW** — `listCutoff`, `createCutoff`, `bulkUploadCutoff`, `downloadTemplate`, `deleteCutoff`; all without tenant restriction; create/bulk require `tenantId` in body |
| `backend/src/routes/superadmin/index.js` | **NEW** — all superadmin routes guarded by `validateJWT + requireRole('super_admin')` |
| `backend/src/index.js` | Added `app.use('/api/v1/superadmin', superadminRoutes)` |

### API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/superadmin/dashboard` | Platform stats + 5 recent tenants |
| GET | `/api/v1/superadmin/admins?page=N` | Paginated tenant list with student+counselor counts |
| PATCH | `/api/v1/superadmin/admins/:id/toggle-active` | Flip `is_active` on an admin/tenant |
| GET | `/api/v1/superadmin/cutoff?adminId=&year=&category=` | All cutoffs; optional per-tenant filter |
| POST | `/api/v1/superadmin/cutoff` | Single entry; `tenantId` required in body |
| POST | `/api/v1/superadmin/cutoff/bulk` | CSV upload; `tenantId` in form-data |
| GET | `/api/v1/superadmin/cutoff/template` | CSV template download |
| DELETE | `/api/v1/superadmin/cutoff/:id` | Delete any cutoff entry (no tenant restriction) |

### Frontend Files

| File | Action |
|------|--------|
| `frontend/src/components/layout/SuperAdminSidebar.jsx` | **NEW** — Dashboard, Tenants, Cutoff Data nav (slate color scheme) |
| `frontend/src/pages/superadmin/SuperAdminDashboard.jsx` | **Updated** — live stat cards (totalAdmins/Students/Counselors/Predictions/Sessions) + recent tenants table |
| `frontend/src/pages/superadmin/AdminsPage.jsx` | **NEW** — full paginated tenant list with student/counselor counts + Activate/Deactivate toggle |
| `frontend/src/pages/superadmin/CutoffPage.jsx` | **NEW** — 3-tab UI (List/Add/Upload); all tabs include a tenant selector dropdown; List adds Tenant filter; Add and Upload require tenant selection before submitting |
| `frontend/src/App.jsx` | Added `/superadmin/admins` + `/superadmin/cutoff` routes |

### Key Design Decisions
- Super Admin JWT has no `tenantId` — `tenantId` is supplied in request body/query for cutoff create/upload/filter operations
- Cutoff List shows all tenants' data by default; Tenant dropdown filters to a single institution
- Tenant activate/deactivate uses optimistic local state update — no full page reload needed
- SuperAdminSidebar uses slate color scheme (distinct from indigo=admin, purple=counselor)

## PHASE 9.1 ✅ DONE — Landing Page Integration

**Status:** Done | **Completed:** 2026-03-11

### Overview
Integrated the standalone landing page into the main frontend React application. The landing page now serves as the root index (`/`) and handles the transition to the login portal.

### Key Changes
- **Single Dev Command:** Both landing page and application now run under `npm run dev` in the `frontend` directory.
- **Unified Routing:** Added `LandingPage.jsx` as the root route in `App.jsx`.
- **Styling Isolation:** Scoped landing page styles under the `.landing-page` class to prevent conflicts with the application's global Tailwind styles.
- **Component Migration:** Rebuilt all landing components (`Hero`, `Navbar`, `WhoIsThisFor`, etc.) as React components within `frontend/src/pages/landing/`.
- **Integrated Login:** The landing page "Login" button now uses React Router `Link` to navigate to the `/login` portal without a full page reload.
- **Hooks & Context:** Shared the `useScrollAnimation` hook across the project.

### Tech Stack Additions
- Added `framer-motion` to frontend dependencies.
- Added `DM Sans` and `Plus Jakarta Sans` Google Fonts.

---

## PHASE 10 — Deployment + QA (Planned)

---

## Schema Change Log

| Version | Date       | Change                                         | Tables Affected                                                   |
|---------|------------|------------------------------------------------|-------------------------------------------------------------------|
| v1.0.0  | 2026-02-24 | Initial 18-table schema                        | All                                                               |
| v1.1.0  | 2026-02-24 | password_hash, must_change_password, exams     | super_admins, admins, counselors, students, student_exam_scores   |
| v1.2.0  | 2026-02-25 | Fix category constraint General→OPEN, nullable | students, cutoff_data                                             |
| v1.3.0  | 2026-02-28 | Gender constraint + attempt_year rename + attempt_number col | student_profiles, student_exam_scores                |
| v1.4.0  | 2026-02-28 | Add exam_type to cutoff_data — stream-based recommendation filtering | cutoff_data                                 |
| v1.5.0  | 2026-03-02 | Student profile builder — 17 new cols on student_profiles + student_documents table | student_profiles, student_documents |
| v1.6.0  | 2026-03-03 | Diploma/Polytechnic support — 5 new cols (qualification_type, diploma_board, diploma_branch, diploma_percentage, diploma_year_of_passing) | student_profiles |
| v1.7.0  | 2026-03-03 | Add ON DELETE CASCADE to predictions.exam_score_id FK | predictions |
| v1.8.0  | 2026-03-03 | New student_college_preferences table (Dream/Target/Safe shortlist, max 5 per category) | student_college_preferences (new) |
| v1.9.0  | 2026-03-03 | Add nullable `city` column to cutoff_data — enables city-based filtering in recommendations | cutoff_data |
| v1.10.0 | 2026-03-04 | Notifications table (auto-triggered + admin broadcast) | notifications (new) |
| v1.11.0 | 2026-03-08 | PCM+PCB stream option; autonomous_allowed toggle       | student_profiles        |
| v1.12.0 | 2026-03-08 | Counseling sessions table (Phase 8)                    | counseling_sessions (new) |
| v1.13.0 | 2026-03-08 | predictions_enabled flag per student (Phase 8.1)       | students                   |

---

## CUTOFF DATA ENHANCEMENT — city column (v1.9.0)

**Status:** Done | **Completed:** 2026-03-03

### Overview
Added an optional `city` column to `cutoff_data` so that future city-based filtering in the recommendations page is possible without extra JOINs. Admins supply city in both the manual form and CSV upload.

### Design Decision — Multiple rows vs. single-row per college
**Kept multiple rows per category** (each category has its own row). The single-row approach was considered but rejected:
- It would require 15+ sparse columns (5 categories × 3 value types), most NULL per row
- The prediction engine's `.in('category', [studentCategory, 'OPEN'])` filter would break entirely
- Different categories genuinely have different closing ranks/percentiles — these are not the same data

### Why `city` on `cutoff_data` (not `colleges.location`)
- Allows the prediction engine to filter by city with a simple `.eq('city', ...)` without extra JOINs
- Some institutions have campuses in multiple cities; the cutoff row captures which campus applies
- Consistent with `exam_type` and `category` — contextual data lives on the cutoff row

### Files Changed

| File | Change |
|------|--------|
| `database/migrations/v1_9_0_add_city_to_cutoff.sql` | **NEW** — `ALTER TABLE cutoff_data ADD COLUMN IF NOT EXISTS city VARCHAR(100)` + index |
| `backend/src/controllers/admin/cutoffController.js` | `listCutoff` SELECT includes `city`; `createCutoff` accepts + stores `city`; `bulkUploadCutoff` reads `city` from CSV row; `downloadTemplate` updated header + examples |
| `frontend/src/pages/admin/CutoffPage.jsx` | `AddCutoffEntry` form: `city` in form state + optional text input; `CutoffList` table: City column in header, data rows, skeleton loader, empty colSpan |

### Updated CSV template format
```
college_name,branch_name,year,round,category,exam_type,city,percentile,rank,score
```
`city` is optional — leave blank if unknown. Existing rows without city are unaffected (nullable).

### Required Setup (user action)
1. Run `database/migrations/v1_9_0_add_city_to_cutoff.sql` in Supabase SQL Editor
2. Re-download and use the updated CSV template from the admin Cutoff page

## Resolved Decisions

| D-1 | OTP → Removed | D-2 | PDF → Puppeteer | D-3 | Exams → JEE/MHT-CET/NEET/OTHER | D-4 | Cutoff → CSV + form |
