export type ApiSuccess<T = unknown> = {
  success: true;
  data: T;
  message?: string;
  meta?: { page?: number; limit?: number; total?: number };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface JwtPayload {
  sub: string;
  email: string;
  roleId: number;
  roleName: string;
  employeeId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  userId: string;
  email: string;
  roleId: number;
  roleName: string;
  employeeId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
