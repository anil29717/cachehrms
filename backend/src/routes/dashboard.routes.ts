import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDashboardStats } from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', authMiddleware, (req, res, next) => getDashboardStats(req, res, next));

export const dashboardRoutes = router;
