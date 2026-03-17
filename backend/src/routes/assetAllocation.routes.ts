import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listAllocated,
  listHistory,
  assignAsset,
  returnAsset,
} from '../controllers/assetAllocation.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('assets'));

router.get('/', (req, res, next) => listAllocated(req, res, next));
router.get('/history', (req, res, next) => listHistory(req, res, next));
router.post('/assign', requireHROrAdmin, (req, res, next) => assignAsset(req, res, next));
router.post('/:id/return', requireHROrAdmin, (req, res, next) => returnAsset(req, res, next));

export const assetAllocationRoutes = router;
