import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listExpenseClaims,
  getExpenseClaimById,
  createExpenseClaim,
  approveManager,
  approveFinance,
  approveHr,
  markPaid,
  rejectClaim,
  expenseReport,
} from '../controllers/expenseClaim.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('expenses'));

router.get('/', (req, res, next) => listExpenseClaims(req, res, next));
router.get('/report', (req, res, next) => expenseReport(req, res, next));
router.get('/:id', (req, res, next) => getExpenseClaimById(req, res, next));
router.post('/', (req, res, next) => createExpenseClaim(req, res, next));
router.post('/:id/approve-manager', (req, res, next) =>
  approveManager(req, res, next)
);
router.post('/:id/approve-finance', requireHROrAdmin, (req, res, next) =>
  approveFinance(req, res, next)
);
router.post('/:id/approve-hr', requireHROrAdmin, (req, res, next) =>
  approveHr(req, res, next)
);
router.post('/:id/paid', requireHROrAdmin, (req, res, next) =>
  markPaid(req, res, next)
);
router.post('/:id/reject', (req, res, next) => rejectClaim(req, res, next));

export const expenseClaimRoutes = router;
