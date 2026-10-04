import { parse } from 'csv-parse/sync';
import supabase from '../../config/supabase.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';

const VALID_CATEGORIES  = ['OPEN', 'OBC', 'SC', 'ST', 'EWS'];
const VALID_EXAM_TYPES  = ['JEE_MAIN', 'JEE_ADVANCED', 'MHT_CET', 'NEET_UG', 'NEET_PG', 'OTHER'];

// ── GET /admin/cutoff ────────────────────────────────────────
export const listCutoff = async (req, res) => {
  const { tenantId } = req.user;
  const { page = 1, limit = 30, collegeId, year, round, category, examType } = req.query;

  try {
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * pageSize;

    let query = supabase
      .from('cutoff_data')
      .select(`
        id, year, round, category, exam_type, city, cutoff_percentile, cutoff_rank, cutoff_score, created_at,
        colleges:college_id(id, name, short_name),
        college_branches:branch_id(id, branch_name, branch_code)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('year', { ascending: false })
      .order('round')
      .range(offset, offset + pageSize - 1);

    if (collegeId) query = query.eq('college_id', collegeId);
    if (year)      query = query.eq('year', parseInt(year));
    if (round)     query = query.eq('round', parseInt(round));
    if (category)  query = query.eq('category', category);
    if (examType)  query = query.eq('exam_type', examType);

    const { data, count, error } = await query;
    if (error) return sendError(res, 'Failed to fetch cutoff data', 500, error.message);

    const meta = {
      page: pageNum,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      total: count ?? 0,
    };

    return sendSuccess(res, data ?? [], 'Cutoff data fetched', 200, meta);
  } catch (err) {
    console.error('[listCutoff Error]', err);
    return sendError(res, 'Failed to fetch cutoff data', 500, err.message);
  }
};

// ── POST /admin/cutoff (single entry) ────────────────────────
export const createCutoff = async (req, res) => {
  const { tenantId, userId } = req.user;
  const {
    collegeId, branchId, year, round, category, examType, city,
    cutoffPercentile, cutoffRank, cutoffScore,
  } = req.body;

  if (!collegeId || !branchId || !year || !round || !category || !examType) {
    return sendError(res, 'collegeId, branchId, year, round, category and examType are required', 400);
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return sendError(res, `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}`, 400);
  }
  if (!VALID_EXAM_TYPES.includes(examType)) {
    return sendError(res, `Invalid examType. Valid: ${VALID_EXAM_TYPES.join(', ')}`, 400);
  }
  if (!cutoffPercentile && !cutoffRank && !cutoffScore) {
    return sendError(res, 'At least one of cutoffPercentile, cutoffRank, or cutoffScore is required', 400);
  }

  try {
    // Verify college exists
    const { data: college } = await supabase
      .from('colleges').select('id').eq('id', collegeId).maybeSingle();
    if (!college) return sendError(res, 'College not found', 404);

    // Verify branch belongs to college
    const { data: branch } = await supabase
      .from('college_branches').select('id').eq('id', branchId).eq('college_id', collegeId).maybeSingle();
    if (!branch) return sendError(res, 'Branch not found for this college', 404);

    const { data, error } = await supabase
      .from('cutoff_data')
      .insert({
        tenant_id: tenantId,
        college_id: collegeId,
        branch_id: branchId,
        year: parseInt(year),
        round: parseInt(round),
        category,
        exam_type: examType,
        city: city?.trim() || null,
        cutoff_percentile: cutoffPercentile ? parseFloat(cutoffPercentile) : null,
        cutoff_rank: cutoffRank ? parseInt(cutoffRank) : null,
        cutoff_score: cutoffScore ? parseFloat(cutoffScore) : null,
        uploaded_by: userId,
      })
      .select(`
        id, year, round, category, exam_type, cutoff_percentile, cutoff_rank, cutoff_score,
        colleges:college_id(name), college_branches:branch_id(branch_name)
      `)
      .single();

    if (error) return sendError(res, 'Failed to create cutoff entry', 500, error.message);
    return sendCreated(res, data, 'Cutoff entry created');
  } catch (err) {
    console.error('[createCutoff Error]', err);
    return sendError(res, 'Failed to create cutoff entry', 500, err.message);
  }
};

// ── POST /admin/cutoff/bulk (CSV upload) ─────────────────────
export const bulkUploadCutoff = async (req, res) => {
  const { tenantId, userId } = req.user;

  if (!req.file) return sendError(res, 'CSV file is required', 400);

  // Pre-load all colleges and branches for fast lookup
  const [{ data: allColleges }, { data: allBranches }] = await Promise.all([
    supabase.from('colleges').select('id, name'),
    supabase.from('college_branches').select('id, college_id, branch_name'),
  ]);

  const collegeMap = Object.fromEntries(
    (allColleges ?? []).map((c) => [c.name.toLowerCase().trim(), c.id])
  );
  const branchMap = Object.fromEntries(
    (allBranches ?? []).map((b) => [
      `${b.college_id}::${b.branch_name.toLowerCase().trim()}`,
      b.id,
    ])
  );

  let records;
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,          // strip BOM if present (fixes Excel-saved files)
    });
  } catch {
    return sendError(res, 'Failed to parse CSV. Ensure it is a valid CSV file.', 400);
  }

  if (!records.length) return sendError(res, 'CSV file is empty', 400);

  const inserts = [];
  const errors  = [];

  records.forEach((row, i) => {
    const rowNum = i + 2; // +2: header row + 1-based
    const { college_name, branch_name, year, round, category, exam_type,
            city, percentile, rank, score } = row;

    if (!college_name || !branch_name || !year || !round || !category || !exam_type) {
      errors.push({ row: rowNum, message: 'Missing required column(s): college_name, branch_name, year, round, category, exam_type' });
      return;
    }
    if (!VALID_CATEGORIES.includes(category.trim())) {
      errors.push({ row: rowNum, message: `Invalid category "${category}". Valid: ${VALID_CATEGORIES.join(', ')}` });
      return;
    }
    if (!VALID_EXAM_TYPES.includes(exam_type.trim())) {
      errors.push({ row: rowNum, message: `Invalid exam_type "${exam_type}". Valid: ${VALID_EXAM_TYPES.join(', ')}` });
      return;
    }
    if (!percentile && !rank && !score) {
      errors.push({ row: rowNum, message: 'At least one of percentile, rank, or score must be provided' });
      return;
    }

    const collegeId = collegeMap[college_name.toLowerCase().trim()];
    if (!collegeId) {
      errors.push({ row: rowNum, message: `College "${college_name}" not found in database` });
      return;
    }
    const branchId = branchMap[`${collegeId}::${branch_name.toLowerCase().trim()}`];
    if (!branchId) {
      errors.push({ row: rowNum, message: `Branch "${branch_name}" not found for college "${college_name}"` });
      return;
    }

    inserts.push({
      tenant_id: tenantId,
      college_id: collegeId,
      branch_id: branchId,
      year: parseInt(year),
      round: parseInt(round),
      category: category.trim(),
      exam_type: exam_type.trim(),
      city: city?.trim() || null,
      cutoff_percentile: percentile ? parseFloat(percentile) : null,
      cutoff_rank: rank ? parseInt(rank) : null,
      cutoff_score: score ? parseFloat(score) : null,
      uploaded_by: userId,
    });
  });

  let inserted = 0;
  if (inserts.length) {
    const { error } = await supabase.from('cutoff_data').insert(inserts);
    if (error) return sendError(res, 'Failed to insert cutoff data', 500, error.message);
    inserted = inserts.length;
  }

  return sendSuccess(res, {
    total: records.length,
    inserted,
    skipped: errors.length,
    errors,
  }, `${inserted} of ${records.length} rows inserted`);
};

// ── GET /admin/cutoff/template (CSV template download) ───────
export const downloadTemplate = (_req, res) => {
  const header   = 'college_name,branch_name,year,round,category,exam_type,city,percentile,rank,score\n';
  const examples = [
    'Indian Institute of Technology Bombay,Computer Engineering,2024,1,OPEN,JEE_ADVANCED,Mumbai,99.5,,',
    'College of Engineering Pune,Mechanical Engineering,2024,1,OBC,MHT_CET,Pune,,5000,',
    'All India Institute of Medical Sciences Delhi,MBBS,2024,1,OPEN,NEET_UG,Delhi,,,700',
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="cutoff_upload_template.csv"');
  res.send(header + examples + '\n');
};

// ── DELETE /admin/cutoff/:id ─────────────────────────────────
export const deleteCutoff = async (req, res) => {
  const { tenantId } = req.user;
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('cutoff_data')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id')
      .maybeSingle();

    if (error) return sendError(res, 'Failed to delete entry', 500, error.message);
    if (!data)  return sendError(res, 'Cutoff entry not found', 404);
    return sendSuccess(res, null, 'Cutoff entry deleted');
  } catch (err) {
    console.error('[deleteCutoff Error]', err);
    return sendError(res, 'Failed to delete entry', 500, err.message);
  }
};
