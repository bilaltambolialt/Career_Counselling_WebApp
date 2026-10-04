import supabase from '../../config/supabase.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/responseUtils.js';

const STORAGE_BUCKET = 'student-documents';
const SIGNED_URL_TTL = 60 * 60; // 1 hour

const VALID_DOC_TYPES = [
  'aadhaar', '10th_marksheet', '12th_marksheet', 'diploma_marksheet',
  'ews_certificate', 'caste_certificate', 'income_certificate',
  'domicile_certificate', 'other',
];

// ── GET /api/v1/student/documents ────────────────────────────
export const listDocuments = async (req, res) => {
  const { userId, tenantId } = req.user;

  try {
    const { data: docs, error } = await supabase
      .from('student_documents')
      .select('id, doc_type, file_name, file_path, file_size, uploaded_at')
      .eq('student_id', userId)
      .eq('tenant_id', tenantId)
      .order('uploaded_at', { ascending: false });

    if (error) return sendError(res, 'Failed to fetch documents', 500, error.message);

    // Generate signed URL for each document
    const withUrls = await Promise.all(
      (docs ?? []).map(async (doc) => {
        const { data: urlData, error: urlErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(doc.file_path, SIGNED_URL_TTL);

        return {
          ...doc,
          signed_url: urlErr ? null : urlData?.signedUrl,
        };
      }),
    );

    return sendSuccess(res, withUrls, 'Documents fetched');
  } catch (err) {
    console.error('[listDocuments Error]', err);
    return sendError(res, 'Failed to fetch documents', 500, err.message);
  }
};

// ── POST /api/v1/student/documents ───────────────────────────
export const uploadDocument = async (req, res) => {
  const { userId, tenantId } = req.user;
  const { doc_type } = req.body;

  if (!req.file) return sendError(res, 'File is required', 400);
  if (!doc_type)  return sendError(res, 'doc_type is required', 400);
  if (!VALID_DOC_TYPES.includes(doc_type)) {
    return sendError(res, `Invalid doc_type. Valid: ${VALID_DOC_TYPES.join(', ')}`, 400);
  }

  const ext      = req.file.originalname.split('.').pop().toLowerCase();
  const ts       = Date.now();
  const filePath = `${tenantId}/${userId}/${doc_type}_${ts}.${ext}`;

  try {
    // Upload to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadErr) {
      // Give a clear message if bucket doesn't exist
      if (uploadErr.message?.includes('Bucket not found') || uploadErr.statusCode === 404) {
        return sendError(
          res,
          "Storage bucket 'student-documents' not configured. Create it in Supabase Dashboard → Storage → New Bucket (name: student-documents, type: Private).",
          503,
        );
      }
      return sendError(res, 'File upload failed: ' + uploadErr.message, 500, uploadErr.message);
    }

    // Save record in DB
    const { data, error: dbErr } = await supabase
      .from('student_documents')
      .insert({
        student_id: userId,
        tenant_id:  tenantId,
        doc_type,
        file_name:  req.file.originalname,
        file_path:  filePath,
        file_size:  req.file.size,
      })
      .select('id, doc_type, file_name, file_path, file_size, uploaded_at')
      .single();

    if (dbErr) return sendError(res, 'Failed to save document record', 500, dbErr.message);

    // Return with signed URL
    const { data: urlData } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_TTL);

    return sendCreated(res, { ...data, signed_url: urlData?.signedUrl ?? null }, 'Document uploaded');
  } catch (err) {
    console.error('[uploadDocument Error]', err);
    return sendError(res, 'Upload failed', 500, err.message);
  }
};

// ── DELETE /api/v1/student/documents/:id ─────────────────────
export const deleteDocument = async (req, res) => {
  const { userId, tenantId } = req.user;
  const { id } = req.params;

  try {
    // Fetch record to get file_path (and verify ownership)
    const { data: doc, error: fetchErr } = await supabase
      .from('student_documents')
      .select('id, file_path')
      .eq('id', id)
      .eq('student_id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (fetchErr) return sendError(res, 'Failed to fetch document', 500, fetchErr.message);
    if (!doc)     return sendError(res, 'Document not found', 404);

    // Delete from Storage (best-effort — don't block on storage error)
    await supabase.storage.from(STORAGE_BUCKET).remove([doc.file_path]);

    // Delete DB record
    const { error: delErr } = await supabase
      .from('student_documents')
      .delete()
      .eq('id', id)
      .eq('student_id', userId);

    if (delErr) return sendError(res, 'Failed to delete document record', 500, delErr.message);

    return sendSuccess(res, null, 'Document deleted');
  } catch (err) {
    console.error('[deleteDocument Error]', err);
    return sendError(res, 'Failed to delete document', 500, err.message);
  }
};
