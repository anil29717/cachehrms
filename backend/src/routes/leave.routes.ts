import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  getMyBalances,
  getMyRequests,
  getRequestById,
  applyLeave,
  cancelLeave,
  listPendingApprovals,
  approveLeave,
  rejectLeave,
  listAllRequests,
  getCalendarEvents,
  listAllBalances,
  upsertBalance,
  listPolicies,
  createPolicy,
  updatePolicy,
} from '../controllers/leave.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('leave'));

// Self / reportee
router.get('/balances', (req, res, next) => getMyBalances(req, res, next));
router.get('/requests', (req, res, next) => getMyRequests(req, res, next));
router.get('/requests/all', requireAdmin, (req, res, next) => listAllRequests(req, res, next));
router.get('/requests/:id', (req, res, next) => getRequestById(req, res, next));
router.post('/apply', (req, res, next) => applyLeave(req, res, next));
router.post('/requests/:id/cancel', (req, res, next) => cancelLeave(req, res, next));
router.get('/pending', (req, res, next) => listPendingApprovals(req, res, next));
router.post('/requests/:id/approve', (req, res, next) => approveLeave(req, res, next));
router.post('/requests/:id/reject', (req, res, next) => rejectLeave(req, res, next));

// Policies: list allowed for all (e.g. apply form); create/update admin only
router.get('/policies', (req, res, next) => listPolicies(req, res, next));
router.post('/policies', requireAdmin, (req, res, next) => createPolicy(req, res, next));
router.put('/policies/:id', requireAdmin, (req, res, next) => updatePolicy(req, res, next));

// Super admin: calendar, all balances, upsert balance
router.get('/calendar', requireAdmin, (req, res, next) => getCalendarEvents(req, res, next));
router.get('/balances/all', requireAdmin, (req, res, next) => listAllBalances(req, res, next));
router.post('/balances/upsert', requireAdmin, (req, res, next) => upsertBalance(req, res, next));

export const leaveRoutes = router;
