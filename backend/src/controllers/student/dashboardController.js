import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

// GET /api/v1/student/dashboard
export const getStudentDashboard = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    // Fetch student base info + assigned counselor
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id, name, email, phone, category, assigned_counselor_id,
        counselors:assigned_counselor_id(id, name, email, phone)
      `)
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (studentError) return sendError(res, 'Failed to fetch student info', 500, studentError.message);
    if (!student) return sendError(res, 'Student not found', 404);

    // Parallel fetch: profile, scores, doc types, prediction count, college pref count
    const [profileResult, scoresResult, docCountResult, predCountResult, collegePrefResult] =
      await Promise.allSettled([
        supabase
          .from('student_profiles')
          .select('dob, gender, state, qualification_type, board_12th, stream_12th, percentage_12th, diploma_board, diploma_branch, diploma_percentage, domains_of_interest, preferred_degree_type, preferred_states, profile_complete')
          .eq('student_id', userId)
          .maybeSingle(),
        supabase
          .from('student_exam_scores')
          .select('id, exam_type, score, percentile, rank, attempt_year, attempt_number')
          .eq('student_id', userId)
          .eq('tenant_id', tenantId)
          .order('attempt_year', { ascending: false })
          .order('attempt_number', { ascending: false }),
        supabase
          .from('student_documents')
          .select('doc_type')
          .eq('student_id', userId)
          .eq('tenant_id', tenantId),
        supabase
          .from('predictions')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', userId)
          .eq('tenant_id', tenantId),
        supabase
          .from('student_college_preferences')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', userId)
          .eq('tenant_id', tenantId),
      ]);

    const profile           = profileResult.status      === 'fulfilled' ? profileResult.value.data    : null;
    const scores            = scoresResult.status        === 'fulfilled' ? (scoresResult.value.data    ?? []) : [];
    const docTypes          = docCountResult.status      === 'fulfilled' ? (docCountResult.value.data?.map((d) => d.doc_type) ?? []) : [];
    const predictionCount   = predCountResult.status     === 'fulfilled' ? (predCountResult.value.count ?? 0) : 0;
    const collegePrefCount  = collegePrefResult.status   === 'fulfilled' ? (collegePrefResult.value.count ?? 0) : 0;

    // Compute section-based completion — mirrors ProfilePage.jsx (8 sections)
    const isDiploma = profile?.qualification_type === 'Diploma';
    const academicComplete = isDiploma
      ? !!(profile?.diploma_board && profile?.diploma_branch && profile?.diploma_percentage)
      : !!(profile?.board_12th && profile?.stream_12th && profile?.percentage_12th);

    // S7: mandatory docs — Aadhaar + 10th + (12th or Diploma marksheet)
    const mandatoryDocsComplete = (
      docTypes.includes('aadhaar') &&
      docTypes.includes('10th_marksheet') &&
      (isDiploma ? docTypes.includes('diploma_marksheet') : docTypes.includes('12th_marksheet'))
    );

    const sectionComplete = [
      !!(profile?.gender && profile?.dob && profile?.state),  // S0: Basic Info
      academicComplete,                                        // S1: Academic Background
      scores.length > 0,                                       // S2: Entrance Exams
      (profile?.domains_of_interest?.length ?? 0) > 0,        // S3: Domain Prefs
      !!profile?.preferred_degree_type,                        // S4: Course Prefs
      collegePrefCount > 0,                                    // S5: College Preferences
      (profile?.preferred_states?.length ?? 0) > 0,           // S6: Location
      mandatoryDocsComplete,                                   // S7: Documents
    ];
    const profilePct = Math.round((sectionComplete.filter(Boolean).length / 8) * 100);

    return sendSuccess(res, {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        category: student.category,
      },
      counselor: student.counselors ?? null,
      profile: profile ?? null,
      profileCompleteness: profilePct,
      scores,
      scoreCount: scores.length,
      predictionCount,
    });
  } catch (err) {
    console.error('[getStudentDashboard Error]', err);
    return sendError(res, 'Failed to load dashboard', 500, err.message);
  }
};
