import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';
import { createNotification } from '../../utils/notificationUtils.js';

// ──────────────────────────────────────────────────────────────────────────────
// Percentile / rank gap → probability mapping (continuous, boundary-smooth)
//   gap  = student_value - avg_cutoff  (for percentile, higher = better)
//           avg_cutoff  - student_rank  (for rank, lower rank # = better)
//   Backup  (gap >= 10)  : prob = min(97, 75 + gap)
//   Safe    (0 ≤ gap<10) : prob = 50 + gap * 2.5
//   Dream   (-15≤gap<0)  : prob = max(10, 50 + gap * 2.5)
// ──────────────────────────────────────────────────────────────────────────────
function classifyAndScore(gap) {
  if (gap >= 10) {
    return {
      classification: 'Backup',
      riskLevel: 'Low',
      probability: Math.min(97, 75 + gap),
    };
  }
  if (gap >= 0) {
    return {
      classification: 'Safe',
      riskLevel: 'Medium',
      probability: 50 + gap * 2.5,
    };
  }
  if (gap >= -15) {
    return {
      classification: 'Dream',
      riskLevel: 'High',
      probability: Math.max(10, 50 + gap * 2.5),
    };
  }
  return null; // too far below cutoff — skip
}

function buildStrategy(classification, gap, trendShift) {
  const needed = Math.abs(Math.ceil(gap));
  if (classification === 'Dream') {
    return trendShift > 0
      ? `Cutoff is rising. You need to improve by ~${needed} percentile points to be competitive.`
      : `You need ~${needed} more percentile points. Focus on strong exam preparation for this stretch target.`;
  }
  if (classification === 'Safe') {
    return trendShift > 0
      ? 'Cutoff is trending upward. Maintain your score and apply in earlier rounds to stay safe.'
      : 'You are above the historical cutoff. Apply early for the best chance.';
  }
  // Backup
  return 'You comfortably exceed this cutoff. This is a reliable safety option in your list.';
}

// ── GET /api/v1/student/predictions ──────────────────────────────────────────
export const listPredictions = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    // Gate: counselor must enable predictions for this student
    const { data: gate, error: gateErr } = await supabase
      .from('students')
      .select('predictions_enabled')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (gateErr) throw gateErr;
    if (!gate?.predictions_enabled) {
      return sendError(res, 'Recommendations are not yet enabled for your account. Contact your counselor.', 403);
    }

    const { data, error } = await supabase
      .from('predictions')
      .select(`
        id, classification, risk_level, probability_percentage, confidence_score,
        score_diff_pct, avg_cutoff_used, trend_shift, strategy_suggestion,
        algorithm_version, created_at,
        colleges ( name, location, state, college_type ),
        college_branches ( branch_name, branch_code ),
        student_exam_scores ( exam_type, percentile, rank, score, attempt_year )
      `)
      .eq('student_id', userId)
      .eq('tenant_id', tenantId)
      .order('probability_percentage', { ascending: false });

    if (error) return sendError(res, 'Failed to fetch predictions', 500, error.message);
    return sendSuccess(res, data ?? [], 'Predictions fetched');
  } catch (err) {
    console.error('[listPredictions Error]', err);
    return sendError(res, 'Failed to fetch predictions', 500, err.message);
  }
};

