-- ============================================================
-- MIGRATION: v1.0.0 — Initial Multi-Tenant Schema
-- Project: College Admission Prediction & Notification WebApp
-- Date: 2026-02-24
-- Description: Create all base tables with tenant isolation
-- ============================================================

-- Enable UUID extension (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE 1: super_admins
-- Platform-level administrators
-- ============================================================
CREATE TABLE IF NOT EXISTS super_admins (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE super_admins IS 'Platform-level administrators. No tenant scope.';

-- ============================================================
-- TABLE 2: admins
-- Tenant owners. admin.id = tenant_id throughout the system.
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(150) NOT NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  organization_name VARCHAR(255) NOT NULL,
  phone             VARCHAR(20),
  city              VARCHAR(100),
  state             VARCHAR(100),
  is_active         BOOLEAN      NOT NULL DEFAULT true,
  subscription_plan VARCHAR(50)  NOT NULL DEFAULT 'basic',
  created_by        UUID         REFERENCES super_admins(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE admins IS 'Tenant owners. admin.id is used as tenant_id for all data under this admin.';
COMMENT ON COLUMN admins.subscription_plan IS 'Values: basic, pro, enterprise';

-- ============================================================
-- TABLE 3: counselors
-- Sub-users under an Admin tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS counselors (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID         NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  name             VARCHAR(150) NOT NULL,
  email            VARCHAR(255) NOT NULL,
  phone            VARCHAR(20),
  specialization   VARCHAR(150),
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  created_by       UUID         NOT NULL REFERENCES admins(id),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (email, tenant_id)
);

COMMENT ON TABLE counselors IS 'Counselors are sub-users of an admin tenant. tenant_id enforces isolation.';

-- ============================================================
-- TABLE 4: students
-- Students managed within a tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID        NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  assigned_counselor_id  UUID        REFERENCES counselors(id) ON DELETE SET NULL,
  name                   VARCHAR(150) NOT NULL,
  email                  VARCHAR(255) NOT NULL,
  phone                  VARCHAR(20),
  category               VARCHAR(20) NOT NULL,
  is_active              BOOLEAN     NOT NULL DEFAULT true,
  created_by             UUID        NOT NULL,
  created_by_role        VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, tenant_id),
  CONSTRAINT valid_category CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'EWS')),
  CONSTRAINT valid_created_by_role CHECK (created_by_role IN ('admin', 'counselor'))
);

COMMENT ON TABLE students IS 'Students are tenant-scoped. tenant_id always = admin.id.';
COMMENT ON COLUMN students.category IS 'Admission category: General, OBC, SC, ST, EWS';

-- ============================================================
-- TABLE 5: student_profiles
-- Extended profile data for each student (1:1)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_profiles (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID         NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  tenant_id          UUID         NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  dob                DATE,
  gender             VARCHAR(20),
  address            TEXT,
  city               VARCHAR(100),
  state              VARCHAR(100),
  preferred_location VARCHAR(150),
  preferred_branch   VARCHAR(150),
  exam_type          VARCHAR(50),
  profile_complete   BOOLEAN      NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_gender CHECK (gender IN ('Male', 'Female', 'Other') OR gender IS NULL)
);

COMMENT ON TABLE student_profiles IS 'Extended student profile. 1:1 with students table.';

-- ============================================================
-- TABLE 6: student_exam_scores
-- Exam score entries per student (multiple exams possible)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_exam_scores (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID          NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tenant_id   UUID          NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  exam_type   VARCHAR(50)   NOT NULL,
  year        SMALLINT      NOT NULL,
  score       NUMERIC(8,2),
  percentile  NUMERIC(6,4),
  rank        INTEGER,
  is_primary  BOOLEAN       NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT valid_percentile CHECK (percentile IS NULL OR (percentile >= 0 AND percentile <= 100)),
  CONSTRAINT valid_exam_type CHECK (exam_type IN ('JEE_MAIN', 'JEE_ADVANCED', 'MHT_CET', 'OTHER'))
);

