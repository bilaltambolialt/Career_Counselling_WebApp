import supabase from '../../config/supabase.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';

export const submitInquiry = async (req, res) => {
  const { name, email, phone, qualification, concern, concernDetail } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return sendError(res, 'Name and email are required', 400);
  }

  try {
    const { data, error } = await supabase
      .from('landing_inquiries')
      .insert({
        name:           name.trim(),
        email:          email.toLowerCase().trim(),
        phone:          phone?.trim()        || null,
        qualification:  qualification?.trim() || null,
        concern:        concern               || null,
        concern_detail: concernDetail?.trim() || null,
      })
      .select('id, created_at')
      .single();

    if (error) return sendError(res, 'Failed to save inquiry', 500, error.message);
    return sendCreated(res, data, 'Inquiry submitted successfully');
  } catch (err) {
    console.error('[submitInquiry Error]', err);
    return sendError(res, 'Failed to save inquiry', 500, err.message);
  }
};
