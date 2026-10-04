import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';
import { createNotification, broadcastNotification, broadcastNotificationByDomain } from '../../utils/notificationUtils.js';

const PAGE_SIZE = 20;

const VALID_DOMAINS = [
  'Engineering', 'Medical', 'Law', 'Management', 'Design / Architecture',
  'Pure Sciences', 'Commerce', 'Pharmacy', 'Agriculture',
];

// POST /api/v1/admin/notifications/send
// body: { recipientType, recipientId?, domain?, title, message, link? }
export const sendNotification = async (req, res) => {
  const { tenantId } = req.user;
  const { recipientType, recipientId, domain, title, message, link } = req.body;

  if (!recipientType || !title?.trim() || !message?.trim()) {
    return sendError(res, 'recipientType, title, and message are required', 400);
  }

  const VALID_TYPES = ['all_students', 'all_counselors', 'student', 'counselor', 'students_by_domain'];
  if (!VALID_TYPES.includes(recipientType)) {
    return sendError(res, `recipientType must be one of: ${VALID_TYPES.join(', ')}`, 400);
  }

  if ((recipientType === 'student' || recipientType === 'counselor') && !recipientId) {
    return sendError(res, 'recipientId is required for targeted notifications', 400);
  }

  if (recipientType === 'students_by_domain') {
    if (!domain) return sendError(res, 'domain is required for students_by_domain', 400);
    if (!VALID_DOMAINS.includes(domain)) {
      return sendError(res, `domain must be one of: ${VALID_DOMAINS.join(', ')}`, 400);
    }
  }

  try {
    if (recipientType === 'all_students') {
      await broadcastNotification('students', {
        tenantId,
        recipientRole: 'student',
        type: 'admin_message',
        title: title.trim(),
        message: message.trim(),
        link,
      });
    } else if (recipientType === 'all_counselors') {
      await broadcastNotification('counselors', {
        tenantId,
        recipientRole: 'counselor',
        type: 'admin_message',
        title: title.trim(),
        message: message.trim(),
        link,
      });
    } else if (recipientType === 'students_by_domain') {
      const count = await broadcastNotificationByDomain(domain, {
        tenantId,
        type: 'admin_message',
        title: title.trim(),
        message: message.trim(),
        link,
      });
      if (count === 0) {
        return sendError(res, `No active students with "${domain}" in their domain preferences were found.`, 404);
      }
      return sendSuccess(res, { notifiedCount: count }, `Notification sent to ${count} student${count !== 1 ? 's' : ''} interested in ${domain}`);
    } else {
      // Verify the target belongs to this tenant
      const table = recipientType === 'student' ? 'students' : 'counselors';
      const { data: target, error: targetErr } = await supabase
        .from(table)
        .select('id')
        .eq('id', recipientId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (targetErr) throw targetErr;
      if (!target) return sendError(res, 'Recipient not found in your institution', 404);

      await createNotification({
        tenantId,
        recipientId,
        recipientRole: recipientType,
        type: 'admin_message',
        title: title.trim(),
        message: message.trim(),
        link,
      });
    }

    return sendSuccess(res, {}, 'Notification sent successfully');
  } catch (err) {
    console.error('[sendNotification] Error:', err);
    return sendError(res, 'Failed to send notification', 500, err.message);
  }
};

// POST /api/v1/admin/request-tokens
// Admin requests more tokens from super admin — creates a notification
// visible in super admin's console (stored in notifications with recipient_role 'super_admin')
export const requestTokens = async (req, res) => {
  const { tenantId, userId, email } = req.user;
  const { message: customMsg } = req.body;

  try {
    // Fetch admin info for a descriptive message
    const { data: adminRow } = await supabase
      .from('admins')
      .select('name, organization_name, tokens_allocated, tokens_used')
      .eq('id', tenantId)
      .maybeSingle();

    const orgName    = adminRow?.organization_name ?? 'Unknown Institution';
    const adminName  = adminRow?.name ?? email;
    const remaining  = (adminRow?.tokens_allocated ?? 0) - (adminRow?.tokens_used ?? 0);
    const body       = customMsg?.trim() || `Tokens exhausted. Please allocate more tokens to continue adding students.`;

    // Fetch all super admins
    const { data: superAdmins } = await supabase
      .from('super_admins')
      .select('id')
      .eq('is_active', true);

    if (!superAdmins?.length) {
      console.warn('[requestTokens] No active super admins found');
      return sendSuccess(res, null, 'Token request recorded. No active Super Admins to notify currently.');
    }

    const rows = superAdmins.map(sa => ({
      tenant_id:      tenantId,
      recipient_id:   sa.id,
      recipient_role: 'super_admin',
      type:           'token_request',
      title:          `Token Request — ${orgName}`,
      message:        `${adminName} (${orgName}) has requested more tokens. Current balance: ${remaining} tokens remaining. Note: "${body}"`,
      link:           '/superadmin/admins',
    }));
    const { error: insertErr } = await supabase.from('notifications').insert(rows);
    if (insertErr) {
      // Most likely cause: migration v1_19_0 not yet applied (constraints don't include super_admin/token_request)
      console.error('[requestTokens] Notification insert failed:', insertErr.message);
      return sendError(res, 'Could not notify Super Admin. Ensure migration v1_19_0 is applied in Supabase.', 500, insertErr.message);
    }

    return sendSuccess(res, null, 'Token request sent to Super Admin successfully');
  } catch (err) {
    console.error('[requestTokens] Error:', err);
    return sendError(res, 'Failed to send token request', 500, err.message);
  }
};

// GET /api/v1/admin/notifications/sent
export const listSentNotifications = async (req, res) => {
  const { tenantId } = req.user;
  const page = Math.max(1, parseInt(req.query.page) || 1);

  try {
    // Fetch all admin_message rows for this tenant (minimal columns — dedup in JS)
    // Broadcasts insert one row per recipient, so we group by title+message+link+role
    const { data, error } = await supabase
      .from('notifications')
      .select('type, title, message, link, recipient_role, created_at')
      .eq('tenant_id', tenantId)
      .eq('type', 'admin_message')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Deduplicate: same title + message + link + recipient_role = same broadcast send
    const seen = new Map();
    for (const n of (data ?? [])) {
      const key = `${n.title}|||${n.message}|||${n.link ?? ''}|||${n.recipient_role}`;
      if (seen.has(key)) {
        seen.get(key).recipientCount++;
      } else {
        seen.set(key, { ...n, recipientCount: 1 });
      }
    }

    const groups = Array.from(seen.values());

    // Paginate on the deduplicated list
    const from       = (page - 1) * PAGE_SIZE;
    const paginated  = groups.slice(from, from + PAGE_SIZE);
    const totalPages = Math.ceil(groups.length / PAGE_SIZE);

    return sendSuccess(res, paginated, 'Sent notifications fetched', 200, {
      page,
      totalPages,
      total: groups.length,
    });
  } catch (err) {
    console.error('[listSentNotifications] Error:', err);
    return sendError(res, 'Failed to fetch sent notifications', 500, err.message);
  }
};
