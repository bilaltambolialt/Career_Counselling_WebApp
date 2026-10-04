-- ============================================================
-- SEED: 03 — Top Colleges (platform-wide, no tenant)
-- Run ONCE after migration v1_15_0_top_colleges.sql
-- Idempotent: safe to re-run (ON CONFLICT DO NOTHING)
-- Requires: top_colleges table with unique(field, program, college_name)
-- ============================================================

DO $$ BEGIN
  ALTER TABLE top_colleges
    ADD CONSTRAINT uq_top_colleges_field_program_name
    UNIQUE (field, program, college_name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- ENGINEERING — Computer Science / IT
-- ============================================================
INSERT INTO top_colleges
  (field, program, college_name, rank, location_city, location_state, college_type, affiliation, annual_fees, notable_features)
VALUES
  ('Engineering', 'Computer Science Engineering', 'Indian Institute of Technology Bombay',     1, 'Mumbai',           'Maharashtra', 'Government', 'IIT Bombay',                    NULL,      'QS World Rank Top 200; highest placement packages'),
  ('Engineering', 'Computer Science Engineering', 'Indian Institute of Technology Delhi',      2, 'New Delhi',         'Delhi',       'Government', 'IIT Delhi',                     NULL,      'Strong research output; central location advantage'),
  ('Engineering', 'Computer Science Engineering', 'Indian Institute of Technology Madras',     3, 'Chennai',           'Tamil Nadu',  'Government', 'IIT Madras',                    NULL,      'Top-ranked by NIRF 2024'),
  ('Engineering', 'Computer Science Engineering', 'National Institute of Technology Trichy',   4, 'Tiruchirappalli',   'Tamil Nadu',  'Government', 'NIT Trichy',                    130000,    'Best NIT by NIRF; strong alumni network'),
  ('Engineering', 'Computer Science Engineering', 'National Institute of Technology Warangal', 5, 'Warangal',          'Telangana',   'Government', 'NIT Warangal',                  135000,    'Strong industry tie-ups in IT sector'),
  ('Engineering', 'Computer Science Engineering', 'College of Engineering Pune',               6, 'Pune',              'Maharashtra', 'Government', 'Savitribai Phule Pune University', 95000,  'Oldest engineering college in Asia; excellent placements'),
  ('Engineering', 'Computer Science Engineering', 'Veermata Jijabai Technological Institute',  7, 'Mumbai',            'Maharashtra', 'Government', 'University of Mumbai',          105000,   'Premier Mumbai government college; strong core CS'),
  ('Engineering', 'Computer Science Engineering', 'Dwarkadas J. Sanghvi College of Engineering', 8, 'Mumbai',          'Maharashtra', 'Private',    'University of Mumbai',          230000,   'Top autonomous private college in Mumbai'),

-- ============================================================
-- ENGINEERING — Civil Engineering
-- ============================================================
  ('Engineering', 'Civil Engineering', 'Indian Institute of Technology Bombay',     1, 'Mumbai',           'Maharashtra', 'Government', 'IIT Bombay',                    NULL,      'World-class infrastructure research labs'),
  ('Engineering', 'Civil Engineering', 'Indian Institute of Technology Delhi',      2, 'New Delhi',         'Delhi',       'Government', 'IIT Delhi',                     NULL,      'Specialisation in structural and geo-technical'),
  ('Engineering', 'Civil Engineering', 'Indian Institute of Technology Madras',     3, 'Chennai',           'Tamil Nadu',  'Government', 'IIT Madras',                    NULL,      'Coastal & ocean engineering strengths'),
  ('Engineering', 'Civil Engineering', 'National Institute of Technology Trichy',   4, 'Tiruchirappalli',   'Tamil Nadu',  'Government', 'NIT Trichy',                    125000,    'Strong government job placements'),
  ('Engineering', 'Civil Engineering', 'College of Engineering Pune',               5, 'Pune',              'Maharashtra', 'Government', 'Savitribai Phule Pune University', 90000,  'Legacy civil program; strong state PWD alumni'),

-- ============================================================
-- ENGINEERING — Mechanical Engineering
-- ============================================================
  ('Engineering', 'Mechanical Engineering', 'Indian Institute of Technology Bombay',     1, 'Mumbai',           'Maharashtra', 'Government', 'IIT Bombay',    NULL,   'World-class manufacturing & design labs'),
  ('Engineering', 'Mechanical Engineering', 'Indian Institute of Technology Madras',     2, 'Chennai',           'Tamil Nadu',  'Government', 'IIT Madras',    NULL,   'NIRF top mechanical program'),
  ('Engineering', 'Mechanical Engineering', 'National Institute of Technology Warangal', 3, 'Warangal',          'Telangana',   'Government', 'NIT Warangal',  130000, 'Strong automotive & manufacturing placements'),
  ('Engineering', 'Mechanical Engineering', 'College of Engineering Pune',               4, 'Pune',              'Maharashtra', 'Government', 'Savitribai Phule Pune University', 90000, 'Closest to Pune auto industry hub'),
  ('Engineering', 'Mechanical Engineering', 'Maharashtra Institute of Technology Pune',  5, 'Pune',              'Maharashtra', 'Private',    'Savitribai Phule Pune University', 185000, 'Good industry linkages with Pune manufacturing belt'),

-- ============================================================
-- ENGINEERING — Electronics & Telecommunication
-- ============================================================
  ('Engineering', 'Electronics and Telecommunication Engineering', 'Indian Institute of Technology Delhi',  1, 'New Delhi', 'Delhi',       'Government', 'IIT Delhi',  NULL,   'Premier telecom & VLSI research'),
  ('Engineering', 'Electronics and Telecommunication Engineering', 'Indian Institute of Technology Bombay', 2, 'Mumbai',    'Maharashtra', 'Government', 'IIT Bombay', NULL,   'Top chip design & embedded systems program'),
  ('Engineering', 'Electronics and Telecommunication Engineering', 'National Institute of Technology Trichy',3,'Tiruchirappalli','Tamil Nadu','Government','NIT Trichy', 130000, 'Strong VLSI & RF placements'),
  ('Engineering', 'Electronics and Telecommunication Engineering', 'Veermata Jijabai Technological Institute',4,'Mumbai',  'Maharashtra', 'Government', 'University of Mumbai', 100000, 'Strong Mumbai electronics industry ties'),

-- ============================================================
-- MEDICAL — MBBS
-- ============================================================
  ('Medical', 'MBBS', 'All India Institute of Medical Sciences Delhi',  1, 'New Delhi', 'Delhi',       'Government', 'AIIMS Delhi',  NULL,   'India''s No.1 medical institution; NIRF rank 1'),
  ('Medical', 'MBBS', 'All India Institute of Medical Sciences Mumbai', 2, 'Mumbai',    'Maharashtra', 'Government', 'AIIMS Mumbai', NULL,   'Premier AIIMS in Maharashtra; newest AIIMS campus'),
  ('Medical', 'MBBS', 'Seth G.S. Medical College and K.E.M. Hospital', 3, 'Mumbai',    'Maharashtra', 'Government', 'University of Mumbai', 25000, 'One of India''s oldest and largest teaching hospitals'),
  ('Medical', 'MBBS', 'Jawaharlal Institute of Postgraduate Medical Education and Research', 4, 'Puducherry', 'Puducherry', 'Government', 'Central Government', NULL, 'JIPMER — high NEET cutoff; excellent clinical exposure'),
  ('Medical', 'MBBS', 'Christian Medical College',                      5, 'Vellore',   'Tamil Nadu',  'Private',    'CMC Vellore',  650000, 'Consistently top-5 in NIRF; world-class research'),

-- ============================================================
-- MEDICAL — BDS
-- ============================================================
  ('Medical', 'BDS', 'All India Institute of Medical Sciences Delhi',   1, 'New Delhi', 'Delhi',       'Government', 'AIIMS Delhi',  NULL,   'Only dental program at AIIMS Delhi; ultra-competitive'),
  ('Medical', 'BDS', 'Maulana Azad Institute of Dental Sciences',       2, 'New Delhi', 'Delhi',       'Government', 'Delhi University', 30000, 'Top government dental college in North India'),
  ('Medical', 'BDS', 'Seth G.S. Medical College and K.E.M. Hospital',   3, 'Mumbai',    'Maharashtra', 'Government', 'University of Mumbai', 20000, 'Attached to major teaching hospital'),
  ('Medical', 'BDS', 'Manipal College of Dental Sciences',              4, 'Manipal',   'Karnataka',   'Deemed',     'Manipal University', 800000, 'Top private dental college; strong placements'),

-- ============================================================
-- MEDICAL — MD General Medicine (PG)
-- ============================================================
  ('Medical', 'MD General Medicine', 'All India Institute of Medical Sciences Delhi',  1, 'New Delhi', 'Delhi',       'Government', 'AIIMS Delhi',  NULL,   'NEET PG most competitive MD seat in India'),
  ('Medical', 'MD General Medicine', 'Seth G.S. Medical College and K.E.M. Hospital', 2, 'Mumbai',    'Maharashtra', 'Government', 'University of Mumbai', NULL, 'Highest patient load in Maharashtra; excellent training'),
  ('Medical', 'MD General Medicine', 'Christian Medical College',                      3, 'Vellore',   'Tamil Nadu',  'Private',    'CMC Vellore',  NULL,   'World-renowned internal medicine training'),

-- ============================================================
-- LAW — LLB (5-Year Integrated)
-- ============================================================
  ('Law', 'LLB (5-Year Integrated)', 'National Law School of India University',         1, 'Bengaluru',   'Karnataka',    'Government', 'NLU Bangalore',  200000, 'India''s top NLU; CLAT top cutoff; stellar alumni'),
  ('Law', 'LLB (5-Year Integrated)', 'NALSAR University of Law',                        2, 'Hyderabad',   'Telangana',    'Government', 'NALSAR',         195000, 'CLAT rank 2 consistent; strong litigation program'),
  ('Law', 'LLB (5-Year Integrated)', 'National Law University Delhi',                   3, 'New Delhi',   'Delhi',        'Government', 'NLU Delhi',      210000, 'Strong corporate & constitutional law; central location'),
  ('Law', 'LLB (5-Year Integrated)', 'West Bengal National University of Juridical Sciences', 4, 'Kolkata', 'West Bengal', 'Government', 'NUJS',           190000, 'Premier NLU in East India'),
  ('Law', 'LLB (5-Year Integrated)', 'Symbiosis Law School Pune',                       5, 'Pune',        'Maharashtra',  'Deemed',     'Symbiosis International University', 350000, 'Top private law school; strong moot court culture'),

-- ============================================================
-- LAW — LLM
-- ============================================================
  ('Law', 'LLM', 'National Law School of India University',       1, 'Bengaluru', 'Karnataka', 'Government', 'NLU Bangalore', NULL, 'Best LLM program in India by ranking'),
  ('Law', 'LLM', 'Faculty of Law, University of Delhi',           2, 'New Delhi', 'Delhi',     'Government', 'Delhi University', 15000, 'Largest law school in India; affordable fees'),
  ('Law', 'LLM', 'National Law University Delhi',                 3, 'New Delhi', 'Delhi',     'Government', 'NLU Delhi',     NULL, 'Strong academic research & publication culture'),

-- ============================================================
-- MANAGEMENT — MBA
-- ============================================================
  ('Management', 'MBA', 'Indian Institute of Management Ahmedabad', 1, 'Ahmedabad', 'Gujarat',     'Government', 'IIM Ahmedabad', NULL, 'India''s #1 B-school; highest CAT cutoff'),
  ('Management', 'MBA', 'Indian Institute of Management Bangalore', 2, 'Bengaluru', 'Karnataka',   'Government', 'IIM Bangalore', NULL, 'Strong finance & consulting placements'),
  ('Management', 'MBA', 'Indian Institute of Management Calcutta',  3, 'Kolkata',   'West Bengal', 'Government', 'IIM Calcutta',  NULL, 'Oldest IIM; NIRF rank 3; strong alumni network'),
  ('Management', 'MBA', 'XLRI — Xavier School of Management',       4, 'Jamshedpur','Jharkhand',   'Private',    'XLRI',          1800000, 'Top private B-school; best HR management program'),
  ('Management', 'MBA', 'Faculty of Management Studies Delhi',      5, 'New Delhi', 'Delhi',       'Government', 'Delhi University', 20000, 'Most affordable top-tier MBA; strong Delhi industry access'),

-- ============================================================
-- PHARMACY — B.Pharm
-- ============================================================
  ('Pharmacy', 'B.Pharm', 'JSS College of Pharmacy',                1, 'Mysuru',    'Karnataka',   'Deemed',     'JSS University',    350000, 'Consistently NIRF top pharmacy college'),
  ('Pharmacy', 'B.Pharm', 'Manipal College of Pharmaceutical Sciences', 2, 'Manipal', 'Karnataka', 'Deemed',    'Manipal University', 400000, 'Strong industry placements; well-equipped labs'),
  ('Pharmacy', 'B.Pharm', 'Bombay College of Pharmacy',             3, 'Mumbai',    'Maharashtra', 'Private',    'University of Mumbai', 95000, 'Premier pharmacy college in Maharashtra'),
  ('Pharmacy', 'B.Pharm', 'Poona College of Pharmacy',              4, 'Pune',      'Maharashtra', 'Private',    'Savitribai Phule Pune University', 90000, 'Strong pharma industry linkages in Pune'),

-- ============================================================
-- ARCHITECTURE — B.Arch
-- ============================================================
  ('Architecture', 'B.Arch', 'School of Planning and Architecture Delhi', 1, 'New Delhi', 'Delhi',       'Government', 'Central Government', 50000,  'India''s premier architecture school; NATA top cutoff'),
  ('Architecture', 'B.Arch', 'Indian Institute of Technology Roorkee',    2, 'Roorkee',   'Uttarakhand', 'Government', 'IIT Roorkee',         NULL,   'Strong structural & sustainable design focus'),
  ('Architecture', 'B.Arch', 'Rizvi College of Architecture',             3, 'Mumbai',    'Maharashtra', 'Private',    'University of Mumbai', 280000, 'Top private architecture college in Mumbai'),
  ('Architecture', 'B.Arch', 'Academy of Architecture',                   4, 'Mumbai',    'Maharashtra', 'Private',    'University of Mumbai', 320000, 'Strong urban design & international exposure')

ON CONFLICT (field, program, college_name) DO NOTHING;

-- ============================================================
-- VERIFY
-- SELECT field, program, COUNT(*) as entries
-- FROM top_colleges
-- GROUP BY field, program
-- ORDER BY field, program;
-- ============================================================
