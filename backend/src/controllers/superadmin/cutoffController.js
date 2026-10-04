import { parse } from 'csv-parse/sync';
import supabase from '../../config/supabase.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';

const VALID_CATEGORIES = ['OPEN', 'OBC', 'SC', 'ST', 'EWS', 'VJ', 'NT', 'SEBC'];
const VALID_EXAM_TYPES = ['JEE_MAIN', 'JEE_ADVANCED', 'MHT_CET', 'NEET_UG', 'NEET_PG', 'OTHER'];

// GET /api/v1/superadmin/cutoff — list all cutoffs (no tenant filter; optional adminId filter)
export const listCutoff = async (req, res) => {
  const { page = 1, limit = 30, adminId, year, round, category, examType } = req.query;

  try {
    const pageNum  = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * pageSize;

    let query = supabase
      .from('cutoff_data')
      .select(`
        id, year, round, category, exam_type, city, cutoff_percentile, cutoff_rank, cutoff_score, created_at, tenant_id,
        colleges:college_id(id, name, short_name),
        college_branches:branch_id(id, branch_name, branch_code)
      `, { count: 'exact' })
      .order('year', { ascending: false })
      .order('round')
      .range(offset, offset + pageSize - 1);

    if (adminId)   query = query.eq('tenant_id', adminId);
    if (year)      query = query.eq('year', parseInt(year));
    if (round)     query = query.eq('round', parseInt(round));
    if (category)  query = query.eq('category', category);
    if (examType)  query = query.eq('exam_type', examType);

    const { data, count, error } = await query;
    if (error) return sendError(res, 'Failed to fetch cutoff data', 500, error.message);

    return sendSuccess(res, data ?? [], 'Cutoff data fetched', 200, {
      page: pageNum,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      total: count ?? 0,
    });
  } catch (err) {
    console.error('[superadmin listCutoff Error]', err);
    return sendError(res, 'Failed to fetch cutoff data', 500, err.message);
  }
};

const VALID_COLLEGE_TYPES = ['Government', 'Private', 'Aided', 'Autonomous'];

// All columns covered by idx_cutoff_data_no_duplicates (migration v1.26.0)
const CUTOFF_CONFLICT_COLS = 'college_id,branch_id,year,round,category,exam_type,city,cutoff_percentile,cutoff_rank,cutoff_score,dte_code,course_code';

// POST /api/v1/superadmin/cutoff — single entry (platform-wide, no tenant)
export const createCutoff = async (req, res) => {
  const {
    collegeId, branchId,
    newCollegeName, collegeType,  // used when creating a new college
    newBranchName,                // used when creating a new branch
    year, round, category, examType, city,
    cutoffPercentile, cutoffRank, cutoffScore,
  } = req.body;

  const usingNewCollege = !collegeId && newCollegeName;
  const usingNewBranch  = !branchId && newBranchName;

  if (!collegeId && !newCollegeName) {
    return sendError(res, 'Either collegeId (existing) or newCollegeName (new) is required', 400);
  }
  if (!branchId && !newBranchName) {
    return sendError(res, 'Either branchId (existing) or newBranchName (new) is required', 400);
  }
  if (!year || !round || !category || !examType) {
    return sendError(res, 'year, round, category and examType are required', 400);
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
    // Resolve college — use existing or create new
    let finalCollegeId = collegeId;
    if (usingNewCollege) {
      const type = VALID_COLLEGE_TYPES.includes(collegeType) ? collegeType : 'Private';
      const { data: newCollege, error: cErr } = await supabase
        .from('colleges')
        .insert({ name: newCollegeName.trim(), college_type: type })
        .select('id')
        .single();
      if (cErr) return sendError(res, 'Failed to create college', 500, cErr.message);
      finalCollegeId = newCollege.id;
    } else {
      const { data: college } = await supabase
        .from('colleges').select('id').eq('id', collegeId).maybeSingle();
      if (!college) return sendError(res, 'College not found', 404);
    }

    // Resolve branch — use existing or create new
    let finalBranchId = branchId;
    if (usingNewBranch) {
      const { data: newBranch, error: bErr } = await supabase
        .from('college_branches')
        .insert({ college_id: finalCollegeId, branch_name: newBranchName.trim() })
        .select('id')
        .single();
      if (bErr) return sendError(res, 'Failed to create branch', 500, bErr.message);
      finalBranchId = newBranch.id;
    } else {
      const { data: branch } = await supabase
        .from('college_branches').select('id').eq('id', branchId).eq('college_id', finalCollegeId).maybeSingle();
      if (!branch) return sendError(res, 'Branch not found for this college', 404);
    }

    const row = {
      college_id: finalCollegeId,
      branch_id:  finalBranchId,
      year:       parseInt(year),
      round:      parseInt(round),
      category,
      exam_type:  examType,
      city:       city?.trim() || null,
      cutoff_percentile: cutoffPercentile ? parseFloat(cutoffPercentile) : null,
      cutoff_rank:       cutoffRank       ? parseInt(cutoffRank)         : null,
      cutoff_score:      cutoffScore      ? parseFloat(cutoffScore)      : null,
      // dte_code / course_code not exposed in manual form — remain null
    };

    // Upsert with ignoreDuplicates — DB unique index (v1.26.0) handles the check.
    // If an identical row already exists, nothing is inserted and data comes back null.
    const { data, error } = await supabase
      .from('cutoff_data')
      .upsert(row, { onConflict: CUTOFF_CONFLICT_COLS, ignoreDuplicates: true })
      .select(`
        id, year, round, category, exam_type, cutoff_percentile, cutoff_rank, cutoff_score,
        colleges:college_id(name), college_branches:branch_id(branch_name)
      `)
      .maybeSingle();

    if (error) return sendError(res, 'Failed to create cutoff entry', 500, error.message);
    if (!data)  return sendError(res, 'An identical cutoff entry already exists. No changes made.', 409);
    return sendCreated(res, data, 'Cutoff entry created');
  } catch (err) {
    console.error('[superadmin createCutoff Error]', err);
    return sendError(res, 'Failed to create cutoff entry', 500, err.message);
  }
};

