import supabase from '../../config/supabase.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';
import { parse } from 'csv-parse/sync';

const VALID_COLLEGE_TYPES = ['Government', 'Private', 'Aided', 'Autonomous'];

// ── List all colleges with branch count ──────────────────────────
export const listColleges = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('colleges')
      .select('*, college_branches(id, branch_name, branch_code, total_seats, is_active)')
      .order('name', { ascending: true });

    if (error) return sendError(res, 'Failed to fetch colleges', 500, error.message);
    return sendSuccess(res, data ?? [], 'Colleges fetched');
  } catch (err) {
    return sendError(res, 'Failed to fetch colleges', 500, err.message);
  }
};

// ── Create single college (+ optional first branch) ─────────────
export const createCollege = async (req, res) => {
  try {
    const {
      name, short_name, college_type, state, location, affiliation, website,
      branch_name, branch_code, total_seats,
    } = req.body;

    if (!name?.trim()) return sendError(res, 'College name is required', 422);
    if (!college_type || !VALID_COLLEGE_TYPES.includes(college_type)) {
      return sendError(res, `college_type must be one of: ${VALID_COLLEGE_TYPES.join(', ')}`, 422);
    }

    // Duplicate check
    const { data: existing } = await supabase
      .from('colleges').select('id').ilike('name', name.trim()).maybeSingle();
    if (existing) return sendError(res, `College "${name.trim()}" already exists`, 409);

    const { data: college, error: ce } = await supabase
      .from('colleges')
      .insert({
        name:        name.trim(),
        short_name:  short_name?.trim()  || null,
        college_type,
        state:       state?.trim()       || null,
        location:    location?.trim()    || null,
        affiliation: affiliation?.trim() || null,
        website:     website?.trim()     || null,
      })
      .select()
      .single();

    if (ce) return sendError(res, ce.message, 500);

    let branch = null;
    if (branch_name?.trim()) {
      const { data: b, error: be } = await supabase
        .from('college_branches')
        .insert({
          college_id:  college.id,
          branch_name: branch_name.trim(),
          branch_code: branch_code?.trim() || null,
          total_seats: total_seats ? parseInt(total_seats) : null,
        })
        .select()
        .single();
      if (be) return sendError(res, be.message, 500);
      branch = b;
    }

    return sendCreated(res, { college, branch }, 'College created');
  } catch (err) {
    return sendError(res, 'Failed to create college', 500, err.message);
  }
};

// ── Add branch to existing college ──────────────────────────────
export const createBranch = async (req, res) => {
  try {
    const { college_id, branch_name, branch_code, total_seats } = req.body;

    if (!college_id)        return sendError(res, 'college_id is required', 422);
    if (!branch_name?.trim()) return sendError(res, 'branch_name is required', 422);

    // Verify college exists
    const { data: college } = await supabase
      .from('colleges').select('id').eq('id', college_id).maybeSingle();
    if (!college) return sendError(res, 'College not found', 404);

    // Duplicate branch check
    const { data: dup } = await supabase
      .from('college_branches')
      .select('id')
      .eq('college_id', college_id)
      .ilike('branch_name', branch_name.trim())
      .maybeSingle();
    if (dup) return sendError(res, `Branch "${branch_name.trim()}" already exists for this college`, 409);

    const { data, error } = await supabase
      .from('college_branches')
      .insert({
        college_id,
        branch_name: branch_name.trim(),
        branch_code: branch_code?.trim() || null,
        total_seats: total_seats ? parseInt(total_seats) : null,
      })
      .select()
      .single();

    if (error) return sendError(res, error.message, 500);
    return sendCreated(res, data, 'Branch added');
  } catch (err) {
    return sendError(res, 'Failed to add branch', 500, err.message);
  }
};

// ── Delete college (branches cascade) ───────────────────────────
export const deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('colleges').delete().eq('id', id);
    if (error) return sendError(res, error.message, 500);
    return sendSuccess(res, null, 'College deleted');
  } catch (err) {
    return sendError(res, 'Failed to delete college', 500, err.message);
  }
};

// ── Delete branch ────────────────────────────────────────────────
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('college_branches').delete().eq('id', id);
    if (error) return sendError(res, error.message, 500);
    return sendSuccess(res, null, 'Branch deleted');
  } catch (err) {
    return sendError(res, 'Failed to delete branch', 500, err.message);
  }
};

