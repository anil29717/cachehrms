import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
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

// Attendance (any authenticated user)
router.post('/check-in', authMiddleware, (req, res, next) => checkIn(req, res, next));
router.post('/check-out', authMiddleware, (req, res, next) => checkOut(req, res, next));
router.get('/today', authMiddleware, (req, res, next) => getToday(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => getMyHistory(req, res, next));
router.get('/team', authMiddleware, (req, res, next) => getTeamAttendance(req, res, next));
router.get('/department', authMiddleware, requireHROrAdmin, (req, res, next) => getDepartmentAttendance(req, res, next));
router.get('/report', authMiddleware, requireHROrAdmin, (req, res, next) => getMonthlyReport(req, res, next));

// Shifts (HR / Admin)
router.get('/shifts', authMiddleware, (req, res, next) => listShifts(req, res, next));
router.get('/shifts/:id', authMiddleware, (req, res, next) => getShift(req, res, next));
router.post('/shifts', authMiddleware, requireHROrAdmin, (req, res, next) => createShift(req, res, next));
router.put('/shifts/:id', authMiddleware, requireHROrAdmin, (req, res, next) => updateShift(req, res, next));

export const attendanceRoutes = router;
