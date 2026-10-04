import { Router } from 'express';
import { submitInquiry } from '../../controllers/public/inquiryController.js';

const router = Router();

// Public — no auth required
router.post('/inquiry', submitInquiry);

export default router;
