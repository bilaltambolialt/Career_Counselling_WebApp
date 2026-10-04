import { Router } from 'express';
import multer from 'multer';
import { validateJWT, requireRole } from '../../middleware/auth.js';
import { getStudentDashboard } from '../../controllers/student/dashboardController.js';
import { getProfile, updateProfile } from '../../controllers/student/profileController.js';
import { listScores, addScore, updateScore, deleteScore } from '../../controllers/student/examScoresController.js';
import { listPredictions, generatePredictions, clearPredictions } from '../../controllers/student/predictionController.js';
import { listDocuments, uploadDocument, deleteDocument } from '../../controllers/student/documentController.js';
import { listBranchNames } from '../../controllers/student/branchesController.js';
import { listCollegePreferences, addCollegePreference, removeCollegePreference } from '../../controllers/student/collegePreferencesController.js';
import { generateStudentSummaryReport } from '../../controllers/student/reportController.js';
import { listNotifications, markRead, markAllRead } from '../../controllers/student/notificationsController.js';
import { listSessions } from '../../controllers/student/sessionsController.js';
import { createSessionRequest, getSessionRequest } from '../../controllers/student/sessionRequestsController.js';
import { listExploreColleges, listSponsoredColleges, listBookmarks, addBookmark, removeBookmark } from '../../controllers/student/exploreController.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed'), false);
    }
  },
});

router.use(validateJWT);
router.use(requireRole('student'));

router.get('/dashboard',             getStudentDashboard);
router.get('/profile',               getProfile);
router.patch('/profile',             updateProfile);
router.get('/scores',                listScores);
router.post('/scores',               addScore);
router.patch('/scores/:id',          updateScore);
router.delete('/scores/:id',         deleteScore);
router.get('/predictions',           listPredictions);
router.post('/predictions/generate', generatePredictions);
router.delete('/predictions',        clearPredictions);
router.get('/branches',              listBranchNames);
router.get('/college-preferences',        listCollegePreferences);
router.post('/college-preferences',       addCollegePreference);
router.delete('/college-preferences/:id', removeCollegePreference);
router.get('/reports/summary',            generateStudentSummaryReport);
router.get('/notifications',              listNotifications);
router.patch('/notifications/read-all',   markAllRead);
router.patch('/notifications/:id/read',   markRead);
router.get('/explore/colleges',              listExploreColleges);
router.get('/explore/sponsored',             listSponsoredColleges);
router.get('/explore/bookmarks',             listBookmarks);
router.post('/explore/bookmarks',            addBookmark);
router.delete('/explore/bookmarks/:topCollegeId', removeBookmark);
router.get('/sessions/request',           getSessionRequest);     // before /sessions
router.post('/sessions/request',          createSessionRequest);
router.get('/sessions',                   listSessions);
router.get('/documents',             listDocuments);
router.post('/documents',            upload.single('file'), uploadDocument);
router.delete('/documents/:id',      deleteDocument);

export default router;
