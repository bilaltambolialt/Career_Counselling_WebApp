# QA Test Results — College Admission Prediction WebApp
**Date:** 2026-04-02
**Tester:** UnrealSolutions
**Version:** v1.24.0
**Environment:** Local dev (Vite + Express + Supabase)

---

## Summary

| Category | Total | Passed | Failed | Pending Manual |
|----------|-------|--------|--------|----------------|
| Static Code Analysis | 35 | 35 | 0 | 0 |
| Manual Runtime Tests | 13 | 10 | 1 | 2 |
| **Total** | **48** | **45** | **1** | **2** |

---

## Manual Test Results (User-Verified)

| Test ID | Description | Result | Notes |
|---------|-------------|--------|-------|
| L4 | Landing form submits to DB — row appears in `landing_inquiries` | ✅ PASS | Row confirmed in Supabase |
| L5 | Web3Forms sends email to apekshakamble007@gmail.com | ✅ PASS | Email received in inbox |
| A4 | Logout Admin A → login Admin B → no 500 error | ✅ PASS | Previously broken; confirmed fixed |
| AS1 | Create student with 0 tokens → blocked (403) | ✅ PASS | Error message shown correctly |
| AS2 | Create student with ≥1 token → succeeds, tokens_used increments | ✅ PASS | Token balance decrements in admin dashboard |
| SA1 | Super Admin dashboard revenue = tokens_allocated × ₹1,000 | ✅ PASS | Revenue figure correct |
| AI1 | Admin Inquiries page shows submitted landing inquiries (Apeksha only) | ✅ PASS | Table loads; status update works |
| SC2 | Add cutoff entry via Super Admin → `tenant_id` = NULL in DB | ❌ FAIL → FIXED | **Bug found + fixed (see below)** |
| NT1 | Admin sends notification → student bell updates within 60s | ✅ PASS | Bell count incremented; notification visible |
| SS1 | Counselor creates session → appears in student upcoming tab | ✅ PASS | Session visible immediately after creation |
| EC1 | Sponsored college appears first with S badge in student Explore | ✅ PASS | Amber S badge shown; sponsored pinned at top |
| X7 | Token race condition: two tabs, 1 token → only one succeeds | ✅ PASS | `consume_token` RPC atomic; second tab gets 403 |

---

## Bug Found & Fixed During Testing

### Bug: SC2 — Super Admin cutoff entry creation fails with 500

**Symptom:**
- UI shows: "Failed to create cutoff entry"
- Browser console: `401 (Unauthorized)` then `500 (Internal Server Error)` on `POST /api/v1/superadmin/cutoff`

**Root Cause:**
The `cutoff_data` table schema (v1.0.0) defines:
```sql
uploaded_by UUID NOT NULL REFERENCES admins(id)
```
The `NOT NULL` FK references `admins(id)`. When the super admin creates an entry, the backend sets `uploaded_by: userId` where `userId` is the super admin's UUID — which exists in `super_admins` table, **not** `admins` table. This causes a foreign key constraint violation in Supabase, returning a DB error that the backend converts to a 500.

The 401 in the console was a separate, unrelated background request (notification bell polling).

**Fix Applied:**
- Created `database/migrations/v1_24_0_cutoff_uploaded_by_nullable.sql`:
  ```sql
  ALTER TABLE cutoff_data ALTER COLUMN uploaded_by DROP NOT NULL;
  ```
- Removed `uploaded_by: userId` from both `createCutoff` and `bulkUploadCutoff` in `backend/src/controllers/superadmin/cutoffController.js` — super admin UUID cannot satisfy the FK to `admins` table.

**Files Changed:**
- `database/migrations/v1_24_0_cutoff_uploaded_by_nullable.sql` *(new)*
- `backend/src/controllers/superadmin/cutoffController.js` *(removed uploaded_by from inserts)*

**Status:** ✅ Fixed — requires `v1_24_0_cutoff_uploaded_by_nullable.sql` to be run in Supabase SQL Editor.

---

## Static Code Analysis Results (Automated — 35/35 PASS)

All 35 checks performed via source code inspection.

