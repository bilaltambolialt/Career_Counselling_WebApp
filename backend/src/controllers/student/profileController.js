import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

const VALID_GENDERS     = ['Male', 'Female', 'Other', 'Prefer not to say'];
const VALID_CATEGORIES  = ['OPEN', 'OBC', 'SC', 'ST', 'EWS'];
const VALID_STREAMS     = ['PCM', 'PCB', 'PCMB', 'PCM+PCB', 'Commerce', 'Arts', 'Other'];
const VALID_DOMAINS    = [
  'Engineering', 'Medical', 'Law', 'Management', 'Design / Architecture',
  'Pure Sciences', 'Commerce', 'Pharmacy', 'Agriculture',
];
const VALID_INCOME     = [
  'Below ₹1 Lakh', '₹1 Lakh – ₹2.5 Lakh', '₹2.5 Lakh – ₹5 Lakh',
  '₹5 Lakh – ₹10 Lakh', '₹10 Lakh – ₹25 Lakh', 'Above ₹25 Lakh',
];
const VALID_FEE_RANGES = [
  'Below ₹1 Lakh/year', '₹1 Lakh – ₹3 Lakh/year', '₹3 Lakh – ₹5 Lakh/year',
  '₹5 Lakh – ₹10 Lakh/year', '₹10 Lakh – ₹20 Lakh/year', 'Above ₹20 Lakh/year',
];

const VALID_QUALIFICATION_TYPES = ['12th', 'Diploma'];

const ALL_PROFILE_COLUMNS = `
  id, student_id, tenant_id,
  dob, gender, city, state,
  minority_status, annual_family_income, parent_mobile, college_fee_range,
  preferred_location, preferred_branch, exam_type,
  qualification_type,
  board_12th, stream_12th, percentage_12th, pcm_percentage, pcb_percentage,
  diploma_board, diploma_branch, diploma_percentage, diploma_year_of_passing,
  is_drop_year, num_attempts,
  domains_of_interest, preferred_degree_type, preferred_branches,
  preferred_states, preferred_cities,
  only_government_colleges, private_allowed, deemed_universities_allowed, autonomous_allowed,
  profile_complete, created_at, updated_at
`;

// ── GET /api/v1/student/profile ───────────────────────────────
export const getProfile = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    // Fetch profile + student base record (for phone + category, read-only display)
    const [profileRes, studentRes] = await Promise.all([
      supabase
        .from('student_profiles')
        .select(ALL_PROFILE_COLUMNS)
        .eq('student_id', userId)
        .maybeSingle(),
      supabase
        .from('students')
        .select('name, email, phone, category')
        .eq('id', userId)
        .eq('tenant_id', tenantId)
        .maybeSingle(),
    ]);

    if (profileRes.error) return sendError(res, 'Failed to fetch profile', 500, profileRes.error.message);

    const student = studentRes.data ?? {};
    const profile = profileRes.data ?? {
      student_id: userId,
      dob: null, gender: null, city: null, state: null,
      minority_status: false, annual_family_income: null, parent_mobile: null, college_fee_range: null,
      preferred_location: null, preferred_branch: null, exam_type: null,
      qualification_type: '12th',
      board_12th: null, stream_12th: null, percentage_12th: null,
      pcm_percentage: null, pcb_percentage: null,
      diploma_board: null, diploma_branch: null, diploma_percentage: null, diploma_year_of_passing: null,
      is_drop_year: false, num_attempts: 1,
      domains_of_interest: [], preferred_degree_type: null,
      preferred_branches: [], preferred_states: [], preferred_cities: null,
      only_government_colleges: false, private_allowed: true,
      deemed_universities_allowed: true, profile_complete: false,
    };

    return sendSuccess(res, {
      ...profile,
      // Student-level fields (read-only in profile)
      name:     student.name     ?? null,
      email:    student.email    ?? null,
      phone:    student.phone    ?? null,
      category: student.category ?? null,
    }, 'Profile fetched');
  } catch (err) {
    console.error('[getProfile Error]', err);
    return sendError(res, 'Failed to fetch profile', 500, err.message);
  }
};

