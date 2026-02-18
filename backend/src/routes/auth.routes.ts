import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();
const controller = new AuthController();

router.post('/login', (req, res, next) => controller.login(req, res, next));
router.post('/refresh', (req, res, next) => controller.refresh(req, res, next));
router.post('/forgot-password', (req, res, next) => controller.forgotPassword(req, res, next));
router.post('/reset-password', (req, res, next) => controller.resetPassword(req, res, next));

export const authRoutes = router;
