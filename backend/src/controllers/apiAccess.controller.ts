import type { Request, Response, NextFunction } from 'express';
import { ApiAccessService } from '../services/apiAccess.service.js';
import { SystemSettingService } from '../services/systemSetting.service.js';
import { EmployeeService } from '../services/employee.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const apiAccessService = new ApiAccessService();
const systemSettingService = new SystemSettingService();

export async function listApiAccess(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await apiAccessService.list();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function createApiAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as {
      clientName?: string;
      rateLimitPerHour?: number;
      expiresAt?: string;
      employeeFullFields?: string[];
    };
    const allowed = new Set(EmployeeService.FULL_PAYLOAD_FIELDS);
    const rawFields = Array.isArray(body.employeeFullFields) ? body.employeeFullFields : [];
    const employeeFullFields = rawFields.filter(
      (f) => typeof f === 'string' && allowed.has(f as (typeof EmployeeService.FULL_PAYLOAD_FIELDS)[number])
    );
    const record = await apiAccessService.create({
      clientName: body.clientName ?? '',
      rateLimitPerHour: body.rateLimitPerHour,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      employeeFullFields: employeeFullFields.length ? employeeFullFields : undefined,
    });
    sendSuccess(res, record, 'API key created. Copy and store it securely — it will not be shown again.');
  } catch (e) {
    next(e);
  }
}

export async function revokeApiAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('API access ID required'));
      return;
    }
    await apiAccessService.revoke(id);
    sendSuccess(res, { revoked: true }, 'API key revoked');
  } catch (e) {
    next(e);
  }
}

export async function deleteApiAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('API access ID required'));
      return;
    }
    await apiAccessService.delete(id);
    sendSuccess(res, { deleted: true }, 'API key deleted');
  } catch (e) {
    next(e);
  }
}

export async function listApiAccessLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const apiAccessId = req.query.apiAccessId as string | undefined;
    const page = req.query.page ? parseInt(String(req.query.page), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const result = await apiAccessService.listLogs({ apiAccessId, page, limit });
    sendSuccess(res, result.items, undefined, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (e) {
    next(e);
  }
}

/** GET: Admin gets the list of selectable fields and currently configured fields for employee full API. */
export async function getEmployeeApiFields(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const availableFields = [...EmployeeService.FULL_PAYLOAD_FIELDS];
    const configuredFields = await systemSettingService.getEmployeeFullApiFields();
    sendSuccess(res, {
      availableFields,
      configuredFields: configuredFields ?? null,
      description: 'Configure which fields the employee full API returns. Empty means all fields.',
    });
  } catch (e) {
    next(e);
  }
}

/** PUT: Admin sets which fields the employee full API returns. Body: { fields: string[] }. Empty = all fields. */
export async function setEmployeeApiFields(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { fields?: string[] };
    const allowed = new Set(EmployeeService.FULL_PAYLOAD_FIELDS);
    const raw = Array.isArray(body.fields) ? body.fields : [];
    const fields = raw.filter((f) => typeof f === 'string' && allowed.has(f as (typeof EmployeeService.FULL_PAYLOAD_FIELDS)[number]));
    await systemSettingService.setEmployeeFullApiFields(fields.length ? fields : null);
    sendSuccess(res, { configuredFields: fields.length ? fields : null }, 'Employee API fields updated.');
  } catch (e) {
    next(e);
  }
}

/** GET: Admin gets current subadmin titles (CTO/CFO/...) for employee externalSubRole dropdown. */
export async function getSubadminTitles(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const titles = await systemSettingService.getSubadminTitles();
    sendSuccess(res, { titles });
  } catch (e) {
    next(e);
  }
}

/** PUT: Admin sets subadmin titles (CTO/CFO/...). Body: { titles: string[] } */
export async function setSubadminTitles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { titles?: string[] };
    const titles = Array.isArray(body.titles) ? body.titles : [];
    const saved = await systemSettingService.setSubadminTitles(titles);
    sendSuccess(res, { titles: saved }, 'Subadmin titles updated.');
  } catch (e) {
    next(e);
  }
}