COMMENT ON TABLE student_exam_scores IS 'Exam scores for students. Multiple scores per student allowed.';
COMMENT ON COLUMN student_exam_scores.is_primary IS 'Marks the score to be used for AI predictions by default';

-- ============================================================
-- TABLE 7: colleges
-- Master college list — platform-wide (not tenant-scoped)
-- ============================================================
CREATE TABLE IF NOT EXISTS colleges (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  short_name    VARCHAR(50),
  location      VARCHAR(150),
  state         VARCHAR(100),
  college_type  VARCHAR(50)  NOT NULL,
  affiliation   VARCHAR(150),
  website       VARCHAR(255),
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_college_type CHECK (college_type IN ('Government', 'Private', 'Aided', 'Autonomous'))
);

COMMENT ON TABLE colleges IS 'Master college list. Platform-wide, not tenant-scoped.';

-- ============================================================
-- TABLE 8: college_branches
-- Branches offered per college
-- ============================================================
CREATE TABLE IF NOT EXISTS college_branches (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id   UUID         NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  branch_name  VARCHAR(150) NOT NULL,
  branch_code  VARCHAR(50),
  total_seats  SMALLINT,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE college_branches IS 'Branches offered at each college. Platform-wide.';

-- ============================================================
-- TABLE 9: cutoff_data
-- Historical cutoff data uploaded by Admin (tenant-scoped)
-- ============================================================
CREATE TABLE IF NOT EXISTS cutoff_data (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID          NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  college_id        UUID          NOT NULL REFERENCES colleges(id),
  branch_id         UUID          NOT NULL REFERENCES college_branches(id),
  year              SMALLINT      NOT NULL,
  round             SMALLINT      NOT NULL,
  category          VARCHAR(20)   NOT NULL,
  cutoff_percentile NUMERIC(6,4),
  cutoff_rank       INTEGER,
  cutoff_score      NUMERIC(8,2),
  uploaded_by       UUID          NOT NULL REFERENCES admins(id),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT valid_round CHECK (round BETWEEN 1 AND 6),
  CONSTRAINT valid_cutoff_category CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'EWS')),
  CONSTRAINT has_at_least_one_cutoff CHECK (
    cutoff_percentile IS NOT NULL OR cutoff_rank IS NOT NULL OR cutoff_score IS NOT NULL
  )
);

COMMENT ON TABLE cutoff_data IS 'Historical cutoff data uploaded by admin. Tenant-scoped.';

-- ============================================================
-- TABLE 10: predictions
-- AI-generated admission predictions (tenant-scoped)
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id             UUID          NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tenant_id              UUID          NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  college_id             UUID          NOT NULL REFERENCES colleges(id),
  branch_id              UUID          NOT NULL REFERENCES college_branches(id),
  exam_score_id          UUID          NOT NULL REFERENCES student_exam_scores(id),
  probability_percentage NUMERIC(5,2)  NOT NULL,
  confidence_score       NUMERIC(4,3)  NOT NULL,
  classification         VARCHAR(20)   NOT NULL,
  risk_level             VARCHAR(20)   NOT NULL,
  score_diff_pct         NUMERIC(6,2),
  avg_cutoff_used        NUMERIC(8,2),
  trend_shift            NUMERIC(6,2),
  strategy_suggestion    TEXT,
  algorithm_version      VARCHAR(20)   NOT NULL DEFAULT 'v1.0',
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT valid_probability CHECK (probability_percentage BETWEEN 0 AND 100),
  CONSTRAINT valid_confidence CHECK (confidence_score BETWEEN 0 AND 1),
  CONSTRAINT valid_classification CHECK (classification IN ('Dream', 'Safe', 'Backup')),
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('Low', 'Medium', 'High'))
);

COMMENT ON TABLE predictions IS 'AI prediction results per student per college/branch. Tenant-scoped.';

