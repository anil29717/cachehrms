import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listExpenseTypes,
  getExpenseTypeById,
  createExpenseType,
  updateExpenseType,
} from '../controllers/expenseType.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('expenses'));

router.get('/', (req, res, next) => listExpenseTypes(req, res, next));
router.get('/:id', (req, res, next) => getExpenseTypeById(req, res, next));
router.post('/', requireHROrAdmin, (req, res, next) =>
  createExpenseType(req, res, next)
);
router.put('/:id', requireHROrAdmin, (req, res, next) =>
  updateExpenseType(req, res, next)
);

export const expenseTypeRoutes = router;
