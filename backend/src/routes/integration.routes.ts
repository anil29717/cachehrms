import { Router } from 'express';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { listEmployees, getEmployee, getEmployeeFull, getEmployeeSingle } from '../controllers/integration.controller.js';

const router = Router();

// Single endpoint: GET /integration/employee?code=... | id=... | email=... (returns fields selected for this API key)
router.get('/employee', apiKeyAuth, (req, res, next) => getEmployeeSingle(req, res, next));

router.get('/employees', apiKeyAuth, (req, res, next) => listEmployees(req, res, next));
router.get('/employees/:id/full', apiKeyAuth, (req, res, next) => getEmployeeFull(req, res, next));
router.get('/employees/:id', apiKeyAuth, (req, res, next) => getEmployee(req, res, next));

export const integrationRoutes = router;
