import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  listApiAccess,
  createApiAccess,
  revokeApiAccess,
  deleteApiAccess,
  listApiAccessLogs,
} from '../controllers/apiAccess.controller.js';

const router = Router();

router.get('/', authMiddleware, requireAdmin, (req, res, next) => listApiAccess(req, res, next));
router.get('/logs', authMiddleware, requireAdmin, (req, res, next) => listApiAccessLogs(req, res, next));
router.post('/', authMiddleware, requireAdmin, (req, res, next) => createApiAccess(req, res, next));
router.post('/:id/revoke', authMiddleware, requireAdmin, (req, res, next) => revokeApiAccess(req, res, next));
router.delete('/:id', authMiddleware, requireAdmin, (req, res, next) => deleteApiAccess(req, res, next));

export const apiAccessRoutes = router;