// ── PATCH /api/v1/student/profile ────────────────────────────
export const updateProfile = async (req, res) => {
  const { userId, tenantId } = req.user;
  const body = req.body;

  try {
    // Validate controlled fields
    if (body.gender && !VALID_GENDERS.includes(body.gender)) {
      return sendError(res, `Invalid gender. Valid: ${VALID_GENDERS.join(', ')}`, 400);
    }
    if (body.category && !VALID_CATEGORIES.includes(body.category)) {
      return sendError(res, `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}`, 400);
    }
    if (body.qualification_type && !VALID_QUALIFICATION_TYPES.includes(body.qualification_type)) {
      return sendError(res, `Invalid qualification_type. Valid: ${VALID_QUALIFICATION_TYPES.join(', ')}`, 400);
    }
    if (body.stream_12th && !VALID_STREAMS.includes(body.stream_12th)) {
      return sendError(res, `Invalid stream_12th. Valid: ${VALID_STREAMS.join(', ')}`, 400);
    }
    if (body.annual_family_income && !VALID_INCOME.includes(body.annual_family_income)) {
      return sendError(res, `Invalid annual_family_income value`, 400);
    }
    if (body.college_fee_range && !VALID_FEE_RANGES.includes(body.college_fee_range)) {
      return sendError(res, `Invalid college_fee_range value`, 400);
    }
    if (body.parent_mobile && !/^\d{10}$/.test(body.parent_mobile)) {
      return sendError(res, 'parent_mobile must be exactly 10 digits', 400);
    }
    if (body.domains_of_interest) {
      const invalid = (body.domains_of_interest).filter((d) => !VALID_DOMAINS.includes(d));
      if (invalid.length) return sendError(res, `Invalid domain(s): ${invalid.join(', ')}`, 400);
    }

    // Build profile update payload
    const updates = {};
    const profileFields = [
      'dob', 'gender', 'city', 'state',
      'minority_status', 'annual_family_income', 'parent_mobile', 'college_fee_range',
      'preferred_location', 'preferred_branch', 'exam_type',
      'qualification_type',
      'board_12th', 'stream_12th', 'percentage_12th', 'pcm_percentage', 'pcb_percentage',
      'diploma_board', 'diploma_branch', 'diploma_percentage', 'diploma_year_of_passing',
      'is_drop_year', 'num_attempts',
      'domains_of_interest', 'preferred_degree_type', 'preferred_branches',
      'preferred_states', 'preferred_cities',
      'only_government_colleges', 'private_allowed', 'deemed_universities_allowed', 'autonomous_allowed',
    ];

    for (const field of profileFields) {
      if (body[field] !== undefined) {
        const val = body[field];
        // Trim strings, coerce nullish
        if (typeof val === 'string') {
          updates[field] = val.trim() || null;
        } else if (Array.isArray(val)) {
          updates[field] = val;
        } else {
          updates[field] = val ?? null;
        }
      }
    }

    // Recompute profile_complete by merging with current saved values
    const { data: current } = await supabase
      .from('student_profiles')
      .select(ALL_PROFILE_COLUMNS)
      .eq('student_id', userId)
      .maybeSingle();

    const merged = { ...(current ?? {}), ...updates };

    // Section 2 completion depends on qualification type
    const qualType = merged.qualification_type ?? '12th';
    const academicComplete = qualType === 'Diploma'
      ? !!(merged.diploma_board && merged.diploma_branch && merged.diploma_percentage)
      : !!(merged.board_12th && merged.stream_12th && merged.percentage_12th);

    // Section 5: College Preferences — check count in separate table
    const { count: collegePrefCount } = await supabase
      .from('student_college_preferences')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', userId)
      .eq('tenant_id', tenantId);

    updates.profile_complete = Boolean(
      merged.dob && merged.gender && merged.state &&  // Section 1: Basic Info
      academicComplete &&                             // Section 2: Academic Background
      merged.domains_of_interest?.length > 0 &&      // Section 4: Domain Prefs
      merged.preferred_degree_type &&                 // Section 5: Course Prefs
      (collegePrefCount ?? 0) > 0,                   // Section 6: College Preferences
    );

    // Upsert student_profiles
    const { data, error } = await supabase
      .from('student_profiles')
      .upsert({
        student_id: userId,
        tenant_id:  tenantId,
        ...updates,
      }, { onConflict: 'student_id' })
      .select(ALL_PROFILE_COLUMNS)
      .single();

    if (error) return sendError(res, 'Failed to update profile', 500, error.message);

    // Also update students table fields if provided (phone + category)
    const studentUpdates = {};
    if (body.phone    !== undefined) studentUpdates.phone    = body.phone?.trim() || null;
    if (body.category !== undefined) studentUpdates.category = body.category || null;
    if (Object.keys(studentUpdates).length > 0) {
      await supabase
        .from('students')
        .update(studentUpdates)
        .eq('id', userId)
        .eq('tenant_id', tenantId);
    }

    return sendSuccess(res, data, 'Profile updated');
  } catch (err) {
    console.error('[updateProfile Error]', err);
    return sendError(res, 'Failed to update profile', 500, err.message);
  }
};
