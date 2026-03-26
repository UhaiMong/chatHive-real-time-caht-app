import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from './auth.controller';
import { authenticate } from '../../shared/middlewares/authenticate';

const router = Router();

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 2, max: 30 }).withMessage('Username must be 2–30 chars'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  authController.login
);

router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
