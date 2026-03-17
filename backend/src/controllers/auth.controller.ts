import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';
import { env } from '../config/env.js';

const authService = new AuthService();

function getMicrosoftCallbackRedirectUri(req: Request): string {
  const base = `${req.protocol}://${req.get('host') || `localhost:${env.PORT}`}${env.API_PREFIX}`;
  return `${base}/auth/microsoft/callback`;
}

export class AuthController {
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
        return;
      }
      const user = await authService.getMe(userId);
      sendSuccess(res, user);
    } catch (e) {
      next(e);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, rememberMe } = req.body as {
        email?: string;
        password?: string;
        rememberMe?: boolean;
      };
      const result = await authService.login(email, password, rememberMe ?? false, req.ip);
      sendSuccess(res, result, 'Login successful');
    } catch (e) {
      next(e);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      const result = await authService.refresh(refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (e) {
      next(e);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as { email?: string };
      await authService.forgotPassword(email);
      sendSuccess(res, { message: 'If the email exists, a reset link has been sent.' });
    } catch (e) {
      next(e);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body as { token?: string; newPassword?: string };
      await authService.resetPassword(token, newPassword);
      sendSuccess(res, { message: 'Password reset successful' });
    } catch (e) {
      next(e);
    }
  }

  /** Redirect to Microsoft login for SSO. If query check=1, return { enabled } instead (for frontend to show/hide button). */
  async microsoftRedirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const redirectUri = getMicrosoftCallbackRedirectUri(req);
      const url = authService.getMicrosoftAuthUrl(redirectUri);
      if (req.query.check === '1') {
        res.json({ success: true, data: { enabled: !!url } });
        return;
      }
      if (!url) {
        res.status(400).json({ success: false, error: { code: 'NOT_CONFIGURED', message: 'Microsoft SSO is not configured' } });
        return;
      }
      res.redirect(302, url);
    } catch (e) {
      next(e);
    }
  }

  /** Handle Microsoft callback: exchange code, log in user, redirect to frontend with tokens in hash. */
  async microsoftCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    const frontendLogin = `${env.FRONTEND_URL.replace(/\/$/, '')}/login`;
    try {
      const { code, error, error_description } = req.query as { code?: string; error?: string; error_description?: string };
      if (error) {
        const message = error_description ? `${error}: ${error_description}` : error;
        res.redirect(302, `${frontendLogin}?sso_error=${encodeURIComponent(message)}`);
        return;
      }
      if (!code) {
        res.redirect(302, `${frontendLogin}?sso_error=${encodeURIComponent('No authorization code received')}`);
        return;
      }
      const redirectUri = getMicrosoftCallbackRedirectUri(req);
      const result = await authService.loginWithMicrosoftCode(code, redirectUri);
      const userEnc = Buffer.from(JSON.stringify(result.user), 'utf8').toString('base64url');
      const hash = `access_token=${encodeURIComponent(result.accessToken)}&refresh_token=${encodeURIComponent(result.refreshToken)}&user=${encodeURIComponent(userEnc)}`;
      res.redirect(302, `${frontendLogin}#${hash}`);
    } catch (e: unknown) {
      const err = e as { statusCode?: number; message?: string };
      const message = err?.message || 'Microsoft sign-in failed';
      res.redirect(302, `${frontendLogin}?sso_error=${encodeURIComponent(message)}`);
    }
  }
}
