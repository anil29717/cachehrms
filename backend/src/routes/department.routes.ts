import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
} from '../controllers/department.controller.js';

const router = Router();

router.get('/', authMiddleware, (req, res, next) => listDepartments(req, res, next));
router.get('/:id', authMiddleware, (req, res, next) => getDepartment(req, res, next));
router.post('/', authMiddleware, requireHROrAdmin, (req, res, next) => createDepartment(req, res, next));
router.put('/:id', authMiddleware, requireHROrAdmin, (req, res, next) => updateDepartment(req, res, next));

export const departmentRoutes = router;
