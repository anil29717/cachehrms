import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import {
  listTickets,
  getTicketById,
  createTicket,
  updateTicket,
  ticketStats,
  reportVolume,
  reportResolutionTime,
} from '../controllers/ticket.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('tickets'));

router.get('/stats', (req, res, next) => ticketStats(req, res, next));
router.get('/', (req, res, next) => listTickets(req, res, next));
router.get('/reports/volume', (req, res, next) => reportVolume(req, res, next));
router.get('/reports/resolution-time', (req, res, next) => reportResolutionTime(req, res, next));
router.get('/:id', (req, res, next) => getTicketById(req, res, next));
router.post('/', (req, res, next) => createTicket(req, res, next));
router.put('/:id', (req, res, next) => updateTicket(req, res, next));

export const ticketRoutes = router;