-- ============================================================
-- TABLE 11: college_tracking
-- Students tracking colleges of interest
-- ============================================================
CREATE TABLE IF NOT EXISTS college_tracking (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tenant_id   UUID        NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  college_id  UUID        NOT NULL REFERENCES colleges(id),
  branch_id   UUID        REFERENCES college_branches(id),
  status      VARCHAR(30) NOT NULL DEFAULT 'Interested',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, college_id, branch_id),
  CONSTRAINT valid_tracking_status CHECK (status IN ('Interested', 'Applied', 'Tracking', 'Removed'))
);

COMMENT ON TABLE college_tracking IS 'Student college tracker. Tenant-scoped.';

-- ============================================================
-- TABLE 12: sessions
-- Counseling session scheduling and management
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID         NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  counselor_id  UUID         NOT NULL REFERENCES counselors(id) ON DELETE CASCADE,
  tenant_id     UUID         NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  session_type  VARCHAR(50),
  requested_at  TIMESTAMPTZ,
  scheduled_at  TIMESTAMPTZ,
  status        VARCHAR(30)  NOT NULL DEFAULT 'Requested',
  meeting_link  VARCHAR(255),
  meeting_notes TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_session_status CHECK (status IN ('Requested', 'Confirmed', 'Completed', 'Cancelled')),
  CONSTRAINT valid_session_type CHECK (session_type IN ('Online', 'In-person') OR session_type IS NULL)
);

COMMENT ON TABLE sessions IS 'Counseling sessions between students and counselors. Tenant-scoped.';

-- ============================================================
-- TABLE 13: notifications
-- Notifications created by admin or counselor
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID         NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_by        UUID         NOT NULL,
  created_by_role   VARCHAR(20)  NOT NULL,
  title             VARCHAR(255) NOT NULL,
  message           TEXT         NOT NULL,
  target_role       VARCHAR(30)  NOT NULL,
  target_student_id UUID         REFERENCES students(id) ON DELETE CASCADE,
  is_published      BOOLEAN      NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_notif_creator_role CHECK (created_by_role IN ('admin', 'counselor', 'super_admin')),
  CONSTRAINT valid_target_role CHECK (target_role IN ('student', 'counselor', 'all'))
);

COMMENT ON TABLE notifications IS 'Notifications by admin/counselor within a tenant. Tenant-scoped.';

-- ============================================================
-- TABLE 14: notification_reads
-- Tracks read status per user per notification
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_reads (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id  UUID        NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  tenant_id        UUID        NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL,
  user_role        VARCHAR(20) NOT NULL,
  read_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id),
  CONSTRAINT valid_notif_reader_role CHECK (user_role IN ('student', 'counselor'))
);

COMMENT ON TABLE notification_reads IS 'Tracks who has read which notification. Tenant-scoped.';

-- ============================================================
-- TABLE 15: reports
-- All generated reports — both student summary and counselor detailed
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tenant_id          UUID        NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  generated_by       UUID        NOT NULL,
  generated_by_role  VARCHAR(20) NOT NULL,
  report_type        VARCHAR(30) NOT NULL,
  version            SMALLINT    NOT NULL DEFAULT 1,
  pdf_url            TEXT,
  is_current         BOOLEAN     NOT NULL DEFAULT true,
  metadata           JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_report_generator_role CHECK (generated_by_role IN ('student', 'counselor')),
  CONSTRAINT valid_report_type CHECK (report_type IN ('student_summary', 'counselor_detailed'))
);

COMMENT ON TABLE reports IS 'Generated PDF reports. Versioned. Tenant-scoped.';
COMMENT ON COLUMN reports.metadata IS 'Stores prediction IDs, college list, params used for regeneration';
COMMENT ON COLUMN reports.is_current IS 'False for older versions when regenerated';

-- ============================================================
-- TABLE 16: sponsored_colleges
-- Sponsored college entries — platform-wide or tenant-specific
-- ============================================================
CREATE TABLE IF NOT EXISTS sponsored_colleges (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id            UUID          NOT NULL REFERENCES colleges(id),
  tenant_id             UUID          REFERENCES admins(id) ON DELETE CASCADE,
  bias_weight           NUMERIC(4,3)  NOT NULL DEFAULT 0.200,
  revenue_per_inclusion NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  is_active             BOOLEAN       NOT NULL DEFAULT true,
  created_by            UUID          NOT NULL,
  created_by_role       VARCHAR(20)   NOT NULL,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT valid_bias_weight CHECK (bias_weight BETWEEN 0 AND 1),
  CONSTRAINT valid_sponsor_creator_role CHECK (created_by_role IN ('super_admin', 'admin'))
);