// ── CSV template download ────────────────────────────────────────
export const downloadTemplate = (_req, res) => {
  const headers = [
    'college_name', 'short_name', 'college_type',
    'state', 'location', 'affiliation', 'website',
    'branch_name', 'branch_code', 'total_seats',
  ];
  const example = [
    'Example Engineering College', 'EEC', 'Government',
    'Maharashtra', 'Pune', 'SPPU', 'https://example.edu',
    'Computer Engineering', 'CO', '60',
  ];
  const note = [
    '# college_type must be: Government | Private | Aided | Autonomous',
    '# branch_name / branch_code / total_seats are optional',
    '# One row per branch; repeat college_name to add multiple branches to the same college',
  ].join('\n');

  const csv = [note, headers.join(','), example.join(',')].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="colleges_template.csv"');
  res.send(csv);
};

// ── Bulk CSV upload ──────────────────────────────────────────────
export const bulkUploadColleges = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400);

    const csvText = req.file.buffer.toString('utf-8');

    // Strip comment lines before parsing
    const stripped = csvText.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');

    let rows;
    try {
      rows = parse(stripped, { columns: true, skip_empty_lines: true, trim: true });
    } catch (parseErr) {
      return sendError(res, `CSV parse error: ${parseErr.message}`, 400);
    }

    if (!rows.length) return sendError(res, 'CSV has no data rows', 400);

    const stats = { inserted_colleges: 0, inserted_branches: 0, duplicates: 0, errors: [] };

    // Pre-load all existing colleges into a name→id cache
    const { data: existingColleges } = await supabase.from('colleges').select('id, name');
    const collegeCache = {};
    for (const c of existingColleges ?? []) {
      collegeCache[c.name.toLowerCase()] = c.id;
    }

    // Pre-load existing branches as "collegeId:branchName" set
    const { data: existingBranches } = await supabase
      .from('college_branches').select('college_id, branch_name');
    const branchSet = new Set(
      (existingBranches ?? []).map(b => `${b.college_id}:${b.branch_name.toLowerCase()}`)
    );

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const rowNum = i + 2;

      const collegeName = row['college_name']?.trim();
      const collegeType = row['college_type']?.trim();

      if (!collegeName) {
        stats.errors.push(`Row ${rowNum}: college_name is required`);
        continue;
      }
      if (!collegeType || !VALID_COLLEGE_TYPES.includes(collegeType)) {
        stats.errors.push(`Row ${rowNum}: college_type must be one of ${VALID_COLLEGE_TYPES.join(', ')}`);
        continue;
      }

      // Get or create college
      let collegeId = collegeCache[collegeName.toLowerCase()];
      if (!collegeId) {
        const { data: newCollege, error: ce } = await supabase
          .from('colleges')
          .insert({
            name:        collegeName,
            short_name:  row['short_name']?.trim()  || null,
            college_type: collegeType,
            state:       row['state']?.trim()        || null,
            location:    row['location']?.trim()     || null,
            affiliation: row['affiliation']?.trim()  || null,
            website:     row['website']?.trim()      || null,
          })
          .select('id')
          .single();

        if (ce) { stats.errors.push(`Row ${rowNum}: ${ce.message}`); continue; }
        collegeId = newCollege.id;
        collegeCache[collegeName.toLowerCase()] = collegeId;
        stats.inserted_colleges++;
      }

      // Add branch if provided
      const branchName = row['branch_name']?.trim();
      if (branchName) {
        const branchKey = `${collegeId}:${branchName.toLowerCase()}`;
        if (branchSet.has(branchKey)) {
          stats.duplicates++;
        } else {
          const { error: be } = await supabase.from('college_branches').insert({
            college_id:  collegeId,
            branch_name: branchName,
            branch_code: row['branch_code']?.trim() || null,
            total_seats: row['total_seats'] ? parseInt(row['total_seats']) : null,
          });
          if (be) {
            stats.errors.push(`Row ${rowNum} (branch): ${be.message}`);
          } else {
            branchSet.add(branchKey);
            stats.inserted_branches++;
          }
        }
      }
    }

    return sendSuccess(res, stats, 'Upload complete');
  } catch (err) {
    return sendError(res, 'Upload failed', 500, err.message);
  }
};