// POST /api/v1/superadmin/cutoff/bulk — CSV upload (platform-wide, no tenant)
// Auto-creates colleges and branches that don't exist in the DB.
export const bulkUploadCutoff = async (req, res) => {

  if (!req.file) return sendError(res, 'CSV file is required', 400);

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
      bom: true,
    });
  } catch {
    return sendError(res, 'Failed to parse CSV. Ensure it is a valid CSV file.', 400);
  }

  if (!records.length) return sendError(res, 'CSV file is empty', 400);

  // --- Pass 1: validate field-level constraints; collect valid rows ---
  const errors   = [];
  const validRows = [];

  records.forEach((row, i) => {
    const rowNum = i + 2;
    const { college_name, branch_name, year, round, category, exam_type,
            city, percentile, rank, score, dte_code, course_code } = row;

    if (!college_name || !branch_name || !year || !round || !category || !exam_type) {
      errors.push({ row: rowNum, message: 'Missing required column(s)' });
      return;
    }
    if (!VALID_CATEGORIES.includes(category.trim())) {
      errors.push({ row: rowNum, message: `Invalid category "${category}"` });
      return;
    }
    if (!VALID_EXAM_TYPES.includes(exam_type.trim())) {
      errors.push({ row: rowNum, message: `Invalid exam_type "${exam_type}"` });
      return;
    }
    if (!percentile && !rank && !score) {
      errors.push({ row: rowNum, message: 'At least one of percentile, rank, or score required' });
      return;
    }

    validRows.push({
      rowNum,
      college_name: college_name.trim(),
      branch_name:  branch_name.trim(),
      year, round,
      category:   category.trim(),
      exam_type:  exam_type.trim(),
      city:       city?.trim()        || null,
      percentile, rank, score,
      dte_code:    dte_code?.trim()   || null,
      course_code: course_code?.trim() || null,
    });
  });

  // --- Pass 2: auto-create any colleges not in the DB ---
  const newCollegeNames = [...new Set(
    validRows
      .filter(r => !collegeMap[r.college_name.toLowerCase()])
      .map(r => r.college_name)
  )];

  if (newCollegeNames.length > 0) {
    const { data: created, error: cErr } = await supabase
      .from('colleges')
      .insert(newCollegeNames.map(name => ({ name, college_type: 'Private' })))
      .select('id, name');
    if (cErr) return sendError(res, 'Failed to auto-create colleges', 500, cErr.message);
    (created ?? []).forEach(c => { collegeMap[c.name.toLowerCase().trim()] = c.id; });
  }

  // --- Pass 3: auto-create any branches not in the DB ---
  const newBranchKeys    = new Set();
  const newBranchInserts = [];

  validRows.forEach(r => {
    const collegeId = collegeMap[r.college_name.toLowerCase()];
    if (!collegeId) return;
    const key = `${collegeId}::${r.branch_name.toLowerCase()}`;
    if (!branchMap[key] && !newBranchKeys.has(key)) {
      newBranchKeys.add(key);
      newBranchInserts.push({ college_id: collegeId, branch_name: r.branch_name });
    }
  });

  if (newBranchInserts.length > 0) {
    const { data: created, error: bErr } = await supabase
      .from('college_branches')
      .insert(newBranchInserts)
      .select('id, college_id, branch_name');
    if (bErr) return sendError(res, 'Failed to auto-create branches', 500, bErr.message);
    (created ?? []).forEach(b => {
      branchMap[`${b.college_id}::${b.branch_name.toLowerCase().trim()}`] = b.id;
    });
  }

  // --- Pass 4: build cutoff inserts with fully-resolved IDs ---
  const inserts = [];
  validRows.forEach(r => {
    const collegeId = collegeMap[r.college_name.toLowerCase()];
    const branchId  = branchMap[`${collegeId}::${r.branch_name.toLowerCase()}`];
    if (!collegeId || !branchId) return; // shouldn't happen after auto-create

    inserts.push({
      college_id: collegeId,
      branch_id:  branchId,
      year:  parseInt(r.year),
      round: parseInt(r.round),
      category:   r.category,
      exam_type:  r.exam_type,
      city:       r.city,
      cutoff_percentile: r.percentile ? parseFloat(r.percentile) : null,
      cutoff_rank:       r.rank       ? parseInt(r.rank)         : null,
      cutoff_score:      r.score      ? parseFloat(r.score)      : null,
      dte_code:    r.dte_code,
      course_code: r.course_code,
      // uploaded_by omitted — super admin UUID is not in admins table (FK would fail)
    });
  });

  // --- Pass 5: upsert — DB unique index (v1.26.0) skips exact duplicates automatically ---
  let inserted = 0;
  let duplicateCount = 0;
  if (inserts.length > 0) {
    const { data: upserted, error } = await supabase
      .from('cutoff_data')
      .upsert(inserts, { onConflict: CUTOFF_CONFLICT_COLS, ignoreDuplicates: true })
      .select('id');
    if (error) return sendError(res, 'Failed to insert cutoff data', 500, error.message);
    inserted      = upserted?.length ?? 0;
    duplicateCount = inserts.length - inserted;
  }

  return sendSuccess(res, {
    total: records.length,
    inserted,
    duplicates: duplicateCount,
    skipped: errors.length,
    errors,
    autoCreated: { colleges: newCollegeNames.length, branches: newBranchInserts.length },
  }, `${inserted} of ${records.length} rows inserted${duplicateCount ? ` (${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} skipped)` : ''}`);
};

