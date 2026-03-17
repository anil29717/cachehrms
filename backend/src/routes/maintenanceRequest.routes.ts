import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listMaintenanceRequests,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  updateMaintenanceRequest,
} from '../controllers/maintenanceRequest.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('assets'));

router.get('/', (req, res, next) => listMaintenanceRequests(req, res, next));
router.get('/:id', (req, res, next) => getMaintenanceRequestById(req, res, next));
router.post('/', (req, res, next) => createMaintenanceRequest(req, res, next));
router.put('/:id', requireHROrAdmin, (req, res, next) => updateMaintenanceRequest(req, res, next));

export const maintenanceRequestRoutes = router;
