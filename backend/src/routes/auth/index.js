import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, getMe, changePassword } from '../../controllers/auth/authController.js';
import { forgotPassword, resetPassword } from '../../controllers/auth/forgotPasswordController.js';
import { validateJWT } from '../../middleware/auth.js';

const router = Router();

// ─── Validation rules ───────────────────────────────────────

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role')
    .isIn(['super_admin', 'admin', 'counselor', 'student'])
    .withMessage('Invalid role'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
  body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
];

// ─── Routes ─────────────────────────────────────────────────

// Public routes
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require valid JWT)
router.get('/me', validateJWT, getMe);
router.post('/logout', logout); // stateless JWT — no validation needed on logout
router.post('/change-password', validateJWT, changePasswordValidation, changePassword);

export default router;
