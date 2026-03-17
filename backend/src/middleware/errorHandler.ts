import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { sendError } from '../utils/response.js';
import { errors } from '../utils/errors.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, errors.badRequest('File too large. Max 5MB (photo: 2MB).'));
      return;
    }
    sendError(res, errors.badRequest(err.message || 'File upload error'));
    return;
  }
  sendError(res, err);
}
