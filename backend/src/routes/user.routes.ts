import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listRoles,
  listUsers,
  listEmployeesWithoutUser,
  createUser,
  updateUser,
} from '../controllers/user.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireHROrAdmin);

router.get('/roles', (req, res, next) => listRoles(req, res, next));
router.get('/', (req, res, next) => listUsers(req, res, next));
router.get('/employees-without-user', (req, res, next) => listEmployeesWithoutUser(req, res, next));
router.post('/', (req, res, next) => createUser(req, res, next));
router.put('/:id', (req, res, next) => updateUser(req, res, next));

export const userRoutes = router;
