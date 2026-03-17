import type { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';
import { errors } from '../utils/errors.js';

const userService = new UserService();

export async function listRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await userService.listRoles();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await userService.listUsers();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function listEmployeesWithoutUser(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const list = await userService.listEmployeesWithoutUser();
    sendSuccess(res, list);
  } catch (e) {
    next(e);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as { employeeId?: string; email?: string; password?: string; roleId?: number };
    if (!body.employeeId || !body.email || !body.password || body.roleId == null) {
      next(errors.badRequest('employeeId, email, password and roleId are required'));
      return;
    }
    const user = await userService.createUser({
      employeeId: body.employeeId,
      email: body.email.trim(),
      password: body.password,
      roleId: body.roleId,
    });
    sendSuccess(res, user, 'User created. They can now log in with the given email and password.');
  } catch (e) {
    next(e);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    if (!id) {
      next(errors.badRequest('User ID required'));
      return;
    }
    const body = req.body as { roleId?: number; isActive?: boolean };
    const user = await userService.updateUser(id, {
      roleId: body.roleId,
      isActive: body.isActive,
    });
    sendSuccess(res, user, 'User updated');
  } catch (e) {
    next(e);
  }
}
