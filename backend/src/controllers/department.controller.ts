import type { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/department.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const departmentService = new DepartmentService();

export async function listDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await departmentService.list();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function getDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      next(errors.badRequest('Invalid department ID'));
      return;
    }
    const department = await departmentService.getById(id);
    sendSuccess(res, department);
  } catch (e) {
    next(e);
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { name?: string; description?: string; headId?: string; parentId?: number; isActive?: boolean };
    const department = await departmentService.create({
      name: body.name ?? '',
      description: body.description,
      headId: body.headId,
      parentId: body.parentId,
      isActive: body.isActive,
    });
    sendSuccess(res, department, 'Department created', undefined);
  } catch (e) {
    next(e);
  }
}

export async function updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      next(errors.badRequest('Invalid department ID'));
      return;
    }
    const body = req.body as { name?: string; description?: string; headId?: string; parentId?: number; isActive?: boolean };
    const department = await departmentService.update(id, {
      name: body.name,
      description: body.description,
      headId: body.headId,
      parentId: body.parentId,
      isActive: body.isActive,
    });
    sendSuccess(res, department, 'Department updated', undefined);
  } catch (e) {
    next(e);
  }
}
