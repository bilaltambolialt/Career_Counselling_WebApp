import supabase from '../../config/supabase.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';

const VALID_EXAM_TYPES = ['JEE_MAIN', 'JEE_ADVANCED', 'MHT_CET', 'NEET_UG', 'NEET_PG', 'OTHER'];

const SCORE_COLS = 'id, exam_type, score, percentile, rank, attempt_year, attempt_number, created_at';

// GET /api/v1/student/scores
export const listScores = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    const { data, error } = await supabase
      .from('student_exam_scores')
      .select(SCORE_COLS)
      .eq('student_id', userId)
      .eq('tenant_id', tenantId)
      .order('attempt_year', { ascending: false })
      .order('attempt_number', { ascending: false });

    if (error) return sendError(res, 'Failed to fetch scores', 500, error.message);
    return sendSuccess(res, data ?? [], 'Scores fetched');
  } catch (err) {
    console.error('[listScores Error]', err);
    return sendError(res, 'Failed to fetch scores', 500, err.message);
  }
};

// POST /api/v1/student/scores
export const addScore = async (req, res) => {
  const { userId, tenantId } = req.user;
  const { exam_type, score, percentile, rank, attempt_year, attempt_number } = req.body;

  if (!exam_type || !attempt_year) {
    return sendError(res, 'exam_type and attempt_year are required', 400);
  }
  if (!VALID_EXAM_TYPES.includes(exam_type)) {
    return sendError(res, `Invalid exam_type. Valid: ${VALID_EXAM_TYPES.join(', ')}`, 400);
  }
  if (!score && !percentile && !rank) {
    return sendError(res, 'At least one of score, percentile, or rank is required', 400);
  }

  try {
    const { data, error } = await supabase
      .from('student_exam_scores')
      .insert({
        student_id:      userId,
        tenant_id:       tenantId,
        exam_type,
        score:           score      ? parseFloat(score)      : null,
        percentile:      percentile ? parseFloat(percentile) : null,
        rank:            rank       ? parseInt(rank)         : null,
        attempt_year:    parseInt(attempt_year),
        attempt_number:  attempt_number ? parseInt(attempt_number) : 1,
      })
      .select(SCORE_COLS)
      .single();

    if (error) return sendError(res, 'Failed to add score', 500, error.message);
    return sendCreated(res, data, 'Score added');
  } catch (err) {
    console.error('[addScore Error]', err);
    return sendError(res, 'Failed to add score', 500, err.message);
  }
};

// PATCH /api/v1/student/scores/:id
export const updateScore = async (req, res) => {
  const { userId, tenantId } = req.user;
  const { id } = req.params;
  const { score, percentile, rank, attempt_year, attempt_number } = req.body;

  try {
    const { data: existing } = await supabase
      .from('student_exam_scores')
      .select('id')
      .eq('id', id)
      .eq('student_id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!existing) return sendError(res, 'Score not found', 404);

    const updates = {};
    if (score          !== undefined) updates.score          = score      ? parseFloat(score)      : null;
    if (percentile     !== undefined) updates.percentile     = percentile ? parseFloat(percentile) : null;
    if (rank           !== undefined) updates.rank           = rank       ? parseInt(rank)         : null;
    if (attempt_year   !== undefined) updates.attempt_year   = parseInt(attempt_year);
    if (attempt_number !== undefined) updates.attempt_number = parseInt(attempt_number);

    const { data, error } = await supabase
      .from('student_exam_scores')
      .update(updates)
      .eq('id', id)
      .eq('student_id', userId)
      .select(SCORE_COLS)
      .single();

    if (error) return sendError(res, 'Failed to update score', 500, error.message);
    return sendSuccess(res, data, 'Score updated');
  } catch (err) {
    console.error('[updateScore Error]', err);
    return sendError(res, 'Failed to update score', 500, err.message);
  }
};

// DELETE /api/v1/student/scores/:id
export const deleteScore = async (req, res) => {
  const { userId, tenantId } = req.user;
  const { id } = req.params;

  try {
    // Delete predictions referencing this score first.
    // The schema FK (predictions.exam_score_id) has no ON DELETE CASCADE,
    // so we must remove dependent rows manually before deleting the score.
    await supabase
      .from('predictions')
      .delete()
      .eq('exam_score_id', id)
      .eq('student_id', userId)
      .eq('tenant_id', tenantId);

    const { data, error } = await supabase
      .from('student_exam_scores')
      .delete()
      .eq('id', id)
      .eq('student_id', userId)
      .eq('tenant_id', tenantId)
      .select('id')
      .maybeSingle();

    if (error) return sendError(res, 'Failed to delete score', 500, error.message);
    if (!data)  return sendError(res, 'Score not found', 404);
    return sendSuccess(res, null, 'Score deleted');
  } catch (err) {
    console.error('[deleteScore Error]', err);
    return sendError(res, 'Failed to delete score', 500, err.message);
  }
};
