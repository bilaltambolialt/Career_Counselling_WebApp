import supabase from '../../config/supabase.js';
import { sendError } from '../../utils/responseUtils.js';
import { generatePDF, buildCounselorDetailedHTML } from '../../utils/pdfGenerator.js';

// GET /api/v1/counselor/reports/:studentId
export const generateCounselorDetailedReport = async (req, res) => {
  const { userId, tenantId } = req.user;
  const { studentId } = req.params;

  try {
    // Verify counselor info
    const { data: counselor } = await supabase
      .from('counselors')
      .select('id, name, email')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!counselor) return sendError(res, 'Counselor not found', 404);

    // Verify student belongs to the same tenant (counselor can generate for any tenant student)
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email, phone, category')
      .eq('id', studentId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (studentError) return sendError(res, 'Failed to fetch student', 500, studentError.message);
    if (!student) return sendError(res, 'Student not found or not in your institution', 404);

    // Parallel fetch all student data
    const [profileRes, scoresRes, collegePrefRes, predictionsRes] =
      await Promise.allSettled([
        supabase
          .from('student_profiles')
          .select('*')
          .eq('student_id', studentId)
          .maybeSingle(),
        supabase
          .from('student_exam_scores')
          .select('exam_type, score, percentile, rank, attempt_year, attempt_number')
          .eq('student_id', studentId)
          .eq('tenant_id', tenantId)
          .order('attempt_year', { ascending: false }),
        supabase
          .from('student_college_preferences')
          .select('college_id, college_name, college_location, category')
          .eq('student_id', studentId)
          .eq('tenant_id', tenantId)
          .order('category'),
        supabase
          .from('predictions')
          .select(`
            id, college_id, classification, probability_percentage, score_diff_pct, avg_cutoff_used, trend_shift,
            colleges ( name, location, state ),
            college_branches ( branch_name ),
            student_exam_scores ( exam_type )
          `)
          .eq('student_id', studentId)
          .eq('tenant_id', tenantId)
          .order('probability_percentage', { ascending: false }),
      ]);

    const profile     = profileRes.status     === 'fulfilled' ? profileRes.value.data     : null;
    const scores      = scoresRes.status      === 'fulfilled' ? (scoresRes.value.data      ?? []) : [];
    const collegePref = collegePrefRes.status === 'fulfilled' ? (collegePrefRes.value.data ?? []) : [];
    const predictions = predictionsRes.status === 'fulfilled' ? (predictionsRes.value.data ?? []) : [];

    const html = buildCounselorDetailedHTML({ student, profile, scores, collegePref, predictions, counselor });
    const pdfBuffer = await generatePDF(html);

    const safeName = (student.name ?? 'student').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr  = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="counselor-report-${safeName}-${dateStr}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[generateCounselorDetailedReport Error]', err);
    return sendError(res, 'Failed to generate counselor report', 500, err.message);
  }
};
