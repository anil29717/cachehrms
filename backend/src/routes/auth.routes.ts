import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();
const controller = new AuthController();

router.get('/me', authMiddleware, (req, res, next) => controller.me(req, res, next));
router.get('/microsoft', (req, res, next) => controller.microsoftRedirect(req, res, next));
router.get('/microsoft/callback', (req, res, next) => controller.microsoftCallback(req, res, next));
router.post('/login', (req, res, next) => controller.login(req, res, next));
router.post('/refresh', (req, res, next) => controller.refresh(req, res, next));
router.post('/forgot-password', (req, res, next) => controller.forgotPassword(req, res, next));
router.post('/reset-password', (req, res, next) => controller.resetPassword(req, res, next));

export const authRoutes = router;
