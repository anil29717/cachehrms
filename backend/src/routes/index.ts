import { Router } from 'express';
import { auditLogMiddleware } from '../middleware/auditLog.js';
import { authRoutes } from './auth.routes.js';
import { dashboardRoutes } from './dashboard.routes.js';
import { departmentRoutes } from './department.routes.js';
import { employeeRoutes } from './employee.routes.js';
import { apiAccessRoutes } from './apiAccess.routes.js';
import { integrationRoutes } from './integration.routes.js';
import { attendanceRoutes } from './attendance.routes.js';
import { leaveRoutes } from './leave.routes.js';
import { payrollRoutes } from './payroll.routes.js';
import { userRoutes } from './user.routes.js';
import { roomRoutes } from './room.routes.js';
import { bookingRoutes } from './booking.routes.js';
import { assetCategoryRoutes } from './assetCategory.routes.js';
import { assetRoutes } from './asset.routes.js';
import { assetAllocationRoutes } from './assetAllocation.routes.js';
import { maintenanceRequestRoutes } from './maintenanceRequest.routes.js';
import { ticketCategoryRoutes } from './ticketCategory.routes.js';
import { ticketRoutes } from './ticket.routes.js';
import { expenseTypeRoutes } from './expenseType.routes.js';
import { expenseClaimRoutes } from './expenseClaim.routes.js';
import { announcementRoutes } from './announcement.routes.js';
import { onboardingRoutes } from './onboarding.routes.js';
import { systemLogRoutes } from './systemLog.routes.js';
import { scopePermissionRoutes } from './scopePermission.routes.js';

const router = Router();

router.use(auditLogMiddleware);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave', leaveRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);
router.use('/asset-categories', assetCategoryRoutes);
router.use('/assets', assetRoutes);
router.use('/asset-allocations', assetAllocationRoutes);
router.use('/maintenance-requests', maintenanceRequestRoutes);
router.use('/ticket-categories', ticketCategoryRoutes);
router.use('/tickets', ticketRoutes);
router.use('/expense-types', expenseTypeRoutes);
router.use('/expense-claims', expenseClaimRoutes);
router.use('/announcements', announcementRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/payroll', payrollRoutes);
router.use('/settings/api-access', apiAccessRoutes);
router.use('/settings/users', userRoutes);
router.use('/integration', integrationRoutes);
router.use('/system-logs', systemLogRoutes);
router.use('/settings/permissions', scopePermissionRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

export const apiRoutes = router;
