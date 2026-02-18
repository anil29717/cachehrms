import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { dashboardRoutes } from './dashboard.routes.js';
import { departmentRoutes } from './department.routes.js';
import { employeeRoutes } from './employee.routes.js';
import { apiAccessRoutes } from './apiAccess.routes.js';
import { integrationRoutes } from './integration.routes.js';
import { attendanceRoutes } from './attendance.routes.js';
import { leaveRoutes } from './leave.routes.js';
import { payrollRoutes } from './payroll.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave', leaveRoutes);
router.use('/payroll', payrollRoutes);
router.use('/settings/api-access', apiAccessRoutes);
router.use('/integration', integrationRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

export const apiRoutes = router;
