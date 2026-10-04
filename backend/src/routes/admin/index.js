import { Router } from 'express';
import { validateJWT, requireRole, requireTenant } from '../../middleware/auth.js';
import { getDashboard } from '../../controllers/admin/dashboardController.js';
import {
  listStudents, createStudent, getStudent,
  updateStudent, deactivateStudent, assignCounselor,
} from '../../controllers/admin/studentController.js';
import {
  listCounselors, createCounselor, getCounselor,
  updateCounselor, deactivateCounselor,
} from '../../controllers/admin/counselorController.js';
import { sendNotification, listSentNotifications, requestTokens } from '../../controllers/admin/notificationsController.js';
import { listInquiries, updateInquiryStatus } from '../../controllers/admin/inquiryController.js';

const router = Router();

// Apply auth + role guard to every admin route
router.use(validateJWT, requireRole('admin'), requireTenant);

// ── Dashboard ─────────────────────────────────────────────
router.get('/dashboard', getDashboard);

// ── Students ──────────────────────────────────────────────
router.get('/students',              listStudents);
router.post('/students',             createStudent);
router.get('/students/:id',          getStudent);
router.patch('/students/:id',        updateStudent);
router.delete('/students/:id',       deactivateStudent);
router.post('/students/:id/assign-counselor', assignCounselor);

// ── Counselors ────────────────────────────────────────────
router.get('/counselors',            listCounselors);
router.post('/counselors',           createCounselor);
router.get('/counselors/:id',        getCounselor);
router.patch('/counselors/:id',      updateCounselor);
router.delete('/counselors/:id',     deactivateCounselor);

// ── Notifications ─────────────────────────────────────────
router.post('/notifications/send',   sendNotification);
router.get('/notifications/sent',    listSentNotifications);

// ── Token Request ──────────────────────────────────────────
router.post('/request-tokens', requestTokens);

// ── Landing Inquiries (Apeksha only) ───────────────────────
router.get('/inquiries',           listInquiries);
router.patch('/inquiries/:id',     updateInquiryStatus);

export default router;
