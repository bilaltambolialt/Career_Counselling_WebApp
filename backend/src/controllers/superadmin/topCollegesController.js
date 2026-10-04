import { parse } from 'csv-parse/sync';
import supabase from '../../config/supabase.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';

const PAGE_SIZE = 30;

const VALID_FIELDS = [
  'Engineering', 'Medical', 'Law', 'Management', 'Design / Architecture',
  'Pharmacy', 'Agriculture', 'Commerce', 'Pure Sciences', 'Other',
];
const VALID_COLLEGE_TYPES = ['Government', 'Private', 'Deemed', 'Autonomous', 'Other'];

// ── GET /api/v1/superadmin/top-colleges ───────────────────────────────────
export const listTopColleges = async (req, res) => {
  const { page = 1, limit = PAGE_SIZE, field, program, state, collegeType, search } = req.query;
  const pageNum  = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
  const offset   = (pageNum - 1) * pageSize;

  try {
    let query = supabase
      .from('top_colleges')
      .select('*', { count: 'exact' })
      .order('field')
      .order('program')
      .order('rank', { ascending: true, nullsFirst: false })
      .range(offset, offset + pageSize - 1);

    if (field)       query = query.eq('field', field);
    if (program)     query = query.ilike('program', `%${program}%`);
    if (state)       query = query.eq('location_state', state);
    if (collegeType) query = query.eq('college_type', collegeType);
    if (search)      query = query.ilike('college_name', `%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    return sendSuccess(res, data ?? [], 'Top colleges fetched', 200, {
      page: pageNum,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      total: count ?? 0,
    });
  } catch (err) {
    console.error('[listTopColleges] Error:', err);
    return sendError(res, 'Failed to fetch top colleges', 500, err.message);
  }
};

// ── POST /api/v1/superadmin/top-colleges ─────────────────────────────────
export const createTopCollege = async (req, res) => {
  const { userId } = req.user;
  const {
    field, program, collegeName, rank, locationCity, locationState,
    collegeType, affiliation, annualFees, notableFeatures, dteCode, branchCode,
  } = req.body;

  if (!field || !program || !collegeName) {
    return sendError(res, 'field, program and collegeName are required', 400);
  }
  if (!VALID_FIELDS.includes(field)) {
    return sendError(res, `Invalid field. Valid: ${VALID_FIELDS.join(', ')}`, 400);
  }
  if (collegeType && !VALID_COLLEGE_TYPES.includes(collegeType)) {
    return sendError(res, `Invalid collegeType. Valid: ${VALID_COLLEGE_TYPES.join(', ')}`, 400);
  }

  try {
    const { data, error } = await supabase
      .from('top_colleges')
      .insert({
        field:            field.trim(),
        program:          program.trim(),
        college_name:     collegeName.trim(),
        rank:             rank ? parseInt(rank) : null,
        location_city:    locationCity?.trim()  || null,
        location_state:   locationState?.trim() || null,
        college_type:     collegeType?.trim()   || null,
        affiliation:      affiliation?.trim()   || null,
        annual_fees:      annualFees ? parseFloat(annualFees) : null,
        notable_features: notableFeatures?.trim() || null,
        dte_code:         dteCode?.trim()         || null,
        branch_code:      branchCode?.trim()       || null,
        created_by:       userId,
      })
      .select('*')
      .single();

    if (error) throw error;
    return sendCreated(res, data, 'College entry created');
  } catch (err) {
    console.error('[createTopCollege] Error:', err);
    return sendError(res, 'Failed to create college entry', 500, err.message);
  }
};

// ── POST /api/v1/superadmin/top-colleges/bulk ─────────────────────────────
// CSV columns: field, program, college_name, rank, location_city, location_state,
//              college_type, affiliation, annual_fees, notable_features, dte_code, branch_code
export const bulkUploadTopColleges = async (req, res) => {
  const { userId } = req.user;
  if (!req.file) return sendError(res, 'CSV file is required', 400);

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

  const inserts = [];
  const errors  = [];

  records.forEach((row, i) => {
    const rowNum = i + 2;
    const { field, program, college_name, rank, location_city, location_state,
            college_type, affiliation, annual_fees, notable_features,
            dte_code, branch_code } = row;

    if (!field || !program || !college_name) {
      errors.push({ row: rowNum, message: 'field, program and college_name are required' });
      return;
    }
    if (!VALID_FIELDS.includes(field.trim())) {
      errors.push({ row: rowNum, message: `Invalid field "${field}". Valid: ${VALID_FIELDS.join(', ')}` });
      return;
    }
    if (college_type && !VALID_COLLEGE_TYPES.includes(college_type.trim())) {
      errors.push({ row: rowNum, message: `Invalid college_type "${college_type}"` });
      return;
    }

    inserts.push({
      field:            field.trim(),
      program:          program.trim(),
      college_name:     college_name.trim(),
      rank:             rank ? parseInt(rank) : null,
      location_city:    location_city?.trim()  || null,
      location_state:   location_state?.trim() || null,
      college_type:     college_type?.trim()   || null,
      affiliation:      affiliation?.trim()    || null,
      annual_fees:      annual_fees ? parseFloat(annual_fees) : null,
      notable_features: notable_features?.trim() || null,
      dte_code:         dte_code?.trim()          || null,
      branch_code:      branch_code?.trim()        || null,
      created_by:       userId,
    });
  });

  let inserted = 0;
  if (inserts.length) {
    const { error } = await supabase.from('top_colleges').insert(inserts);
    if (error) return sendError(res, 'Failed to insert college data', 500, error.message);
    inserted = inserts.length;
  }

  return sendSuccess(res, {
    total: records.length,
    inserted,
    skipped: errors.length,
    errors,
  }, `${inserted} of ${records.length} rows inserted`);
};

// ── GET /api/v1/superadmin/top-colleges/template ──────────────────────────
export const downloadTemplate = (_req, res) => {
  const header = 'field,program,college_name,rank,location_city,location_state,college_type,affiliation,annual_fees,notable_features,dte_code,branch_code\n';
  const examples = [
    'Engineering,Computer Science Engineering,Indian Institute of Technology Bombay,1,Mumbai,Maharashtra,Government,IIT,250000,Premier IIT; excellent placements,,',
    'Engineering,Civil Engineering,National Institute of Technology Trichy,5,Tiruchirappalli,Tamil Nadu,Government,NIT,150000,Top NIT for Civil,TR1234,CE',
    'Medical,MBBS,All India Institute of Medical Sciences Delhi,1,Delhi,Delhi,Government,AIIMS,1000,Best government medical college,,',
    'Medical,BDS,Manipal College of Dental Sciences,3,Manipal,Karnataka,Private,Manipal Academy of Higher Education,600000,Top dental college,,BDS01',
    'Law,LLB (5-Year Integrated),National Law School of India University,1,Bengaluru,Karnataka,Government,NLU,180000,Top NLU in India,,',
    'Management,MBA,Indian Institute of Management Ahmedabad,1,Ahmedabad,Gujarat,Government,IIM,2300000,Flagship IIM,,',
    'Pharmacy,B.Pharm,JSS College of Pharmacy,2,Ooty,Tamil Nadu,Deemed,JSS University,400000,Top pharmacy college,PH2201,BP',
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="top_colleges_template.csv"');
  res.send(header + examples + '\n');
};

// ── PATCH /api/v1/superadmin/top-colleges/:id/toggle-sponsored ────────────
// Body when setting:   { amount: number, sponsoredUntil: ISO-string }
// Body when removing:  (empty — current is_sponsored must be true)
export const toggleSponsored = async (req, res) => {
  const { id } = req.params;
  const { amount, sponsoredUntil } = req.body ?? {};

  try {
    const { data: current, error: fetchErr } = await supabase
      .from('top_colleges')
      .select('id, is_sponsored')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!current) return sendError(res, 'College entry not found', 404);

    let updatePayload;

    if (current.is_sponsored) {
      // Remove sponsorship — keep amount in DB for revenue history
      updatePayload = { is_sponsored: false };
    } else {
      // Set sponsorship — amount is required
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return sendError(res, 'A valid sponsorship amount is required', 400);
      }
      if (!sponsoredUntil) {
        return sendError(res, 'sponsoredUntil date is required', 400);
      }
      const untilDate = new Date(sponsoredUntil);
      if (isNaN(untilDate.getTime()) || untilDate <= new Date()) {
        return sendError(res, 'sponsoredUntil must be a valid future date', 400);
      }
      updatePayload = {
        is_sponsored:       true,
        sponsorship_amount: parseFloat(amount),
        sponsored_from:     new Date().toISOString(),
        sponsored_until:    untilDate.toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('top_colleges')
      .update(updatePayload)
      .eq('id', id)
      .select('id, college_name, is_sponsored, sponsorship_amount, sponsored_from, sponsored_until')
      .single();

    if (error) throw error;
    return sendSuccess(res, data, `College ${data.is_sponsored ? 'marked as sponsored' : 'removed from sponsored'}`);
  } catch (err) {
    console.error('[toggleSponsored] Error:', err);
    return sendError(res, 'Failed to update sponsored status', 500, err.message);
  }
};

// ── DELETE /api/v1/superadmin/top-colleges/:id ────────────────────────────
export const deleteTopCollege = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('top_colleges')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data)  return sendError(res, 'College entry not found', 404);
    return sendSuccess(res, null, 'College entry deleted');
  } catch (err) {
    console.error('[deleteTopCollege] Error:', err);
    return sendError(res, 'Failed to delete entry', 500, err.message);
  }
};
