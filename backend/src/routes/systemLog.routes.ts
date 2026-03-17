import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { listSystemLogs } from '../controllers/systemLog.controller.js';

const router = Router();

router.use(authMiddleware);
router.get('/', requireAdmin, (req, res, next) => listSystemLogs(req, res, next));

export const systemLogRoutes = router;