// ── POST /api/v1/student/predictions/generate ────────────────────────────────
export const generatePredictions = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    // 1. Student record — need category + predictions gate
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('id, category, predictions_enabled')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (studentErr || !student) return sendError(res, 'Student record not found', 404);
    if (!student.predictions_enabled) {
      return sendError(res, 'Recommendations are not yet enabled for your account. Contact your counselor.', 403);
    }

    // 2. All exam scores — pick best per exam_type
    //    "Best" = highest percentile; if no percentile, lowest rank
    const { data: allScores, error: scoresErr } = await supabase
      .from('student_exam_scores')
      .select('id, exam_type, score, percentile, rank, attempt_year')
      .eq('student_id', userId)
      .eq('tenant_id', tenantId);

    if (scoresErr) return sendError(res, 'Failed to fetch exam scores', 500, scoresErr.message);
    if (!allScores?.length) {
      return sendError(
        res,
        'No exam scores found. Add at least one exam score with percentile or rank before generating recommendations.',
        400,
      );
    }

    // Build: bestPerExam[exam_type] = best score object for that exam
    const bestPerExam = {};
    for (const s of allScores) {
      const et       = s.exam_type;
      const existing = bestPerExam[et];
      if (!existing) { bestPerExam[et] = s; continue; }
      // Prefer percentile; fall back to rank comparison
      const sHasPct  = s.percentile != null;
      const exHasPct = existing.percentile != null;
      if (sHasPct && (!exHasPct || parseFloat(s.percentile) > parseFloat(existing.percentile))) {
        bestPerExam[et] = s;
      } else if (!sHasPct && !exHasPct && s.rank != null) {
        if (existing.rank == null || parseInt(s.rank) < parseInt(existing.rank)) {
          bestPerExam[et] = s;
        }
      }
    }

    const examTypes = Object.keys(bestPerExam);

    // 3. Cutoff data — filtered to only exam types the student has scored in
    const studentCategory = student.category ?? 'OPEN';

    const { data: cutoffs, error: cutoffErr } = await supabase
      .from('cutoff_data')
      .select(`
        college_id, branch_id, year, round, exam_type,
        cutoff_percentile, cutoff_rank,
        colleges ( name, location, state, college_type ),
        college_branches ( branch_name, branch_code )
      `)
      .eq('category', studentCategory)
      .in('exam_type', examTypes)          // ← only fetch matching exam streams
      .order('year', { ascending: false });

    if (cutoffErr) return sendError(res, 'Failed to fetch cutoff data', 500, cutoffErr.message);
    if (!cutoffs?.length) {
      return sendError(
        res,
        `No cutoff data available for your exam type(s) (${examTypes.join(', ')}) and category (${studentCategory}). Contact support to ensure cutoff data has been uploaded.`,
        400,
      );
    }

    // 4. Group by college + branch + exam_type
    //    (A college may appear in both JEE and MHT-CET cutoffs)
    const groups = {};
    for (const row of cutoffs) {
      const key = `${row.college_id}::${row.branch_id}::${row.exam_type}`;
      if (!groups[key]) {
        groups[key] = {
          college_id: row.college_id,
          branch_id:  row.branch_id,
          exam_type:  row.exam_type,
          college:    row.colleges,
          branch:     row.college_branches,
          rows:       [],
        };
      }
      groups[key].rows.push(row);
    }

    // 5. Compute prediction for each group
    const currentYear = new Date().getFullYear();
    const computed    = [];

    for (const group of Object.values(groups)) {
      // Only consider last 2 available years of data
      const recentRows = group.rows.filter((r) => r.year >= currentYear - 2);
      if (!recentRows.length) continue;

      // Use the best score for this group's exam_type
      const bestScore = bestPerExam[group.exam_type];
      if (!bestScore) continue;

      // Decide comparison mode
      const withPct  = recentRows.filter((r) => r.cutoff_percentile != null);
      const withRank = recentRows.filter((r) => r.cutoff_rank != null);

      let avgCutoff = null;
      let mode      = null;

      if (withPct.length && bestScore.percentile != null) {
        avgCutoff = withPct.reduce((s, r) => s + parseFloat(r.cutoff_percentile), 0) / withPct.length;
        mode = 'percentile';
      } else if (withRank.length && bestScore.rank != null) {
        avgCutoff = withRank.reduce((s, r) => s + parseInt(r.cutoff_rank), 0) / withRank.length;
        mode = 'rank';
      }

      if (!avgCutoff || !mode) continue;

      // Gap: positive = student is better than avg cutoff
      const studentValue = mode === 'percentile'
        ? parseFloat(bestScore.percentile)
        : parseInt(bestScore.rank);

      const gap = mode === 'percentile'
        ? studentValue - avgCutoff        // percentile: higher is better
        : avgCutoff - studentValue;       // rank: lower number is better

      const result = classifyAndScore(gap);
      if (!result) continue; // too far below cutoff

      // Trend shift (percentile mode only)
      let trendShift = null;
      if (mode === 'percentile') {
        const latestYear    = Math.max(...recentRows.map((r) => r.year));
        const latestAvgArr  = recentRows.filter((r) => r.year === latestYear  && r.cutoff_percentile != null);
        const prevAvgArr    = recentRows.filter((r) => r.year <  latestYear   && r.cutoff_percentile != null);
        if (latestAvgArr.length && prevAvgArr.length) {
          const latestAvg = latestAvgArr.reduce((s, r) => s + parseFloat(r.cutoff_percentile), 0) / latestAvgArr.length;
          const prevAvg   = prevAvgArr.reduce((s, r)   => s + parseFloat(r.cutoff_percentile), 0) / prevAvgArr.length;
          trendShift = parseFloat((latestAvg - prevAvg).toFixed(2));
        }
      }

      // Confidence: more data points = more confident
      const dataPoints = recentRows.length;
      const confidence = Math.min(0.95, 0.45 + dataPoints * 0.1);

      computed.push({
        college_id:      group.college_id,
        branch_id:       group.branch_id,
        exam_type:       group.exam_type,
        college:         group.college,
        branch:          group.branch,
        probability:     parseFloat(result.probability.toFixed(2)),
        confidence:      parseFloat(confidence.toFixed(3)),
        classification:  result.classification,
        risk_level:      result.riskLevel,
        score_diff_pct:  parseFloat(gap.toFixed(2)),
        avg_cutoff_used: parseFloat(avgCutoff.toFixed(2)),
        trend_shift:     trendShift,
        strategy:        buildStrategy(result.classification, gap, trendShift),
        exam_score_id:   bestScore.id,
        comparison_mode: mode,
      });
    }

    if (!computed.length) {
      return sendError(
        res,
        'No recommendations could be generated. Your scores may not match any available cutoff data for your category.',
        400,
      );
    }

    // Sort by probability descending
    computed.sort((a, b) => b.probability - a.probability);

    // 6. Replace previous predictions
    await supabase
      .from('predictions')
      .delete()
      .eq('student_id', userId)
      .eq('tenant_id', tenantId);

    const { error: insertErr } = await supabase
      .from('predictions')
      .insert(
        computed.map((p) => ({
          student_id:             userId,
          tenant_id:              tenantId,
          college_id:             p.college_id,
          branch_id:              p.branch_id,
          exam_score_id:          p.exam_score_id,
          probability_percentage: p.probability,
          confidence_score:       p.confidence,
          classification:         p.classification,
          risk_level:             p.risk_level,
          score_diff_pct:         p.score_diff_pct,
          avg_cutoff_used:        p.avg_cutoff_used,
          trend_shift:            p.trend_shift,
          strategy_suggestion:    p.strategy,
          algorithm_version:      'v1.1',
        })),
      );

    if (insertErr) return sendError(res, 'Failed to save recommendations', 500, insertErr.message);

    // 7. Return shaped response
    return sendSuccess(
      res,
      computed.map((p) => ({
        college:         { name: p.college?.name, location: p.college?.location, state: p.college?.state, type: p.college?.college_type },
        branch:          { name: p.branch?.branch_name, code: p.branch?.branch_code },
        exam_type:       p.exam_type,
        probability:     p.probability,
        confidence:      p.confidence,
        classification:  p.classification,
        risk_level:      p.risk_level,
        score_diff_pct:  p.score_diff_pct,
        avg_cutoff_used: p.avg_cutoff_used,
        trend_shift:     p.trend_shift,
        strategy:        p.strategy,
        comparison_mode: p.comparison_mode,
      })),
      `${computed.length} college recommendations generated`,
    );

    // Fire-and-forget: notify student that recommendations are ready
    createNotification({
      tenantId,
      recipientId:   userId,
      recipientRole: 'student',
      type:          'predictions_ready',
      title:         'Your recommendations are ready!',
      message:       `${computed.length} college recommendation${computed.length !== 1 ? 's' : ''} have been generated based on your exam scores and cutoff data. View them on the Recommendations page.`,
      link:          '/student/predictions',
    });
  } catch (err) {
    console.error('[generatePredictions Error]', err);
    return sendError(res, 'Failed to generate recommendations', 500, err.message);
  }
};

// ── DELETE /api/v1/student/predictions ───────────────────────────────────────
export const clearPredictions = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    const { error } = await supabase
      .from('predictions')
      .delete()
      .eq('student_id', userId)
      .eq('tenant_id', tenantId);

    if (error) return sendError(res, 'Failed to clear recommendations', 500, error.message);
    return sendSuccess(res, null, 'Recommendations cleared');
  } catch (err) {
    console.error('[clearPredictions Error]', err);
    return sendError(res, 'Failed to clear recommendations', 500, err.message);
  }
};
