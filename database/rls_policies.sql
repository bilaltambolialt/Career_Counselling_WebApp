-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- Project: College Admission Prediction & Notification WebApp
-- Version: v1.0.0
-- Date: 2026-02-24
-- ============================================================
-- IMPORTANT: These policies assume a custom JWT flow where
-- tenantId, userId, and role are embedded in the JWT token.
-- Access via: auth.jwt() ->> 'tenantId'
--             auth.jwt() ->> 'userId'
--             auth.jwt() ->> 'role'
-- ============================================================

-- ============================================================
-- HELPER: Extract claims from JWT
-- ============================================================
-- (auth.jwt() ->> 'tenantId')::uuid  → current tenant
-- (auth.jwt() ->> 'userId')::uuid    → current user
-- auth.jwt() ->> 'role'              → role string

-- ============================================================
-- ENABLE RLS ON ALL TENANT-SCOPED TABLES
-- ============================================================

ALTER TABLE admins                ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE students              ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_scores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cutoff_data           ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_tracking      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_colleges    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_performance ENABLE ROW LEVEL SECURITY;

-- colleges and college_branches are public-readable, no RLS needed
-- super_admins table accessed only via service role


-- ============================================================
-- TABLE: admins
-- ============================================================

-- Super admin can see all admins
CREATE POLICY "super_admin_full_access_admins"
  ON admins FOR ALL
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Admins can only see their own record
CREATE POLICY "admin_sees_own_record"
  ON admins FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND id = (auth.jwt() ->> 'userId')::uuid
  );


-- ============================================================
-- TABLE: counselors
-- ============================================================

-- Super admin: read all
CREATE POLICY "super_admin_read_all_counselors"
  ON counselors FOR SELECT
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Admin: full access within own tenant
CREATE POLICY "admin_full_access_own_counselors"
  ON counselors FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Counselor: can read own record only
CREATE POLICY "counselor_reads_own_record"
  ON counselors FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'counselor'
    AND id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );


-- ============================================================
-- TABLE: students
-- ============================================================

-- Super admin: read all
CREATE POLICY "super_admin_read_all_students"
  ON students FOR SELECT
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Admin: full access within own tenant
CREATE POLICY "admin_full_access_own_students"
  ON students FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Counselor: can only see assigned students within own tenant
CREATE POLICY "counselor_sees_assigned_students"
  ON students FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'counselor'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    AND assigned_counselor_id = (auth.jwt() ->> 'userId')::uuid
  );

-- Student: can only see own record
CREATE POLICY "student_sees_own_record"
  ON students FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'student'
    AND id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Student: can update own record (profile updates)
CREATE POLICY "student_updates_own_record"
  ON students FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'student'
    AND id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );


-- ============================================================
-- TABLE: student_profiles
-- ============================================================

-- Admin: full access within tenant
CREATE POLICY "admin_full_access_student_profiles"
  ON student_profiles FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Counselor: read assigned student profiles
CREATE POLICY "counselor_reads_assigned_profiles"
  ON student_profiles FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'counselor'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    AND student_id IN (
      SELECT id FROM students
      WHERE assigned_counselor_id = (auth.jwt() ->> 'userId')::uuid
        AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    )
  );

-- Student: read/write own profile
CREATE POLICY "student_manages_own_profile"
  ON student_profiles FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'student'
    AND student_id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );


-- ============================================================
-- TABLE: student_exam_scores
-- ============================================================

-- Admin: full access within tenant
CREATE POLICY "admin_full_access_exam_scores"
  ON student_exam_scores FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Counselor: read assigned student scores
CREATE POLICY "counselor_reads_assigned_scores"
  ON student_exam_scores FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'counselor'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    AND student_id IN (
      SELECT id FROM students
      WHERE assigned_counselor_id = (auth.jwt() ->> 'userId')::uuid
        AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    )
  );

-- Student: manage own scores
CREATE POLICY "student_manages_own_scores"
  ON student_exam_scores FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'student'
    AND student_id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );


-- ============================================================
-- TABLE: cutoff_data
-- ============================================================

-- Admin: full access within tenant
CREATE POLICY "admin_full_access_cutoff"
  ON cutoff_data FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Counselor: read within own tenant
CREATE POLICY "counselor_reads_tenant_cutoff"
  ON cutoff_data FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'counselor'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Student: read within own tenant
CREATE POLICY "student_reads_tenant_cutoff"
  ON cutoff_data FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'student'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );


-- ============================================================
-- TABLE: predictions
-- ============================================================

-- Admin: full access within tenant
CREATE POLICY "admin_full_access_predictions"
  ON predictions FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Counselor: read assigned student predictions
CREATE POLICY "counselor_reads_assigned_predictions"
  ON predictions FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'counselor'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    AND student_id IN (
      SELECT id FROM students
      WHERE assigned_counselor_id = (auth.jwt() ->> 'userId')::uuid
        AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    )
  );

