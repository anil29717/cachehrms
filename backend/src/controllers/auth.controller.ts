import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

const authService = new AuthService();

export class AuthController {
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
}
