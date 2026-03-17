import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import { listTicketCategories, createTicketCategory } from '../controllers/ticketCategory.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('tickets'));

router.get('/', (req, res, next) => listTicketCategories(req, res, next));
router.post('/', requireHROrAdmin, (req, res, next) => createTicketCategory(req, res, next));

export const ticketCategoryRoutes = router;