-- Student: read/create own predictions
CREATE POLICY "student_manages_own_predictions"
  ON predictions FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'student'
    AND student_id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );


-- ============================================================
-- TABLE: college_tracking
-- ============================================================

-- Admin: full access within tenant
CREATE POLICY "admin_full_access_tracking"
  ON college_tracking FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Student: manages own tracking
CREATE POLICY "student_manages_own_tracking"
  ON college_tracking FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'student'
    AND student_id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );


-- ============================================================
-- TABLE: sessions
-- ============================================================

-- Admin: full access within tenant
CREATE POLICY "admin_full_access_sessions"
  ON sessions FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Counselor: read/update own sessions
CREATE POLICY "counselor_manages_own_sessions"
  ON sessions FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'counselor'
    AND counselor_id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Student: read own sessions, create session requests
CREATE POLICY "student_manages_own_sessions"
  ON sessions FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'student'
    AND student_id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );


-- ============================================================
-- TABLE: notifications
-- ============================================================

-- Super admin: read all
CREATE POLICY "super_admin_read_all_notifications"
  ON notifications FOR SELECT
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Admin: full access within tenant
CREATE POLICY "admin_full_access_notifications"
  ON notifications FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Counselor: create notifications for own students; read tenant notifications
CREATE POLICY "counselor_manages_notifications"
  ON notifications FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'counselor'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    AND (
      created_by = (auth.jwt() ->> 'userId')::uuid
      OR is_published = true
    )
  );

-- Student: read published notifications relevant to them
CREATE POLICY "student_reads_own_notifications"
  ON notifications FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'student'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    AND is_published = true
    AND (
      target_role = 'student'
      OR target_role = 'all'
      OR target_student_id = (auth.jwt() ->> 'userId')::uuid
    )
  );


-- ============================================================
-- TABLE: notification_reads
-- ============================================================

-- Admin: read all within tenant
CREATE POLICY "admin_reads_all_notif_reads"
  ON notification_reads FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Student/Counselor: manage own read records
CREATE POLICY "user_manages_own_notif_reads"
  ON notification_reads FOR ALL
  USING (
    user_id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );


-- ============================================================
-- TABLE: reports
-- ============================================================

-- Admin: full access within tenant
CREATE POLICY "admin_full_access_reports"
  ON reports FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- Counselor: access reports for assigned students only
CREATE POLICY "counselor_accesses_assigned_reports"
  ON reports FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'counselor'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
    AND (
      generated_by = (auth.jwt() ->> 'userId')::uuid
      OR student_id IN (
        SELECT id FROM students
        WHERE assigned_counselor_id = (auth.jwt() ->> 'userId')::uuid
          AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
      )
    )
  );

-- Student: access own reports
CREATE POLICY "student_accesses_own_reports"
  ON reports FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'student'
    AND student_id = (auth.jwt() ->> 'userId')::uuid
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );


-- ============================================================
-- TABLE: sponsored_colleges
-- ============================================================

-- Super admin: full access
CREATE POLICY "super_admin_full_access_sponsored"
  ON sponsored_colleges FOR ALL
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Admin: read/configure sponsored colleges for own tenant
CREATE POLICY "admin_manages_tenant_sponsored"
  ON sponsored_colleges FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND (
      tenant_id = (auth.jwt() ->> 'tenantId')::uuid
      OR tenant_id IS NULL  -- platform-wide visible to admin
    )
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenantId')::uuid  -- admin can only write to own tenant
  );

-- Counselor/Student: read active sponsored (own tenant or platform-wide)
CREATE POLICY "users_read_active_sponsored"
  ON sponsored_colleges FOR SELECT
  USING (
    is_active = true
    AND (
      tenant_id = (auth.jwt() ->> 'tenantId')::uuid
      OR tenant_id IS NULL
    )
  );


-- ============================================================
-- TABLE: sponsored_performance
-- ============================================================

-- Super admin: read all
CREATE POLICY "super_admin_reads_all_sponsor_perf"
  ON sponsored_performance FOR SELECT
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Admin: read own tenant performance
CREATE POLICY "admin_reads_tenant_sponsor_perf"
  ON sponsored_performance FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
    AND tenant_id = (auth.jwt() ->> 'tenantId')::uuid
  );

-- System can insert (triggered by backend, not client)
CREATE POLICY "backend_inserts_sponsor_perf"
  ON sponsored_performance FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenantId')::uuid);


-- ============================================================
-- END OF RLS POLICIES v1.0.0
-- ============================================================
-- NOTE: The service_role key in Supabase bypasses RLS.
-- NEVER use service_role key in frontend or user-facing API.
-- ONLY use it in trusted server-side migration scripts.
-- ============================================================
