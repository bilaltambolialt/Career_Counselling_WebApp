import supabase from '../../config/supabase.js';
import { sendSuccess, sendError } from '../../utils/responseUtils.js';

// GET /api/v1/superadmin/dashboard
export const getSuperAdminDashboard = async (req, res) => {
  try {
    const [
      adminCountRes,
      studentCountRes,
      counselorCountRes,
      sessionCountRes,
      tokenRevenueRes,
      sponsorshipRevenueRes,
      recentAdminsRes,
    ] = await Promise.allSettled([
      supabase.from('admins').select('id', { count: 'exact', head: true }),
      supabase.from('students').select('id', { count: 'exact', head: true }),
      supabase.from('counselors').select('id', { count: 'exact', head: true }),
      supabase.from('counseling_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('admins').select('tokens_allocated'),
      supabase.from('top_colleges').select('sponsorship_amount').not('sponsorship_amount', 'is', null),
      supabase
        .from('admins')
        .select('id, name, email, organization_name, is_active, tokens_allocated, tokens_used, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const totalAdmins     = adminCountRes.status     === 'fulfilled' ? (adminCountRes.value.count     ?? 0) : 0;
    const totalStudents   = studentCountRes.status   === 'fulfilled' ? (studentCountRes.value.count   ?? 0) : 0;
    const totalCounselors = counselorCountRes.status === 'fulfilled' ? (counselorCountRes.value.count ?? 0) : 0;
    const totalSessions   = sessionCountRes.status   === 'fulfilled' ? (sessionCountRes.value.count   ?? 0) : 0;
    const recentAdmins    = recentAdminsRes.status   === 'fulfilled' ? (recentAdminsRes.value.data    ?? []) : [];

    // Token revenue = sum of tokens_allocated × ₹1,000
    const allAdminTokens       = tokenRevenueRes.status === 'fulfilled' ? (tokenRevenueRes.value.data ?? []) : [];
    const totalTokensAllocated = allAdminTokens.reduce((sum, a) => sum + (a.tokens_allocated ?? 0), 0);
    const tokenRevenue         = totalTokensAllocated * 1000;

    // Sponsorship revenue = sum of all sponsorship_amount (all-time, including expired)
    const allSponsorships    = sponsorshipRevenueRes.status === 'fulfilled' ? (sponsorshipRevenueRes.value.data ?? []) : [];
    const sponsorshipRevenue = allSponsorships.reduce((sum, c) => sum + (parseFloat(c.sponsorship_amount) || 0), 0);

    const totalRevenue = tokenRevenue + sponsorshipRevenue;

    return sendSuccess(res, {
      totalAdmins,
      totalStudents,
      totalCounselors,
      totalSessions,
      totalRevenue,
      tokenRevenue,
      sponsorshipRevenue,
      recentAdmins: recentAdmins.map(a => ({
        ...a,
        tokensRemaining: (a.tokens_allocated ?? 0) - (a.tokens_used ?? 0),
      })),
    });
  } catch (err) {
    console.error('[getSuperAdminDashboard Error]', err);
    return sendError(res, 'Failed to load super admin dashboard', 500, err.message);
  }
};
