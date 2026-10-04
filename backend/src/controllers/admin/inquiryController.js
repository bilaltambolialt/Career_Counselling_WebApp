import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

// Only this admin can see landing inquiries
const INQUIRY_ADMIN_EMAIL = 'apekshakamble007@gmail.com';

export const listInquiries = async (req, res) => {
  if (req.user.email !== INQUIRY_ADMIN_EMAIL) {
    return sendError(res, 'Access forbidden', 403);
  }

  const { page = 1, limit = 30, status } = req.query;
  const pageNum  = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
  const offset   = (pageNum - 1) * pageSize;

  try {
    let query = supabase
      .from('landing_inquiries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (status) query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) return sendError(res, 'Failed to fetch inquiries', 500, error.message);

    return sendSuccess(res, data ?? [], 'Inquiries fetched', 200, {
      page: pageNum,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      total: count ?? 0,
    });
  } catch (err) {
    console.error('[listInquiries Error]', err);
    return sendError(res, 'Failed to fetch inquiries', 500, err.message);
  }
};

export const updateInquiryStatus = async (req, res) => {
  if (req.user.email !== INQUIRY_ADMIN_EMAIL) {
    return sendError(res, 'Access forbidden', 403);
  }

  const { id } = req.params;
  const { status } = req.body;
  const VALID = ['new', 'contacted', 'closed'];
  if (!VALID.includes(status)) {
    return sendError(res, `Invalid status. Valid: ${VALID.join(', ')}`, 400);
  }

  try {
    const { data, error } = await supabase
      .from('landing_inquiries')
      .update({ status })
      .eq('id', id)
      .select('id, status')
      .maybeSingle();

    if (error) return sendError(res, 'Failed to update inquiry', 500, error.message);
    if (!data)  return sendError(res, 'Inquiry not found', 404);
    return sendSuccess(res, data, 'Status updated');
  } catch (err) {
    console.error('[updateInquiryStatus Error]', err);
    return sendError(res, 'Failed to update inquiry', 500, err.message);
  }
};
