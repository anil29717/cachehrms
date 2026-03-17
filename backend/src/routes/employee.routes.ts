import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listEmployees,
  getEmployee,
  getEmployeeFull,
  createEmployee,
  updateEmployee,
  updateEmployeeProfile,
  getDesignations,
  getWorkLocations,
} from '../controllers/employee.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('employees'));

router.get('/', (req, res, next) => listEmployees(req, res, next));
router.get('/designations', (req, res, next) => getDesignations(req, res, next));
router.get('/work-locations', (req, res, next) => getWorkLocations(req, res, next));
router.get('/:id/full', (req, res, next) => getEmployeeFull(req, res, next));
router.get('/:id', (req, res, next) => getEmployee(req, res, next));
router.post('/', requireHROrAdmin, (req, res, next) => createEmployee(req, res, next));
router.patch('/:id', requireHROrAdmin, (req, res, next) => updateEmployee(req, res, next));
router.put('/:id/profile', requireHROrAdmin, (req, res, next) => updateEmployeeProfile(req, res, next));

export const employeeRoutes = router;