| Test | Description | Result |
|------|-------------|--------|
| T1 | Submit button disabled during form submission | ✅ PASS |
| T2 | Web3Forms guarded when VITE_WEB3FORMS_KEY not set | ✅ PASS |
| T3 | DB `/public/inquiry` POST called regardless of Web3Forms key | ✅ PASS |
| T4 | Logout `try/finally` — React state always cleared | ✅ PASS |
| T5 | Server logout route has no JWT middleware | ✅ PASS |
| T6 | Inquiries endpoint returns 403 for non-Apeksha admins | ✅ PASS |
| T7 | AdminSidebar shows "Inquiries" only for apekshakamble007@gmail.com | ✅ PASS |
| T8 | No tenant selector in SuperAdmin CutoffPage (Add Entry + CSV tabs) | ✅ PASS |
| T9 | Prediction engine has no `.eq('tenant_id')` filter on cutoff query | ✅ PASS |
| T10 | Revenue = `tokens_allocated × ₹1,000` (not `tokens_used`) | ✅ PASS |
| T11 | Sponsored colleges shown ABOVE prediction cards in PredictionsPage | ✅ PASS |
| T12 | Sponsored colleges pinned first across all sort modes in ExploreCollegesPage | ✅ PASS |
| T13 | Profile page: horizontal pill nav on mobile, vertical sidebar on desktop | ✅ PASS |
| T14 | StudentSidebar logout: awaits + navigates to /login | ✅ PASS |
| T15 | `/api/v1/public` route mounted in Express index.js | ✅ PASS |
| T16 | Admin inquiry routes (GET + PATCH) registered in admin router | ✅ PASS |
| T17 | `consume_token` RPC used in student creation; checks 'INSUFFICIENT_TOKENS' | ✅ PASS |
| T18 | Session `notes` column excluded from student sessions response | ✅ PASS |
| T19 | Wrong current password returns 422, not 401 | ✅ PASS |
| T20 | Dev bypass (`devLogin`, `DEV_MOCK_USERS`) fully removed from AuthContext | ✅ PASS |
| B1 | "Other" concern detail conditionally sent; empty string when not "other" | ✅ PASS |
| B2 | Token request returns 500 on insert failure (not silent swallow) | ✅ PASS |
| B3 | Notification bell NOT rendered for admin role | ✅ PASS |
| B4 | CounselorSidebar logout: awaits + navigates to /login | ✅ PASS |
| B5 | ProtectedRoute redirects to /change-password when mustChangePassword=true | ✅ PASS |
| B6 | Axios 401 interceptor skips redirect for /auth/login URL | ✅ PASS |
| B7 | Admin broadcast notifications filtered by tenantId | ✅ PASS |
| B8 | No exam scores returns 400 (not 500) with descriptive message | ✅ PASS |
| B9 | `/student/explore/colleges` and `/student/explore/sponsored` routes exist | ✅ PASS |
| B10 | Token request checks for active super admins before inserting notification | ✅ PASS |
| B11 | Student session request route + controller implemented | ✅ PASS |
| B12 | `/api/v1/public` mounted before 404 handler in Express | ✅ PASS |
| B13 | `/admin/inquiries` route registered in App.jsx with InquiriesPage component | ✅ PASS |
| B14 | Explore controller orders by `is_sponsored DESC` | ✅ PASS |
| B15 | Mobile drawer in DashboardShell renders the `sidebar` prop | ✅ PASS |

---

## Pending Manual Tests (Runtime Required)

| Test | Description | Status |
|------|-------------|--------|
| SC2 (retest) | Add cutoff entry after running v1_24_0 migration → confirm success | 🔄 Needs retest after migration |
| PR2 | Run predictions analysis → results appear (needs cutoff data in DB) | ⏳ Pending |
| X2 | Predictions use centralized cutoff (tenant_id=NULL entries work) | ⏳ Pending |

---

## Migration Checklist

All migrations must be run in Supabase SQL Editor in order:

| Migration | Status | Notes |
|-----------|--------|-------|
| `v1_18_0_token_system.sql` | ✅ Run | tokens_allocated, tokens_used on admins |
| `v1_19_0_notifications_superadmin_role.sql` | ✅ Run | super_admin recipient_role + token_request type |
| `v1_20_0_sponsored_colleges.sql` | ✅ Run | is_sponsored on top_colleges + consume_token RPC |
| `v1_21_0_cutoff_codes.sql` | ✅ Run | dte_code + course_code on cutoff_data |
| `v1_22_0_cutoff_centralized.sql` | ✅ Run | tenant_id nullable on cutoff_data |
| `v1_23_0_landing_inquiries.sql` | ✅ Run | landing_inquiries table |
| `v1_24_0_cutoff_uploaded_by_nullable.sql` | 🔄 **PENDING** | **Run this to fix SC2 bug** |
