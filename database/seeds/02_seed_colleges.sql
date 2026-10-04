-- ============================================================
-- SEED: 02 — Master College & Branch List
-- Run ONCE after migration v1.1.0
-- Idempotent: safe to re-run (ON CONFLICT DO NOTHING)
-- ============================================================

-- Ensure unique constraints exist (idempotent DO blocks)
DO $$ BEGIN
  ALTER TABLE colleges ADD CONSTRAINT colleges_name_unique UNIQUE (name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE college_branches ADD CONSTRAINT branches_college_name_unique UNIQUE (college_id, branch_name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- ENGINEERING COLLEGES
-- ============================================================
INSERT INTO colleges (name, short_name, location, state, college_type, affiliation, is_active)
VALUES
  ('Indian Institute of Technology Bombay',          'IIT Bombay',   'Mumbai',              'Maharashtra', 'Government', 'IIT Bombay',   true),
  ('Indian Institute of Technology Delhi',           'IIT Delhi',    'New Delhi',           'Delhi',       'Government', 'IIT Delhi',    true),
  ('Indian Institute of Technology Madras',          'IIT Madras',   'Chennai',             'Tamil Nadu',  'Government', 'IIT Madras',   true),
  ('National Institute of Technology Trichy',        'NIT Trichy',   'Tiruchirappalli',     'Tamil Nadu',  'Government', 'NIT Trichy',   true),
  ('National Institute of Technology Warangal',      'NIT Warangal', 'Warangal',            'Telangana',   'Government', 'NIT Warangal', true),
  ('College of Engineering Pune',                    'COEP',         'Pune',                'Maharashtra', 'Government', 'Savitribai Phule Pune University', true),
  ('Veermata Jijabai Technological Institute',       'VJTI',         'Mumbai',              'Maharashtra', 'Government', 'University of Mumbai', true),
  ('Maharashtra Institute of Technology Pune',       'MIT Pune',     'Pune',                'Maharashtra', 'Private',    'Savitribai Phule Pune University', true),
  ('Sardar Patel College of Engineering',            'SPCE',         'Mumbai',              'Maharashtra', 'Private',    'University of Mumbai', true),
  ('Dwarkadas J. Sanghvi College of Engineering',   'DJ Sanghvi',   'Mumbai',              'Maharashtra', 'Private',    'University of Mumbai', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- MEDICAL COLLEGES
-- ============================================================
INSERT INTO colleges (name, short_name, location, state, college_type, affiliation, is_active)
VALUES
  ('All India Institute of Medical Sciences Delhi', 'AIIMS Delhi',  'New Delhi', 'Delhi',       'Government', 'AIIMS Delhi',  true),
  ('All India Institute of Medical Sciences Mumbai','AIIMS Mumbai', 'Mumbai',    'Maharashtra', 'Government', 'AIIMS Mumbai', true),
  ('Seth G.S. Medical College and K.E.M. Hospital', 'KEM Mumbai',  'Mumbai',    'Maharashtra', 'Government', 'University of Mumbai', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- ENGINEERING BRANCHES (for all engineering colleges)
-- ============================================================
INSERT INTO college_branches (college_id, branch_name, branch_code, total_seats, is_active)
SELECT c.id, b.branch_name, b.branch_code, b.total_seats, true
FROM colleges c
CROSS JOIN (VALUES
  ('Computer Engineering',                       'CO', 60),
  ('Information Technology',                     'IT', 60),
  ('Electronics and Telecommunication Engineering','ET', 60),
  ('Mechanical Engineering',                     'ME', 60),
  ('Civil Engineering',                          'CE', 60),
  ('Electrical Engineering',                     'EE', 60)
) AS b(branch_name, branch_code, total_seats)
WHERE c.short_name IN (
  'IIT Bombay', 'IIT Delhi', 'IIT Madras',
  'NIT Trichy', 'NIT Warangal',
  'COEP', 'VJTI', 'MIT Pune', 'SPCE', 'DJ Sanghvi'
)
ON CONFLICT (college_id, branch_name) DO NOTHING;

-- ============================================================
-- MEDICAL BRANCHES (for medical colleges)
-- ============================================================
INSERT INTO college_branches (college_id, branch_name, branch_code, total_seats, is_active)
SELECT c.id, b.branch_name, b.branch_code, b.total_seats, true
FROM colleges c
CROSS JOIN (VALUES
  ('MBBS',               'MBBS', 150),
  ('MD General Medicine','MD',   30),
  ('BDS',                'BDS',  60)
) AS b(branch_name, branch_code, total_seats)
WHERE c.short_name IN ('AIIMS Delhi', 'AIIMS Mumbai', 'KEM Mumbai')
ON CONFLICT (college_id, branch_name) DO NOTHING;

-- ============================================================
-- VERIFY
-- SELECT c.name, cb.branch_name FROM colleges c
-- JOIN college_branches cb ON cb.college_id = c.id
-- ORDER BY c.name, cb.branch_name;
-- ============================================================
