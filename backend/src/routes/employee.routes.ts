import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listEmployees,
  getEmployee,
  createEmployee,
} from '../controllers/employee.controller.js';

const router = Router();

router.get('/', authMiddleware, (req, res, next) => listEmployees(req, res, next));
router.get('/:id', authMiddleware, (req, res, next) => getEmployee(req, res, next));
router.post('/', authMiddleware, requireHROrAdmin, (req, res, next) => createEmployee(req, res, next));

export const employeeRoutes = router;
