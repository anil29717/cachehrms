import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireScopeView } from '../middleware/requireScope.js';
import { requireHROrAdmin } from '../middleware/requireHROrAdmin.js';
import {
  checkIn,
  checkOut,
  getToday,
  getMyHistory,
  getTeamAttendance,
  getDepartmentAttendance,
  getMonthlyReport,
} from '../controllers/attendance.controller.js';
import {
  listShifts,
  getShift,
  createShift,
  updateShift,
} from '../controllers/shift.controller.js';

const router = Router();

router.use(authMiddleware);
router.use(requireScopeView('attendance'));

// Attendance (any authenticated user)
router.post('/check-in', (req, res, next) => checkIn(req, res, next));
router.post('/check-out', (req, res, next) => checkOut(req, res, next));
router.get('/today', (req, res, next) => getToday(req, res, next));
router.get('/me', (req, res, next) => getMyHistory(req, res, next));
router.get('/team', (req, res, next) => getTeamAttendance(req, res, next));
router.get('/department', requireHROrAdmin, (req, res, next) => getDepartmentAttendance(req, res, next));
router.get('/report', requireHROrAdmin, (req, res, next) => getMonthlyReport(req, res, next));

// Shifts (HR / Admin)
router.get('/shifts', (req, res, next) => listShifts(req, res, next));
router.get('/shifts/:id', (req, res, next) => getShift(req, res, next));
router.post('/shifts', requireHROrAdmin, (req, res, next) => createShift(req, res, next));
router.put('/shifts/:id', requireHROrAdmin, (req, res, next) => updateShift(req, res, next));

export const attendanceRoutes = router;
