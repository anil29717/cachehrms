import { Router } from 'express';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { listEmployees, getEmployee } from '../controllers/integration.controller.js';

const router = Router();

router.get('/employees', apiKeyAuth, (req, res, next) => listEmployees(req, res, next));
router.get('/employees/:id', apiKeyAuth, (req, res, next) => getEmployee(req, res, next));

export const integrationRoutes = router;
