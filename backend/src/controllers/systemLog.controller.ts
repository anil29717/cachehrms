import type { Request, Response, NextFunction } from 'express';
import { SystemLogService } from '../services/systemLog.service.js';
import { sendSuccess } from '../utils/response.js';

const service = new SystemLogService();

export async function listSystemLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.query.userId as string | undefined;
    const employeeId = req.query.employeeId as string | undefined;
    const method = req.query.method as string | undefined;
    const path = req.query.path as string | undefined;
    const statusCode = req.query.statusCode ? parseInt(String(req.query.statusCode), 10) : undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : undefined;

    const result = await service.list({
      userId,
      employeeId,
      method,
      pathContains: path,
      statusCode,
      from,
      to,
      limit,
      offset,
    });

    sendSuccess(res, result.items, undefined, { total: result.total });
  } catch (e) {
    next(e);
  }
}
