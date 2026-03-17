import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { errors } from '../utils/errors.js';
import type { JwtPayload } from '../types/index.js';
import { ScopePermissionService } from './scopePermission.service.js';

const SALT_ROUNDS = 10;
const scopePermissionService = new ScopePermissionService();

export type LoginUser = {
  email: string;
  roleName: string;
  employeeId: string;
  scopePermissions?: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>;
};

async function userWithPermissions(user: { id: string; email: string; role: { name: string }; employeeId: string }): Promise<LoginUser> {
  const base = { email: user.email, roleName: user.role.name, employeeId: user.employeeId };
  if (user.role.name === 'hr_admin') {
    try {
      const scopePermissions = await scopePermissionService.getUserPermissionMap(user.id);
      return { ...base, scopePermissions };
    } catch {
      return { ...base, scopePermissions: {} };
    }
  }
  return base;
}

export class AuthService {
  async login(
    email: string | undefined,
    password: string | undefined,
    _rememberMe: boolean,
    _ip?: string
  ): Promise<{ accessToken: string; refreshToken: string; user: LoginUser }> {
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
    const userWithPerms = await userWithPermissions(user);
    return {
      accessToken,
      refreshToken,
      user: userWithPerms,
    };
  }

  async refresh(
    refreshToken: string | undefined
  ): Promise<{ accessToken: string; refreshToken: string; user: LoginUser }> {
    if (!refreshToken) throw errors.unauthorized('Refresh token required');
    try {
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as JwtPayload;
      if (decoded.type !== 'refresh') throw new Error('Invalid token type');
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        include: { role: true },
      });
      if (!user?.isActive) throw errors.unauthorized('User not found or inactive');
      const userWithPerms = await userWithPermissions(user);
      return {
        accessToken: this.createAccessToken(user),
        refreshToken: this.createRefreshToken(user),
        user: userWithPerms,
      };
    } catch {
      throw errors.unauthorized('Invalid or expired refresh token');
    }
  }

  /** Returns current user with scopePermissions for hr_admin. Used to refresh sidebar permissions without re-login. */
  async getMe(userId: string): Promise<LoginUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user?.isActive) throw errors.unauthorized('User not found or inactive');
    return userWithPermissions(user);
  }

  /** Microsoft authority tenant: use tenant ID for single-tenant app, 'common' for multi-tenant. */
  private getMicrosoftAuthority(): string {
    const tenant = env.MICROSOFT_TENANT_ID.trim() || 'common';
    return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0`;
  }

  /** Returns Microsoft OAuth2 authorize URL for SSO, or null if not configured. */
  getMicrosoftAuthUrl(redirectUri: string): string | null {
    if (!env.MICROSOFT_CLIENT_ID) return null;
    const params = new URLSearchParams({
      client_id: env.MICROSOFT_CLIENT_ID,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: 'openid email profile User.Read',
      prompt: 'select_account',
    });
    return `${this.getMicrosoftAuthority()}/authorize?${params.toString()}`;
  }

  /** Exchange Microsoft authorization code for tokens, get profile, find HRMS user by email, return our tokens. */
  async loginWithMicrosoftCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken: string; user: LoginUser }> {
    if (!env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET) throw errors.badRequest('Microsoft SSO is not configured');

    const tokenRes = await fetch(`${this.getMicrosoftAuthority()}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.MICROSOFT_CLIENT_ID,
        client_secret: env.MICROSOFT_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw errors.unauthorized('Microsoft sign-in failed. Please try again.');
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
    const accessTokenMs = tokenData.access_token;
    if (!accessTokenMs) throw errors.unauthorized('Microsoft sign-in failed. No token received.');

    const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessTokenMs}` },
    });
    if (!meRes.ok) throw errors.unauthorized('Microsoft sign-in failed. Could not load profile.');
    const profile = (await meRes.json()) as { mail?: string; userPrincipalName?: string };
    const email = (profile.mail || profile.userPrincipalName || '').trim().toLowerCase();
    if (!email) throw errors.unauthorized('Microsoft account has no email.');

    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
      include: { role: true },
    });
    if (!user) throw errors.unauthorized('No HRMS account found for this Microsoft account. Contact your administrator.');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const ourAccessToken = this.createAccessToken(user);
    const ourRefreshToken = this.createRefreshToken(user);
    const userWithPerms = await userWithPermissions(user);
    return {
      accessToken: ourAccessToken,
      refreshToken: ourRefreshToken,
      user: userWithPerms,
    };
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
