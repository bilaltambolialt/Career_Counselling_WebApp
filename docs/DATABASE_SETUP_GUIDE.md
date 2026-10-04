# DATABASE SETUP GUIDE

**Project:** College Admission Prediction & Notification Web Application
**Date:** 2026-02-24

---

## Prerequisites
- Your Supabase project is already created (you have the URL and keys)
- Project URL: `https://salzwpidxftdljulxgvc.supabase.co`

---

## Step 1 — Verify Your API Keys

Before running anything, confirm your keys are correct:

1. Go to [https://supabase.com](https://supabase.com) → sign in
2. Open your project (`salzwpidxftdljulxgvc`)
3. Click **Project Settings** (gear icon, bottom-left sidebar)
4. Click **API** tab
5. You will see:
   - **Project URL** → should match `SUPABASE_URL` in your `.env`
   - **anon / public key** → should match `SUPABASE_ANON_KEY`
   - **service_role / secret key** → should match `SUPABASE_SERVICE_ROLE_KEY`
6. If any key differs, copy from the dashboard and update your `.env`

> **Note:** Newer Supabase projects (created 2024+) use the new `sb_secret_` / `sb_publishable_` key format. Older projects use long JWT keys (`eyJ...`). Both formats work with supabase-js v2.

---

## Step 2 — Open the SQL Editor

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query** (top-right)

---

## Step 3 — Run Migration v1.0.0 (Base Schema)

1. Open the file: [`database/migrations/v1_0_0_initial_schema.sql`](../database/migrations/v1_0_0_initial_schema.sql)
2. Copy the **entire contents**
3. Paste into the Supabase SQL editor
4. Click **Run** (or press `Ctrl+Enter`)
5. You should see: `Success. No rows returned`

This creates all 18 base tables.

---

## Step 4 — Run Migration v1.1.0 (Auth Fields)

1. Open the file: [`database/migrations/v1_1_0_add_auth_fields.sql`](../database/migrations/v1_1_0_add_auth_fields.sql)
2. Copy the **entire contents**
3. Paste into a **new query** in the SQL editor
4. Click **Run**
5. You should see: `Success. No rows returned`

This adds `password_hash`, `must_change_password`, and expands exam types.

---

## Step 5 — Verify Tables Were Created

Run this query to confirm all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these 17 tables (otp_verifications was dropped in v1.1.0):

```
admins
college_branches
college_tracking
colleges
counselors
cutoff_data
notification_reads
notifications
predictions
reports
sessions
sponsored_colleges
sponsored_performance
student_exam_scores
student_profiles
students
super_admins
```

---

## Step 6 — Seed the Super Admin

1. Generate a bcrypt hash for your super admin password.

   **Option A — Using Node.js:**
   ```bash
   cd backend
   npm install
   node -e "import('bcryptjs').then(b => b.default.hash('YourPassword123!', 12).then(console.log))"
   ```

   **Option B — Using an online tool:**
   Go to [https://bcrypt-generator.com](https://bcrypt-generator.com), enter your password, set rounds to 12, click Generate.

2. Open [`database/seeds/01_seed_super_admin.sql`](../database/seeds/01_seed_super_admin.sql)

3. Replace the placeholder values:
   ```sql
   INSERT INTO super_admins (name, email, password_hash, is_active)
   VALUES (
     'Your Name',
     'your-email@example.com',
     '$2a$12$YOUR_GENERATED_HASH_HERE',
     true
   )
   ON CONFLICT (email) DO NOTHING;
   ```

4. Run this in the SQL editor.

5. Verify:
   ```sql
   SELECT id, name, email, is_active FROM super_admins;
   ```

---

## Step 7 — (Optional) Run RLS Policies

> RLS is the backup security layer. Skip for now during development.
> Run this in Phase 10 (production hardening).

File: [`database/rls_policies.sql`](../database/rls_policies.sql)

---

## Step 8 — Start the Backend

```bash
cd backend
npm install
npm run dev
```

You should see:
```
✓ Server running on http://localhost:5000
✓ Environment: development
```

Test the connection:
```bash
curl http://localhost:5000/health
# Response: {"status":"ok","timestamp":"..."}
```

Test login (after seeding super admin):
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"YourPassword123!","role":"super_admin"}'
```

---

## Step 9 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

You should see the portal selector with 4 role cards.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Missing SUPABASE_URL` error | Check `.env` file exists in `backend/` |
| Keys mismatch / 401 from Supabase | Re-copy keys from Supabase Dashboard → Settings → API |
| Tables already exist error | Run `DROP TABLE IF EXISTS ... CASCADE` then re-run migration, OR add `IF NOT EXISTS` (already included) |
| bcrypt hash not working | Ensure you used rounds=12 and the hash starts with `$2a$12$` |
| CORS error from frontend | Confirm `FRONTEND_URL=http://localhost:5173` in `.env` |
| Port 5000 in use | Change `PORT=5001` in `.env` and `VITE_API_BASE_URL` in frontend `.env` |

---

## Quick Reference — Tables and Their Purpose

| Table | Purpose |
|-------|---------|
| `super_admins` | Platform owner accounts |
| `admins` | Tenant owners (each = one isolated tenant) |
| `counselors` | Counselors under an admin |
| `students` | Students under an admin |
| `student_profiles` | Extended student profile data |
| `student_exam_scores` | JEE/MHT-CET/NEET scores per student |
| `colleges` | Master college list |
| `college_branches` | Branches offered per college |
| `cutoff_data` | Historical cutoff data (uploaded by admin) |
| `predictions` | AI prediction results |
| `college_tracking` | Student college watchlist |
| `sessions` | Counseling session bookings |
| `notifications` | Admin/counselor notifications |
| `notification_reads` | Read receipts per user |
| `reports` | Generated PDF report records |
| `sponsored_colleges` | Sponsored college configurations |
| `sponsored_performance` | Impression/click tracking |
