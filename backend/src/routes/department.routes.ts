import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
} from '../controllers/department.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('departments'));

router.get('/', (req, res, next) => listDepartments(req, res, next));
router.get('/:id', (req, res, next) => getDepartment(req, res, next));
router.post('/', requireHROrAdmin, (req, res, next) => createDepartment(req, res, next));
router.put('/:id', requireHROrAdmin, (req, res, next) => updateDepartment(req, res, next));

export const departmentRoutes = router;
