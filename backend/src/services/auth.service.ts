import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { errors } from '../utils/errors.js';
import type { JwtPayload } from '../types/index.js';

const SALT_ROUNDS = 10;

export class AuthService {
  async login(
    email: string | undefined,
    password: string | undefined,
    _rememberMe: boolean,
    _ip?: string
  ): Promise<{ accessToken: string; refreshToken: string; user: { email: string; roleName: string; employeeId: string } }> {
    if (!email || !password) throw errors.badRequest('Email and password are required');

    const user = await prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), isActive: true },
      include: { role: true, employee: true },
    });
    if (!user) throw errors.unauthorized('Invalid email or password');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw errors.unauthorized('Invalid email or password');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const accessToken = this.createAccessToken(user);
    const refreshToken = this.createRefreshToken(user);
    return {
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        roleName: user.role.name,
        employeeId: user.employeeId,
      },
    };
  }

  async refresh(refreshToken: string | undefined): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) throw errors.unauthorized('Refresh token required');
    try {
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as JwtPayload;
      if (decoded.type !== 'refresh') throw new Error('Invalid token type');
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { role: true },
      });
      if (!user?.isActive) throw errors.unauthorized('User not found or inactive');
      return {
        accessToken: this.createAccessToken(user),
        refreshToken: this.createRefreshToken(user),
      };
    } catch {
      throw errors.unauthorized('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string | undefined): Promise<void> {
    if (!email) throw errors.badRequest('Email is required');
    // TODO: Generate OTP, store in DB/cache, send email. For now no-op.
  }

  async resetPassword(token: string | undefined, newPassword: string | undefined): Promise<void> {
    if (!token || !newPassword) throw errors.badRequest('Token and new password are required');
    // TODO: Validate OTP token, update password. For now no-op.
  }

  private createAccessToken(user: { id: string; email: string; roleId: number; role: { name: string }; employeeId: string }): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      employeeId: user.employeeId,
      type: 'access',
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
  }

  private createRefreshToken(user: { id: string; email: string; roleId: number; role: { name: string }; employeeId: string }): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      employeeId: user.employeeId,
      type: 'refresh',
    };
    return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRY });
  }
}
