import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  listRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/room.controller.js';
import { getRoomAvailability } from '../controllers/booking.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('booking'));

// Rooms: list and get for all; create/update/delete for HR/Admin
router.get('/', (req, res, next) => listRooms(req, res, next));
router.get('/:id/availability', (req, res, next) => getRoomAvailability(req, res, next));
router.get('/:id', (req, res, next) => getRoomById(req, res, next));
router.post('/', requireHROrAdmin, (req, res, next) => createRoom(req, res, next));
router.put('/:id', requireHROrAdmin, (req, res, next) => updateRoom(req, res, next));
router.delete('/:id', requireHROrAdmin, (req, res, next) => deleteRoom(req, res, next));

export const roomRoutes = router;
