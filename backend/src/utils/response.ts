import type { Response } from 'express';
import type { ApiSuccess, ApiError } from '../types/index.js';
import { AppError } from './errors.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  meta?: ApiSuccess['meta']
): void {
  const body: ApiSuccess<T> = { success: true, data, ...(message && { message }), ...(meta && { meta }) };
  res.json(body);
}

export function sendError(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    const body: ApiError = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    };
    res.status(error.statusCode).json(body);
    return;
  }
  const body: ApiError = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Internal server error',
    },
  };
  res.status(500).json(body);
}
