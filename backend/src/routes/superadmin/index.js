import { Router } from 'express';
import multer from 'multer';
import { validateJWT, requireRole } from '../../middleware/auth.js';
import { getSuperAdminDashboard } from '../../controllers/superadmin/dashboardController.js';
import {
  listNotifications, markNotificationRead, markAllRead,
} from '../../controllers/superadmin/notificationsController.js';
import {
  listAdmins, createAdmin, getAdmin, updateAdmin, toggleAdminActive, allocateTokens,
} from '../../controllers/superadmin/adminsController.js';
import {
  listCutoff, createCutoff, bulkUploadCutoff, downloadTemplate, deleteCutoff,
} from '../../controllers/superadmin/cutoffController.js';
import {
  listTopColleges, createTopCollege, bulkUploadTopColleges,
  downloadTemplate as downloadTopCollegesTemplate, deleteTopCollege, toggleSponsored,
} from '../../controllers/superadmin/topCollegesController.js';
import {
  listColleges, createCollege, createBranch, deleteCollege, deleteBranch,
  bulkUploadColleges, downloadTemplate as downloadCollegesTemplate,
} from '../../controllers/superadmin/collegesController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// All superadmin routes require valid JWT + super_admin role
router.use(validateJWT);
router.use(requireRole('super_admin'));

// ── Dashboard ──────────────────────────────────────────────────
router.get('/dashboard', getSuperAdminDashboard);

// ── Notifications ───────────────────────────────────────────────
router.get('/notifications',            listNotifications);
router.patch('/notifications/read-all', markAllRead);          // before /:id
router.patch('/notifications/:id/read', markNotificationRead);

// ── Admins / Tenants ───────────────────────────────────────────
router.get('/admins',                     listAdmins);
router.post('/admins',                    createAdmin);
router.get('/admins/:id',                 getAdmin);
router.patch('/admins/:id',               updateAdmin);
router.patch('/admins/:id/toggle-active',   toggleAdminActive);
router.patch('/admins/:id/allocate-tokens', allocateTokens);

// ── Cutoff Data ────────────────────────────────────────────────
router.get('/cutoff/template', downloadTemplate);           // before /cutoff/:id
router.get('/cutoff',          listCutoff);
router.post('/cutoff',         createCutoff);
router.post('/cutoff/bulk',    upload.single('file'), bulkUploadCutoff);
router.delete('/cutoff/:id',   deleteCutoff);

// ── Top College Lists ───────────────────────────────────────────
router.get('/top-colleges/template',              downloadTopCollegesTemplate); // before /:id
router.get('/top-colleges',                       listTopColleges);
router.post('/top-colleges',                      createTopCollege);
router.post('/top-colleges/bulk',                 upload.single('file'), bulkUploadTopColleges);
router.patch('/top-colleges/:id/toggle-sponsored', toggleSponsored);
router.delete('/top-colleges/:id',                deleteTopCollege);

// ── Colleges & Branches ────────────────────────────────────────
router.get('/colleges/template',        downloadCollegesTemplate);   // before /:id
router.get('/colleges',                 listColleges);
router.post('/colleges',                createCollege);
router.post('/colleges/bulk',           upload.single('file'), bulkUploadColleges);
router.post('/colleges/branches',       createBranch);
router.delete('/colleges/:id',          deleteCollege);
router.delete('/colleges/branches/:id', deleteBranch);

export default router;
