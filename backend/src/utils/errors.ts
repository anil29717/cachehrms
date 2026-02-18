export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errors = {
  unauthorized: (msg = 'Unauthorized') => new AppError('UNAUTHORIZED', msg, 401),
  forbidden: (msg = 'Forbidden') => new AppError('FORBIDDEN', msg, 403),
  notFound: (resource: string) => new AppError('NOT_FOUND', `${resource} not found`, 404),
  badRequest: (msg: string, details?: Record<string, unknown>) =>
    new AppError('BAD_REQUEST', msg, 400, details),
  conflict: (msg: string) => new AppError('CONFLICT', msg, 409),
};
