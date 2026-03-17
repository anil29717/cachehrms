import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import {
  listBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
} from '../controllers/booking.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('booking'));

router.get('/', (req, res, next) => listBookings(req, res, next));
router.get('/:id', (req, res, next) => getBookingById(req, res, next));
router.post('/', (req, res, next) => createBooking(req, res, next));
router.put('/:id', (req, res, next) => updateBooking(req, res, next));
router.delete('/:id', (req, res, next) => cancelBooking(req, res, next));

export const bookingRoutes = router;
