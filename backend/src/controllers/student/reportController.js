import supabase from '../../config/supabase.js';
import { sendError } from '../../utils/responseUtils.js';
import { generatePDF, buildStudentSummaryHTML } from '../../utils/pdfGenerator.js';

// GET /api/v1/student/reports/summary
export const generateStudentSummaryReport = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    // Parallel fetch all data needed for the report
    const [studentRes, profileRes, scoresRes, collegePrefRes, predictionsRes] =
      await Promise.allSettled([
        supabase
          .from('students')
          .select('id, name, email, phone, category')
          .eq('id', userId)
          .eq('tenant_id', tenantId)
          .maybeSingle(),
        supabase
          .from('student_profiles')
          .select('*')
          .eq('student_id', userId)
          .maybeSingle(),
        supabase
          .from('student_exam_scores')
          .select('exam_type, score, percentile, rank, attempt_year, attempt_number')
          .eq('student_id', userId)
          .eq('tenant_id', tenantId)
          .order('attempt_year', { ascending: false }),
        supabase
          .from('student_college_preferences')
          .select('college_id, college_name, college_location, category')
          .eq('student_id', userId)
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
          .eq('student_id', userId)
          .eq('tenant_id', tenantId)
          .order('probability_percentage', { ascending: false }),
      ]);

    const student     = studentRes.status     === 'fulfilled' ? studentRes.value.data     : null;
    const profile     = profileRes.status     === 'fulfilled' ? profileRes.value.data     : null;
    const scores      = scoresRes.status      === 'fulfilled' ? (scoresRes.value.data      ?? []) : [];
    const collegePref = collegePrefRes.status === 'fulfilled' ? (collegePrefRes.value.data ?? []) : [];
    const predictions = predictionsRes.status === 'fulfilled' ? (predictionsRes.value.data ?? []) : [];

    if (!student) return sendError(res, 'Student not found', 404);

    const html = buildStudentSummaryHTML({ student, profile, scores, collegePref, predictions });
    const pdfBuffer = await generatePDF(html);

    const safeName = (student.name ?? 'student').replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr  = new Date().toISOString().slice(0, 10);

    // Use res.send() so Express handles Content-Length and binary serialisation correctly
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="admission-summary-${safeName}-${dateStr}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[generateStudentSummaryReport Error]', err);
    return sendError(res, 'Failed to generate report', 500, err.message);
  }
};
