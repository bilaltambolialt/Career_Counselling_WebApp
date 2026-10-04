import { Router } from 'express';
import { validateJWT } from '../../middleware/auth.js';
import { listColleges, getCollegeBranches } from '../../controllers/colleges/collegesController.js';

const router = Router();

// Accessible by all authenticated roles
router.use(validateJWT);

router.get('/',              listColleges);
router.get('/:id/branches',  getCollegeBranches);

export default router;