COMMENT ON TABLE sponsored_colleges IS 'tenant_id NULL = platform-wide sponsorship. Set = tenant-specific.';
COMMENT ON COLUMN sponsored_colleges.bias_weight IS 'Boost factor (0–1) applied in AI recommendation engine';

-- ============================================================
-- TABLE 17: sponsored_performance
-- Tracks impressions, clicks, report inclusions for sponsored colleges
-- ============================================================
CREATE TABLE IF NOT EXISTS sponsored_performance (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsored_college_id  UUID        NOT NULL REFERENCES sponsored_colleges(id) ON DELETE CASCADE,
  tenant_id             UUID        NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  student_id            UUID        REFERENCES students(id) ON DELETE SET NULL,
  event_type            VARCHAR(50) NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_sponsor_event CHECK (event_type IN ('impression', 'click', 'report_inclusion'))
);

COMMENT ON TABLE sponsored_performance IS 'Sponsored college interaction tracking. Tenant-scoped.';

-- ============================================================
-- TABLE 18: otp_verifications
-- OTP storage for email-based authentication
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_verifications (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ  NOT NULL,
  is_used     BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT valid_otp_role CHECK (role IN ('super_admin', 'admin', 'counselor', 'student'))
);

COMMENT ON TABLE otp_verifications IS 'OTP records for login. Expires in 5 minutes. Single use.';

-- ============================================================
-- INDEXES — Performance optimization
-- ============================================================

CREATE INDEX idx_counselors_tenant       ON counselors(tenant_id);
CREATE INDEX idx_students_tenant         ON students(tenant_id);
CREATE INDEX idx_students_counselor      ON students(assigned_counselor_id);
CREATE INDEX idx_student_profiles_student ON student_profiles(student_id, tenant_id);
CREATE INDEX idx_exam_scores_student     ON student_exam_scores(student_id, tenant_id);
CREATE INDEX idx_cutoff_tenant_college   ON cutoff_data(tenant_id, college_id, year, round, category);
CREATE INDEX idx_predictions_student     ON predictions(student_id, tenant_id);
CREATE INDEX idx_predictions_college     ON predictions(college_id, branch_id);
CREATE INDEX idx_tracking_student        ON college_tracking(student_id, tenant_id);
CREATE INDEX idx_sessions_tenant         ON sessions(tenant_id, counselor_id, status);
CREATE INDEX idx_sessions_student        ON sessions(student_id, status);
CREATE INDEX idx_notifications_tenant    ON notifications(tenant_id, is_published);
CREATE INDEX idx_notif_reads_user        ON notification_reads(user_id, tenant_id);
CREATE INDEX idx_reports_student         ON reports(student_id, tenant_id, report_type, is_current);
CREATE INDEX idx_sponsored_tenant        ON sponsored_colleges(tenant_id, is_active);
CREATE INDEX idx_sponsored_college       ON sponsored_colleges(college_id, is_active);
CREATE INDEX idx_sponsor_perf_tenant     ON sponsored_performance(tenant_id, event_type, created_at);
CREATE INDEX idx_otp_email_lookup        ON otp_verifications(email, role, is_used, expires_at);

-- ============================================================
-- updated_at trigger function (auto-update timestamps)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_counselors_updated_at
  BEFORE UPDATE ON counselors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_exam_scores_updated_at
  BEFORE UPDATE ON student_exam_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_colleges_updated_at
  BEFORE UPDATE ON colleges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tracking_updated_at
  BEFORE UPDATE ON college_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sponsored_updated_at
  BEFORE UPDATE ON sponsored_colleges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- END OF MIGRATION v1.0.0
-- ============================================================
