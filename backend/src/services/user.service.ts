import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { errors } from '../utils/errors.js';

const SALT_ROUNDS = 10;

export type CreateUserInput = {
  employeeId: string; // employeeCode
  email: string;
  password: string;
  roleId: number;
};

export class UserService {
  async listRoles() {
    const roles = await prisma.role.findMany({
      orderBy: { hierarchyLevel: 'asc' },
      select: { id: true, name: true, description: true, hierarchyLevel: true },
    });
    return roles;
  }

  async listUsers() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        role: { select: { id: true, name: true } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true, email: true } },
      },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      isActive: u.isActive,
      lastLogin: u.lastLogin?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      roleId: u.roleId,
      roleName: u.role.name,
      employeeId: u.employeeId,
      employeeCode: u.employee.employeeCode,
      employeeName: `${u.employee.firstName} ${u.employee.lastName}`.trim(),
    }));
  }

  /** Employees who do not have a user (login) yet */
  async listEmployeesWithoutUser() {
    const users = await prisma.user.findMany({ select: { employeeId: true } });
    const linkedIds = new Set(users.map((u) => u.employeeId));
    const employees = await prisma.employee.findMany({
      where: { status: 'active', employeeCode: { notIn: [...linkedIds] } },
      select: { employeeCode: true, firstName: true, lastName: true, email: true },
      orderBy: { employeeCode: 'asc' },
    });
    return employees.map((e) => ({
      employeeCode: e.employeeCode,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      displayName: `${e.firstName} ${e.lastName}`.trim() + ` (${e.employeeCode})`,
    }));
  }

  async createUser(data: CreateUserInput) {
    const email = data.email.trim().toLowerCase();
    if (!email) throw errors.badRequest('Email is required');
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw errors.conflict('A user with this email already exists');

    const employee = await prisma.employee.findUnique({
      where: { employeeCode: data.employeeId },
    });
    if (!employee) throw errors.notFound('Employee');

    const existingLink = await prisma.user.findFirst({
      where: { employeeId: data.employeeId },
    });
    if (existingLink) throw errors.conflict('This employee already has a login account');

    const role = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role) throw errors.badRequest('Invalid role');

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        employeeId: data.employeeId,
        email,
        passwordHash,
        defaultPassword: data.password,
        roleId: data.roleId,
        isActive: true,
      },
      include: {
        role: { select: { name: true } },
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      },
    });
    return {
      id: user.id,
      email: user.email,
      roleName: user.role.name,
      employeeId: user.employeeId,
      employeeName: `${user.employee.firstName} ${user.employee.lastName}`.trim(),
      employeeCode: user.employee.employeeCode,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateUser(userId: string, data: { roleId?: number; isActive?: boolean }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, employee: true },
    });
    if (!user) throw errors.notFound('User');

    if (data.roleId != null) {
      const role = await prisma.role.findUnique({ where: { id: data.roleId } });
      if (!role) throw errors.badRequest('Invalid role');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.roleId != null && { roleId: data.roleId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        role: { select: { id: true, name: true } },
        employee: { select: { employeeCode: true, firstName: true, lastName: true } },
      },
    });
    return {
      id: updated.id,
      email: updated.email,
      roleId: updated.roleId,
      roleName: updated.role.name,
      isActive: updated.isActive,
      employeeId: updated.employeeId,
      employeeName: `${updated.employee.firstName} ${updated.employee.lastName}`.trim(),
      employeeCode: updated.employee.employeeCode,
    };
  }
}
