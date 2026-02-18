import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getMyBalances,
  getMyRequests,
  getRequestById,
  applyLeave,
  cancelLeave,
  listPendingApprovals,
  approveLeave,
  rejectLeave,
} from '../controllers/leave.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/balances', (req, res, next) => getMyBalances(req, res, next));
router.get('/requests', (req, res, next) => getMyRequests(req, res, next));
router.get('/requests/:id', (req, res, next) => getRequestById(req, res, next));
router.post('/apply', (req, res, next) => applyLeave(req, res, next));
router.post('/requests/:id/cancel', (req, res, next) => cancelLeave(req, res, next));

router.get('/pending', (req, res, next) => listPendingApprovals(req, res, next));
router.post('/requests/:id/approve', (req, res, next) => approveLeave(req, res, next));
router.post('/requests/:id/reject', (req, res, next) => rejectLeave(req, res, next));

export const leaveRoutes = router;
