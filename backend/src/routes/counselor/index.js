import { Router } from 'express';
import { validateJWT, requireRole } from '../../middleware/auth.js';
import { getCounselorDashboard, listAssignedStudents, toggleStudentPredictions } from '../../controllers/counselor/dashboardController.js';
import { generateCounselorDetailedReport } from '../../controllers/counselor/reportController.js';
import { listNotifications, markRead, markAllRead, sendNotification, listSentNotifications, deleteSentNotification } from '../../controllers/counselor/notificationsController.js';
import {
  listSessions, getStudentsList, createSession, updateSession, cancelSession,
} from '../../controllers/counselor/sessionsController.js';
import {
  listSessionRequests, acceptSessionRequest, declineSessionRequest,
} from '../../controllers/counselor/sessionRequestsController.js';
import { listTopCollegesForCounselor } from '../../controllers/counselor/topCollegesController.js';

const router = Router();

// All counselor routes require a valid JWT + counselor role
router.use(validateJWT);
router.use(requireRole('counselor'));

router.get('/dashboard',              getCounselorDashboard);
router.get('/students',               listAssignedStudents);
router.patch('/students/:id/toggle-predictions', toggleStudentPredictions);
router.get('/reports/:studentId',     generateCounselorDetailedReport);
router.post('/notifications/send',            sendNotification);
router.get('/notifications/sent',             listSentNotifications);
router.delete('/notifications/sent/:id',      deleteSentNotification);
router.get('/notifications',                  listNotifications);
router.patch('/notifications/read-all',       markAllRead);
router.patch('/notifications/:id/read',       markRead);

// ── Sessions ──────────────────────────────────────────────
router.get('/sessions/students-list',          getStudentsList);     // specific routes first
router.get('/sessions/requests',               listSessionRequests);
router.patch('/sessions/requests/:id/accept',  acceptSessionRequest);
router.patch('/sessions/requests/:id/decline', declineSessionRequest);
router.get('/sessions',               listSessions);
router.post('/sessions',              createSession);
router.patch('/sessions/:id',         updateSession);
router.delete('/sessions/:id',        cancelSession);

// ── Top Colleges (for comparison tool) ────────────────────
router.get('/top-colleges', listTopCollegesForCounselor);

export default router;
