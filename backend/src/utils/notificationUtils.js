import supabase from '../config/supabase.js';

/**
 * Insert a single notification row.
 * Fire-and-forget — call without await in hot paths if you don't need to block.
 *
 * @param {object} opts
 * @param {string} opts.tenantId
 * @param {string} opts.recipientId
 * @param {'student'|'counselor'|'admin'} opts.recipientRole
 * @param {string} opts.type            - e.g. 'welcome', 'predictions_ready', 'admin_message'
 * @param {string} opts.title           - short headline
 * @param {string} opts.message         - body text
 * @param {string} [opts.link]          - optional front-end route (e.g. '/student/predictions')
 */
export const createNotification = async ({ tenantId, recipientId, recipientRole, type, title, message, link }) => {
  const { error } = await supabase.from('notifications').insert({
    tenant_id:      tenantId,
    recipient_id:   recipientId,
    recipient_role: recipientRole,
    type,
    title,
    message,
    link: link ?? null,
  });
  if (error) {
    console.error('[createNotification] Failed to insert notification:', error.message);
  }
};

/**
 * Insert notifications for every student (or counselor) in a tenant.
 * Used for admin broadcasts.
 *
 * @param {'students'|'counselors'} table  - DB table to query recipients from
 * @param {object} opts                    - same fields as createNotification except recipientId
 */
export const broadcastNotification = async (table, { tenantId, recipientRole, type, title, message, link }) => {
  // Fetch all active recipients in this tenant
  const { data: recipients, error: fetchErr } = await supabase
    .from(table)
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (fetchErr || !recipients?.length) {
    if (fetchErr) console.error('[broadcastNotification] Fetch error:', fetchErr.message);
    return;
  }

  const rows = recipients.map(r => ({
    tenant_id:      tenantId,
    recipient_id:   r.id,
    recipient_role: recipientRole,
    type,
    title,
    message,
    link: link ?? null,
  }));

  const { error: insertErr } = await supabase.from('notifications').insert(rows);
  if (insertErr) {
    console.error('[broadcastNotification] Insert error:', insertErr.message);
  }
};

/**
 * Insert notifications for all active students in a tenant who have a specific domain
 * in their domains_of_interest profile field.
 *
 * @param {string} domain  - e.g. 'Engineering', 'Medical'
 * @param {object} opts    - same fields as createNotification except recipientId/recipientRole
 */
/**
 * Returns the count of students notified, or throws on DB error.
 */
export const broadcastNotificationByDomain = async (domain, { tenantId, type, title, message, link }) => {
  // domains_of_interest is JSONB — must use JSON.stringify so PostgREST receives
  // the @> operator value as '["Engineering"]' not '{Engineering}'.
  const { data: profiles, error: profileErr } = await supabase
    .from('student_profiles')
    .select('student_id')
    .eq('tenant_id', tenantId)
    .filter('domains_of_interest', 'cs', JSON.stringify([domain]));

  if (profileErr) throw new Error(`Profile fetch failed: ${profileErr.message}`);
  if (!profiles?.length) return 0;

  const studentIds = profiles.map(p => p.student_id);

  // Filter to active students only
  const { data: activeStudents, error: studentErr } = await supabase
    .from('students')
    .select('id')
    .in('id', studentIds)
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (studentErr) throw new Error(`Student fetch failed: ${studentErr.message}`);
  if (!activeStudents?.length) return 0;

  const rows = activeStudents.map(s => ({
    tenant_id:      tenantId,
    recipient_id:   s.id,
    recipient_role: 'student',
    type,
    title,
    message,
    link: link ?? null,
  }));

  const { error: insertErr } = await supabase.from('notifications').insert(rows);
  if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

  return activeStudents.length;
};