// GET /api/v1/superadmin/cutoff/template
export const downloadTemplate = (_req, res) => {
  const header   = 'college_name,branch_name,year,round,category,exam_type,city,percentile,rank,score,dte_code,course_code\n';
  const examples = [
    'Indian Institute of Technology Bombay,Computer Engineering,2024,1,OPEN,JEE_ADVANCED,Mumbai,99.5,,,IIT01,CSE',
    'College of Engineering Pune,Mechanical Engineering,2024,1,OBC,MHT_CET,Pune,,5000,,TR2210,ME',
    'All India Institute of Medical Sciences Delhi,MBBS,2024,1,OPEN,NEET_UG,Delhi,,,700,AIIMS01,MBBS',
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="cutoff_upload_template.csv"');
  res.send(header + examples + '\n');
};

// DELETE /api/v1/superadmin/cutoff/:id — no tenant restriction
export const deleteCutoff = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('cutoff_data')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) return sendError(res, 'Failed to delete entry', 500, error.message);
    if (!data)  return sendError(res, 'Cutoff entry not found', 404);
    return sendSuccess(res, null, 'Cutoff entry deleted');
  } catch (err) {
    console.error('[superadmin deleteCutoff Error]', err);
    return sendError(res, 'Failed to delete entry', 500, err.message);
  }
};
