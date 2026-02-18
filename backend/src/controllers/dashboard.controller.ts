import type { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.js';

const dashboardService = new DashboardService();

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const stats = await dashboardService.getStats(user.roleName, user.employeeId);
    sendSuccess(res, stats);
  } catch (e) {
    next(e);
  }
}
